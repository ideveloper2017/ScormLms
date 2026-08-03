package uz.scorm.lms.app.v1.attendance.service

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.attendance.dto.AttendanceSessionRequest
import uz.scorm.lms.app.v1.attendance.dto.TeacherAttendanceSessionDto
import uz.scorm.lms.app.v1.attendance.model.CourseAttendanceSession
import uz.scorm.lms.app.v1.attendance.model.LearningActivityEvent
import uz.scorm.lms.app.v1.attendance.repository.CourseAttendanceSessionRepository
import uz.scorm.lms.app.v1.attendance.repository.LearningActivityEventRepository
import uz.scorm.lms.app.v1.courses.model.CourseEnrollment
import uz.scorm.lms.app.v1.courses.model.CourseEnrollmentStatus
import uz.scorm.lms.app.v1.courses.model.CourseStatus
import uz.scorm.lms.app.v1.courses.repository.CourseEnrollmentRepository
import uz.scorm.lms.app.v1.courses.service.CourseAccessService
import uz.scorm.lms.app.v1.student.dto.AttendancePercentageDto
import uz.scorm.lms.app.v1.student.dto.StudentAttendanceRecordDto
import uz.scorm.lms.app.v1.student.dto.StudentAttendanceStatsDto
import uz.scorm.lms.app.v1.student.dto.StudentAttendanceSummaryDto
import uz.scorm.lms.app.v1.student.dto.StudentCourseAttendanceDto
import uz.scorm.lms.app.v1.student.repository.StudentRepository
import java.time.Duration
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import kotlin.math.round

private enum class CalculatedAttendanceStatus { PRESENT, LATE, ABSENT }

private data class AttendanceEvidence(
    val status: CalculatedAttendanceStatus,
    val events: List<LearningActivityEvent>,
    val durationSeconds: Int,
)

@Service
class AttendanceService(
    private val sessionRepository: CourseAttendanceSessionRepository,
    private val eventRepository: LearningActivityEventRepository,
    private val enrollmentRepository: CourseEnrollmentRepository,
    private val studentRepository: StudentRepository,
    private val courseAccessService: CourseAccessService,
) {
    private val activeStatuses = setOf(CourseEnrollmentStatus.ACTIVE, CourseEnrollmentStatus.COMPLETED)

    @Transactional
    fun createSession(
        request: AttendanceSessionRequest,
        userId: Long,
        mayManageAll: Boolean,
    ): TeacherAttendanceSessionDto {
        val course = courseAccessService.requireManage(request.courseId, userId, mayManageAll)
        require(course.status != CourseStatus.ARCHIVED.name) { "Arxivlangan kurs uchun davomat oynasi yaratilmaydi" }
        require(request.title.isNotBlank()) { "Davomat mashg'uloti nomi majburiy" }
        require(request.title.length <= 255) { "Davomat mashg'uloti nomi 255 belgidan oshmasligi kerak" }
        require(request.opensAt.isBefore(request.closesAt)) { "Davomat oynasining boshlanishi tugashidan oldin bo'lishi kerak" }
        require(Duration.between(request.opensAt, request.closesAt) <= Duration.ofDays(7)) {
            "Bitta davomat oynasi 7 kundan oshmasligi kerak"
        }
        request.lateAfter?.let {
            require(!it.isBefore(request.opensAt) && !it.isAfter(request.closesAt)) {
                "Kechikish chegarasi davomat oynasi ichida bo'lishi kerak"
            }
        }
        require(request.minimumActivitySeconds in 0..86_400) {
            "Minimal faollik 0 dan 86400 soniyagacha bo'lishi kerak"
        }
        return teacherDto(sessionRepository.save(CourseAttendanceSession(
            course = course,
            title = request.title.trim(),
            opensAt = request.opensAt,
            closesAt = request.closesAt,
            lateAfter = request.lateAfter,
            minimumActivitySeconds = request.minimumActivitySeconds,
        )))
    }

    @Transactional(readOnly = true)
    fun teacherSessions(userId: Long, mayManageAll: Boolean): List<TeacherAttendanceSessionDto> {
        val sessions = if (mayManageAll) sessionRepository.findAllByDeletedFalseOrderByOpensAtDesc()
        else sessionRepository.findAllByCourseUserIdAndDeletedFalseOrderByOpensAtDesc(userId)
        return sessions.map(::teacherDto)
    }

    @Transactional
    fun deleteSession(sessionId: Long, userId: Long, mayManageAll: Boolean) {
        val session = sessionRepository.findById(sessionId)
            .filter { !it.deleted }
            .orElseThrow { NoSuchElementException("Davomat mashg'uloti topilmadi: $sessionId") }
        courseAccessService.requireManage(requireNotNull(session.course.id), userId, mayManageAll)
        session.deleted = true
        sessionRepository.save(session)
    }

    @Transactional(readOnly = true)
    fun studentRecords(
        userId: Long,
        courseId: Long? = null,
        startDate: LocalDate? = null,
        endDate: LocalDate? = null,
        status: String? = null,
    ): List<StudentAttendanceRecordDto> {
        val student = studentRepository.findByUserId(userId)
            ?: throw NoSuchElementException("Talaba profili topilmadi")
        val enrollments = enrollmentRepository.findAllByStudentIdAndStatusInAndDeletedFalseOrderByEnrolledAtDesc(
            requireNotNull(student.id), activeStatuses,
        ).filter { courseId == null || it.course.id == courseId }
        if (enrollments.isEmpty()) return emptyList()
        val enrollmentByCourse = enrollments.associateBy { requireNotNull(it.course.id) }
        val now = Instant.now()
        return sessionRepository.findAllByCourseIdInAndDeletedFalseOrderByOpensAtDesc(enrollmentByCourse.keys)
            .asSequence()
            .filter { !it.opensAt.isAfter(now) }
            .filter { startDate == null || localDate(it.opensAt) >= startDate }
            .filter { endDate == null || localDate(it.opensAt) <= endDate }
            .mapNotNull { session ->
                val enrollment = enrollmentByCourse[session.course.id] ?: return@mapNotNull null
                if (enrollment.enrolledAt.isAfter(session.closesAt)) return@mapNotNull null
                val evidence = evidence(enrollment, session)
                if (session.closesAt.isAfter(now) && evidence.status == CalculatedAttendanceStatus.ABSENT) {
                    return@mapNotNull null
                }
                toStudentRecord(session, evidence)
            }
            .filter { status.isNullOrBlank() || it.status.equals(status, true) }
            .toList()
    }

    @Transactional(readOnly = true)
    fun studentStats(userId: Long, courseId: Long? = null): StudentAttendanceStatsDto {
        val records = studentRecords(userId, courseId)
        val attended = records.count { it.status in setOf("present", "late") }
        val byCourse = records.groupBy { it.courseId }.map { (id, items) ->
            val courseAttended = items.count { it.status in setOf("present", "late") }
            StudentCourseAttendanceDto(
                courseId = id,
                courseName = items.first().courseName,
                totalClasses = items.size,
                attended = courseAttended,
                percentage = percentage(courseAttended, items.size),
            )
        }.sortedBy { it.courseName }
        return StudentAttendanceStatsDto(
            totalClasses = records.size,
            attended = attended,
            absent = records.count { it.status == "absent" },
            late = records.count { it.status == "late" },
            excused = records.count { it.status == "excused" },
            attendancePercentage = percentage(attended, records.size),
            byCourse = byCourse,
        )
    }

    @Transactional(readOnly = true)
    fun studentSummary(userId: Long): StudentAttendanceSummaryDto {
        val records = studentRecords(userId)
        val stats = studentStats(userId)
        return StudentAttendanceSummaryDto(
            totalClasses = stats.totalClasses,
            attended = stats.attended,
            absent = stats.absent,
            late = stats.late,
            excused = stats.excused,
            attendancePercentage = stats.attendancePercentage,
            byCourse = stats.byCourse,
            recentRecords = records.take(10),
        )
    }

    @Transactional(readOnly = true)
    fun studentPercentage(userId: Long, courseId: Long? = null): AttendancePercentageDto =
        AttendancePercentageDto(studentStats(userId, courseId).attendancePercentage)

    private fun teacherDto(session: CourseAttendanceSession): TeacherAttendanceSessionDto {
        val now = Instant.now()
        val enrollments = enrollmentRepository.findAllByCourseIdAndDeletedFalseOrderByEnrolledAtDesc(
            requireNotNull(session.course.id),
        ).filter { it.status in activeStatuses && !it.enrolledAt.isAfter(session.closesAt) }
        val evidence = enrollments.associateWith { evidence(it, session) }
        val present = evidence.values.count { it.status == CalculatedAttendanceStatus.PRESENT }
        val late = evidence.values.count { it.status == CalculatedAttendanceStatus.LATE }
        val closed = !session.closesAt.isAfter(now)
        val absent = if (closed) evidence.values.count { it.status == CalculatedAttendanceStatus.ABSENT } else 0
        val pending = enrollments.size - present - late - absent
        return TeacherAttendanceSessionDto(
            id = requireNotNull(session.id),
            courseId = requireNotNull(session.course.id),
            courseTitle = session.course.title.orEmpty(),
            group = session.course.groupName.orEmpty(),
            sessionTitle = session.title,
            date = session.opensAt,
            opensAt = session.opensAt,
            closesAt = session.closesAt,
            lateAfter = session.lateAfter,
            minimumActivitySeconds = session.minimumActivitySeconds,
            status = when {
                session.opensAt.isAfter(now) -> "scheduled"
                session.closesAt.isAfter(now) -> "open"
                else -> "closed"
            },
            present = present,
            late = late,
            absent = absent,
            pending = pending,
            total = enrollments.size,
        )
    }

    private fun evidence(enrollment: CourseEnrollment, session: CourseAttendanceSession): AttendanceEvidence {
        val events = eventRepository.findAllByEnrollmentIdAndOccurredAtBetweenAndDeletedFalseOrderByOccurredAtAsc(
            requireNotNull(enrollment.id), session.opensAt, session.closesAt,
        )
        val durationSeconds = events.sumOf { it.durationSeconds }.coerceAtMost(Int.MAX_VALUE)
        val qualified = events.isNotEmpty() && durationSeconds >= session.minimumActivitySeconds
        val status = when {
            !qualified -> CalculatedAttendanceStatus.ABSENT
            session.lateAfter != null && events.first().occurredAt.isAfter(session.lateAfter) -> CalculatedAttendanceStatus.LATE
            else -> CalculatedAttendanceStatus.PRESENT
        }
        return AttendanceEvidence(status, events, durationSeconds)
    }

    private fun toStudentRecord(
        session: CourseAttendanceSession,
        evidence: AttendanceEvidence,
    ): StudentAttendanceRecordDto = StudentAttendanceRecordDto(
        id = requireNotNull(session.id).toString(),
        courseId = requireNotNull(session.course.id).toString(),
        courseName = session.course.title.orEmpty(),
        date = localDate(session.opensAt).toString(),
        status = evidence.status.name.lowercase(),
        reason = if (evidence.events.isEmpty()) "O'quv resursidan foydalanish hodisasi topilmadi" else
            "${evidence.events.size} ta o'quv hodisasi, ${evidence.durationSeconds} soniya",
        checkInTime = evidence.events.firstOrNull()?.occurredAt?.toString(),
        checkOutTime = evidence.events.lastOrNull()?.occurredAt?.toString(),
    )

    private fun localDate(value: Instant): LocalDate = value.atZone(ZoneId.systemDefault()).toLocalDate()

    private fun percentage(attended: Int, total: Int): Double =
        if (total == 0) 0.0 else round(attended * 10_000.0 / total) / 100.0
}
