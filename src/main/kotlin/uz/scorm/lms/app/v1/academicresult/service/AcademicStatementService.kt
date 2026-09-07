package uz.scorm.lms.app.v1.academicresult.service

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.exam.model.AttendanceStatus
import uz.scorm.lms.app.v1.exam.model.ExamSessionStatus
import uz.scorm.lms.app.v1.exam.repository.*
import uz.scorm.lms.app.v1.exam.service.ExamSessionService

data class StatementStudentRow(
    val enrollmentId: Long, val fullName: String, val studentNumber: String,
    val attendance: String, val verified: Boolean, val score: Double?, val maximum: Double?,
    val percentage: Double?, val passingPercentage: Double, val passed: Boolean?, val comments: String?,
)
data class StatementDetail(val id: Long, val title: String, val status: String,
    val students: List<StatementStudentRow>, val completionProblems: List<String>)

@Service
class AcademicStatementService(
    private val sessions: ExamSessionRepository,
    private val attendance: ExamAttendanceRepository,
    private val results: ExamResultRepository,
    private val workflow: ExamSessionService,
    private val policy: AcademicPassingPolicy,
) {
    @Transactional(readOnly = true)
    fun detail(id: Long): StatementDetail {
        val session = sessions.findByIdAndDeletedFalse(id) ?: throw NoSuchElementException("Vedomost topilmadi")
        val roster = attendance.findAllByExamSessionIdAndDeletedFalseOrderByArrivalTimeAsc(id)
        val grades = results.findAllByExamSessionIdAndDeletedFalseOrderByScoreDesc(id).associateBy { it.enrollment.id }
        val problems = buildList {
            if (session.status != ExamSessionStatus.ONGOING) add(if (session.status == ExamSessionStatus.COMPLETED) "Vedomost yakunlangan" else "Avval imtihonni boshlash kerak")
            if (roster.isEmpty()) add("Talabalar ro'yxati bo'sh")
            val unresolved = roster.count { it.onsiteAttendanceRequired && it.attendanceStatus in setOf(AttendanceStatus.EXPECTED, AttendanceStatus.EXCUSE) }
            if (unresolved > 0) add("$unresolved ta talabaning davomati aniqlanmagan")
            val ungraded = roster.count { (!it.onsiteAttendanceRequired || it.attendanceStatus in setOf(AttendanceStatus.PRESENT, AttendanceStatus.LATE)) && it.enrollment.id !in grades }
            if (ungraded > 0) add("$ungraded ta qatnashuvchining bahosi kiritilmagan")
        }
        return StatementDetail(id, session.title, session.status.name, roster.map {
            val grade = grades[it.enrollment.id]
            val threshold = policy.threshold(it.enrollment)
            StatementStudentRow(requireNotNull(it.enrollment.id), it.enrollment.student.fullName,
                it.enrollment.student.studentNumber, it.attendanceStatus.name, it.verificationTime != null,
                grade?.score?.toDouble(), grade?.totalScore?.toDouble(), grade?.percentage, threshold,
                grade?.percentage?.let { score -> score >= threshold }, grade?.comments)
        }.sortedBy { it.fullName }, problems)
    }

    @Transactional
    fun complete(id: Long, actorId: Long): StatementDetail {
        // Preserve the same attendance, grading, status and audit rules as the teacher workflow.
        workflow.completeExamSession(id, null, actorId, true)
        return detail(id)
    }
}
