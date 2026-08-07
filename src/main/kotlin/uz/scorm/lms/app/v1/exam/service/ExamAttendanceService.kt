package uz.scorm.lms.app.v1.exam.service

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.audit.service.AuditService
import uz.scorm.lms.app.v1.courses.repository.CourseEnrollmentRepository
import uz.scorm.lms.app.v1.courses.service.CourseAccessService
import uz.scorm.lms.app.v1.exam.dto.*
import uz.scorm.lms.app.v1.exam.model.AttendanceStatus
import uz.scorm.lms.app.v1.exam.model.ExamSessionStatus
import uz.scorm.lms.app.v1.exam.repository.ExamAttendanceRepository
import uz.scorm.lms.app.v1.exam.repository.ExamSessionRepository
import uz.scorm.lms.app.v1.user.repository.UserRepository
import java.time.Instant

@Service
class ExamAttendanceService(
    private val sessionRepository: ExamSessionRepository,
    private val attendanceRepository: ExamAttendanceRepository,
    private val enrollmentRepository: CourseEnrollmentRepository,
    private val userRepository: UserRepository,
    private val courseAccessService: CourseAccessService,
    private val auditService: AuditService,
) {
    @Transactional(readOnly = true)
    fun sheet(sessionId: Long, userId: Long, mayManageAll: Boolean): TeacherAttendanceSheetDto {
        val session = managedSession(sessionId, userId, mayManageAll)
        val records = attendanceRepository.findAllByExamSessionIdAndDeletedFalseOrderByArrivalTimeAsc(sessionId)
        return TeacherAttendanceSheetDto(
            examSessionId = sessionId.toString(), examTitle = session.title,
            examDate = session.examDate.toString(), examTime = session.examTime.toString(), location = session.location,
            totalEnrolled = records.size, attendanceRecords = records.map(::toDto),
        )
    }

    @Transactional
    fun record(sessionId: Long, enrollmentId: Long, request: RecordAttendanceRequest, userId: Long, mayManageAll: Boolean): AttendanceRecordDto {
        val session = managedSession(sessionId, userId, mayManageAll)
        require(session.status == ExamSessionStatus.ONGOING) { "Davomat faqat davom etayotgan imtihonda qayd etiladi" }
        require(request.attendanceStatus in setOf(AttendanceStatus.PRESENT, AttendanceStatus.LATE, AttendanceStatus.ABSENT, AttendanceStatus.EXCUSED)) {
            "Davomat holati yakuniy tasdiqlash uchun yaroqsiz"
        }
        val enrollment = enrollmentRepository.findById(enrollmentId).orElseThrow { IllegalArgumentException("Talaba biriktiruvi topilmadi") }
        require(enrollment.course.id == session.course.id && !enrollment.deleted) { "Talaba ushbu imtihon kursiga biriktirilmagan" }
        val attendance = attendanceRepository.findByExamSessionIdAndEnrollmentIdAndDeletedFalse(sessionId, enrollmentId)
            ?: throw IllegalArgumentException("Talaba e'lon qilingan imtihon ro'yxatida yo'q")
        val now = Instant.now()
        attendance.attendanceStatus = request.attendanceStatus
        attendance.arrivalTime = if (request.attendanceStatus in setOf(AttendanceStatus.PRESENT, AttendanceStatus.LATE)) request.arrivalTime ?: now else null
        attendance.departureTime = request.departureTime
        require(attendance.arrivalTime == null || attendance.departureTime == null || !attendance.departureTime!!.isBefore(attendance.arrivalTime)) {
            "Ketish vaqti kelish vaqtidan oldin bo'lishi mumkin emas"
        }
        attendance.specialConditions = request.specialConditions?.trim()?.takeIf(String::isNotBlank)
        attendance.proctorNotes = request.proctorNotes?.trim()?.takeIf(String::isNotBlank)
        attendance.attendanceVerifiedBy = userRepository.findById(userId).orElseThrow()
        attendance.verificationTime = now
        val saved = attendanceRepository.save(attendance)
        auditService.logAction("EXAM_ATTENDANCE_VERIFIED", userId, "session=$sessionId enrollment=$enrollmentId status=${request.attendanceStatus}")
        return toDto(saved)
    }

    @Transactional
    fun recordBulk(sessionId: Long, request: BulkRecordAttendanceRequest, userId: Long, mayManageAll: Boolean): List<AttendanceRecordDto> =
        request.enrollmentIds.distinct().map { enrollmentId ->
            record(sessionId, enrollmentId, RecordAttendanceRequest(request.attendanceStatus, request.arrivalTime, specialConditions = request.specialConditions), userId, mayManageAll)
        }

    private fun managedSession(sessionId: Long, userId: Long, mayManageAll: Boolean) =
        sessionRepository.findByIdAndDeletedFalse(sessionId)?.also {
            courseAccessService.requireManage(it.course.id, userId, mayManageAll)
        } ?: throw IllegalArgumentException("Imtihon sessiyasi topilmadi")

    private fun toDto(record: uz.scorm.lms.app.v1.exam.model.ExamAttendance): AttendanceRecordDto {
        val student = record.enrollment.student
        return AttendanceRecordDto(
            id = requireNotNull(record.id).toString(), enrollmentId = requireNotNull(record.enrollment.id).toString(),
            studentId = requireNotNull(student.id).toString(), studentName = student.fullName,
            studentEmail = student.email ?: student.user.email.orEmpty(), status = record.attendanceStatus.name,
            arrivalTime = record.arrivalTime, departureTime = record.departureTime,
            specialConditions = record.specialConditions, proctorNotes = record.proctorNotes,
            verifiedBy = record.attendanceVerifiedBy?.fullName ?: record.attendanceVerifiedBy?.username,
            verificationTime = record.verificationTime,
            onsiteAttendanceRequired = record.onsiteAttendanceRequired,
        )
    }
}
