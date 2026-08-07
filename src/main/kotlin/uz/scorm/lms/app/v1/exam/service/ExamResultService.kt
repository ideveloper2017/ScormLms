package uz.scorm.lms.app.v1.exam.service

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.audit.service.AuditService
import uz.scorm.lms.app.v1.courses.repository.CourseEnrollmentRepository
import uz.scorm.lms.app.v1.courses.service.CourseAccessService
import uz.scorm.lms.app.v1.exam.dto.*
import uz.scorm.lms.app.v1.exam.model.*
import uz.scorm.lms.app.v1.exam.repository.*
import uz.scorm.lms.app.v1.user.repository.UserRepository
import java.math.BigDecimal
import java.math.RoundingMode
import java.time.Instant
import java.time.temporal.ChronoUnit

@Service
class ExamResultService(
    private val sessionRepository: ExamSessionRepository,
    private val attendanceRepository: ExamAttendanceRepository,
    private val resultRepository: ExamResultRepository,
    private val appealRepository: ExamAppealRepository,
    private val enrollmentRepository: CourseEnrollmentRepository,
    private val userRepository: UserRepository,
    private val courseAccessService: CourseAccessService,
    private val auditService: AuditService,
) {
    @Transactional
    fun record(sessionId: Long, enrollmentId: Long, request: RecordExamResultRequest, userId: Long, mayManageAll: Boolean): TeacherExamResultDto {
        require(request.enrollmentId == enrollmentId) { "Biriktiruv identifikatori mos emas" }
        val session = managedSession(sessionId, userId, mayManageAll)
        require(session.status == ExamSessionStatus.ONGOING) { "Natija faqat davom etayotgan imtihonda kiritiladi" }
        val enrollment = enrollmentRepository.findById(enrollmentId).orElseThrow { IllegalArgumentException("Talaba biriktiruvi topilmadi") }
        require(enrollment.course.id == session.course.id && !enrollment.deleted) { "Talaba ushbu kursga biriktirilmagan" }
        val attendance = attendanceRepository.findByExamSessionIdAndEnrollmentIdAndDeletedFalse(sessionId, enrollmentId)
            ?: throw IllegalArgumentException("Davomat yozuvi topilmadi")
        require(!attendance.onsiteAttendanceRequired ||
            (attendance.attendanceStatus in setOf(AttendanceStatus.PRESENT, AttendanceStatus.LATE) && attendance.verificationTime != null)) {
            "Faqat tasdiqlangan qatnashuvchiga baho qo'yiladi"
        }
        val calculated = calculate(request.score, request.totalScore)
        val grader = userRepository.findById(userId).orElseThrow()
        val result = resultRepository.findByExamSessionIdAndEnrollmentIdAndDeletedFalse(sessionId, enrollmentId)
            ?: ExamResult(session, enrollment, gradedBy = grader, gradingDate = Instant.now())
        result.score = request.score
        result.totalScore = request.totalScore
        result.percentage = calculated.first
        result.passed = calculated.first >= 60.0
        result.grade = calculated.second
        result.gradedBy = grader
        result.gradingDate = Instant.now()
        result.comments = request.comments?.trim()?.takeIf(String::isNotBlank)
        val saved = resultRepository.save(result)
        auditService.logAction("EXAM_RESULT_RECORDED", userId, "session=$sessionId enrollment=$enrollmentId score=${request.score}")
        return toTeacherDto(saved)
    }

    @Transactional
    fun recordBulk(sessionId: Long, request: BulkRecordExamResultRequest, userId: Long, mayManageAll: Boolean) =
        request.results.map { record(sessionId, it.enrollmentId, it, userId, mayManageAll) }

    @Transactional(readOnly = true)
    fun teacherResults(sessionId: Long, userId: Long, mayManageAll: Boolean): List<TeacherExamResultDto> {
        managedSession(sessionId, userId, mayManageAll)
        return resultRepository.findAllByExamSessionIdAndDeletedFalseOrderByScoreDesc(sessionId).map(::toTeacherDto)
    }

    @Transactional(readOnly = true)
    fun statistics(sessionId: Long, userId: Long, mayManageAll: Boolean): ExamResultsStatisticsDto {
        val session = managedSession(sessionId, userId, mayManageAll)
        val results = resultRepository.findAllByExamSessionIdAndDeletedFalseOrderByScoreDesc(sessionId)
        val rosterSize = attendanceRepository.findAllByExamSessionIdAndDeletedFalseOrderByArrivalTimeAsc(sessionId).size
        return ExamResultsStatisticsDto(
            sessionId.toString(), session.title, rosterSize, results.size, results.count { it.passed }, results.count { !it.passed },
            results.map { it.percentage }.averageOrZero(), results.maxOfOrNull { it.percentage } ?: 0.0,
            results.minOfOrNull { it.percentage } ?: 0.0, results.groupingBy { it.grade ?: "-" }.eachCount(),
            if (results.isEmpty()) 0.0 else results.count { it.passed } * 100.0 / results.size,
        )
    }

    @Transactional(readOnly = true)
    fun studentResults(userId: Long): List<StudentExamResultDto> = resultRepository
        .findAllByEnrollmentStudentUserIdAndDeletedFalseOrderByGradingDateDesc(userId)
        .filter { it.examSession.status == ExamSessionStatus.COMPLETED }.map(::toStudentDto)

    @Transactional
    fun appeal(request: ExamAppealRequestDto, userId: Long): ExamAppealResponseDto {
        val result = resultRepository.findByIdAndDeletedFalse(request.examResultId) ?: throw IllegalArgumentException("Imtihon natijasi topilmadi")
        require(result.enrollment.student.user.id == userId) { "Boshqa talabaning natijasiga apellyatsiya berilmaydi" }
        require(result.examSession.status == ExamSessionStatus.COMPLETED) { "Natija hali e'lon qilinmagan" }
        require(request.reason.trim().length in 10..2000) { "Apellyatsiya sababi 10 dan 2000 belgigacha bo'lishi kerak" }
        require(result.gradingDate.plus(10, ChronoUnit.DAYS).isAfter(Instant.now())) { "Apellyatsiya muddati tugagan" }
        require(!appealRepository.existsByExamResultIdAndStatusAndDeletedFalse(result.id!!, AppealStatus.PENDING)) { "Ushbu natija bo'yicha ochiq apellyatsiya mavjud" }
        val student = userRepository.findById(userId).orElseThrow()
        val saved = appealRepository.save(ExamAppeal(result, student, Instant.now(), request.reason.trim()))
        auditService.logAction("EXAM_APPEAL_CREATED", userId, "result=${result.id}")
        return toAppealDto(saved)
    }

    @Transactional(readOnly = true)
    fun studentAppeals(userId: Long) = appealRepository.findAllByStudentIdAndDeletedFalseOrderByAppealDateDesc(userId).map(::toAppealDto)

    @Transactional(readOnly = true)
    fun sessionAppeals(sessionId: Long, userId: Long, mayManageAll: Boolean): List<ExamAppealResponseDto> {
        managedSession(sessionId, userId, mayManageAll)
        return appealRepository.findAllByExamResultExamSessionIdAndDeletedFalseOrderByAppealDateAsc(sessionId).map(::toAppealDto)
    }

    @Transactional
    fun reviewAppeal(appealId: Long, request: ReviewExamAppealRequest, userId: Long, mayManageAll: Boolean): ExamAppealResponseDto {
        val appeal = appealRepository.findByIdAndDeletedFalse(appealId) ?: throw IllegalArgumentException("Apellyatsiya topilmadi")
        managedSession(appeal.examResult.examSession.id!!, userId, mayManageAll)
        require(appeal.status == AppealStatus.PENDING) { "Apellyatsiya allaqachon ko'rib chiqilgan" }
        require(request.status in setOf(AppealStatus.APPROVED, AppealStatus.PARTIAL, AppealStatus.REJECTED)) { "Yakuniy qaror holati noto'g'ri" }
        require(request.decision.trim().length in 5..2000) { "Qaror izohi 5 dan 2000 belgigacha bo'lishi kerak" }
        if (request.status in setOf(AppealStatus.APPROVED, AppealStatus.PARTIAL)) {
            val newScore = request.newScore ?: throw IllegalArgumentException("Yangi ball majburiy")
            val calculated = calculate(newScore, appeal.examResult.totalScore)
            appeal.examResult.score = newScore
            appeal.examResult.percentage = calculated.first
            appeal.examResult.passed = calculated.first >= 60.0
            appeal.examResult.grade = calculated.second
            resultRepository.save(appeal.examResult)
            appeal.newScore = newScore
        } else require(request.newScore == null) { "Rad etilgan apellyatsiyada yangi ball bo'lmaydi" }
        appeal.status = request.status
        appeal.decision = request.decision.trim()
        appeal.reviewDate = Instant.now()
        appeal.reviewedBy = userRepository.findById(userId).orElseThrow()
        val saved = appealRepository.save(appeal)
        auditService.logAction("EXAM_APPEAL_REVIEWED", userId, "appeal=$appealId status=${request.status}")
        return toAppealDto(saved)
    }

    private fun managedSession(sessionId: Long, userId: Long, mayManageAll: Boolean) =
        sessionRepository.findByIdAndDeletedFalse(sessionId)?.also { courseAccessService.requireManage(it.course.id, userId, mayManageAll) }
            ?: throw IllegalArgumentException("Imtihon sessiyasi topilmadi")

    private fun calculate(score: BigDecimal, total: BigDecimal): Pair<Double, String> {
        require(total > BigDecimal.ZERO && score >= BigDecimal.ZERO && score <= total) { "Ball 0 va maksimal ball oralig'ida bo'lishi kerak" }
        val percentage = score.multiply(BigDecimal("100")).divide(total, 2, RoundingMode.HALF_UP).toDouble()
        val grade = when { percentage >= 90 -> "A"; percentage >= 80 -> "B"; percentage >= 70 -> "C"; percentage >= 60 -> "D"; else -> "F" }
        return percentage to grade
    }

    private fun toTeacherDto(result: ExamResult): TeacherExamResultDto {
        val student = result.enrollment.student
        return TeacherExamResultDto(result.id!!.toString(), result.examSession.id!!.toString(), result.examSession.title,
            result.enrollment.id!!.toString(), student.id!!.toString(), student.fullName, student.email ?: student.user.email.orEmpty(),
            result.score.toDouble(), result.totalScore.toDouble(), result.percentage, result.passed, result.grade, result.comments,
            result.gradedBy.fullName ?: result.gradedBy.username, result.gradingDate)
    }

    private fun toStudentDto(result: ExamResult): StudentExamResultDto {
        val attendance = attendanceRepository.findByExamSessionIdAndEnrollmentIdAndDeletedFalse(result.examSession.id!!, result.enrollment.id!!)
        return StudentExamResultDto(result.id!!.toString(), result.examSession.id!!.toString(), result.examSession.title,
            result.examSession.examDate.toString(), result.score.toDouble(), result.totalScore.toDouble(), result.percentage,
            result.passed, result.grade, result.comments, attendance?.attendanceStatus?.name ?: AttendanceStatus.EXPECTED.name, result.gradingDate)
    }

    private fun toAppealDto(appeal: ExamAppeal) = ExamAppealResponseDto(
        appeal.id!!.toString(), appeal.examResult.id!!.toString(), appeal.student.fullName ?: appeal.student.username,
        appeal.appealDate, appeal.reason, appeal.status.name, appeal.reviewDate,
        appeal.reviewedBy?.fullName ?: appeal.reviewedBy?.username, appeal.decision, appeal.newScore?.toDouble(),
    )

    private fun List<Double>.averageOrZero() = if (isEmpty()) 0.0 else average()
}
