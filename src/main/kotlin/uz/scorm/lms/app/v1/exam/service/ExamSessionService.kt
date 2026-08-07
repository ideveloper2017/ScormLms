package uz.scorm.lms.app.v1.exam.service

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.audit.service.AuditService
import uz.scorm.lms.app.v1.compliance.Decision559Rules
import uz.scorm.lms.app.v1.courses.model.CourseStatus
import uz.scorm.lms.app.v1.courses.model.CourseEnrollmentStatus
import uz.scorm.lms.app.v1.courses.repository.CourseEnrollmentRepository
import uz.scorm.lms.app.v1.courses.repository.CourseRepository
import uz.scorm.lms.app.v1.courses.service.CourseAccessService
import uz.scorm.lms.app.v1.exam.dto.CompleteExamSessionRequest
import uz.scorm.lms.app.v1.exam.dto.CreateExamSessionRequest
import uz.scorm.lms.app.v1.exam.dto.ExamSessionDetailDto
import uz.scorm.lms.app.v1.exam.dto.PublishExamSessionRequest
import uz.scorm.lms.app.v1.exam.dto.StudentExamSessionDto
import uz.scorm.lms.app.v1.exam.dto.TeacherExamSessionDto
import uz.scorm.lms.app.v1.exam.dto.UpdateExamSessionRequest
import uz.scorm.lms.app.v1.exam.model.AttendanceStatus
import uz.scorm.lms.app.v1.exam.model.ExamSession
import uz.scorm.lms.app.v1.exam.model.ExamSessionStatus
import uz.scorm.lms.app.v1.exam.model.ExamAttendance
import uz.scorm.lms.app.v1.exam.model.ExamResult
import uz.scorm.lms.app.v1.exam.repository.ExamAttendanceRepository
import uz.scorm.lms.app.v1.exam.repository.ExamResultRepository
import uz.scorm.lms.app.v1.exam.repository.ExamSessionRepository
import uz.scorm.lms.app.v1.student.model.Citizenship
import uz.scorm.lms.app.v1.user.model.User
import uz.scorm.lms.app.v1.user.repository.UserRepository
import java.time.Instant
import java.time.LocalDate

@Service
class ExamSessionService(
    private val examSessionRepository: ExamSessionRepository,
    private val examAttendanceRepository: ExamAttendanceRepository,
    private val examResultRepository: ExamResultRepository,
    private val courseRepository: CourseRepository,
    private val courseEnrollmentRepository: CourseEnrollmentRepository,
    private val userRepository: UserRepository,
    private val courseAccessService: CourseAccessService,
    private val auditService: AuditService,
) {

    @Transactional
    fun createExamSession(
        request: CreateExamSessionRequest,
        userId: Long,
        mayManageAll: Boolean,
    ): TeacherExamSessionDto {
        val course = courseAccessService.requireManage(request.courseId, userId, mayManageAll)
        require(course.status != CourseStatus.ARCHIVED.name) { "Arxivlangan kurs uchun imtihon sessiyasi yaratilmaydi" }

        val examiner = userRepository.findById(request.examinerId ?: userId)
            .orElseThrow { IllegalArgumentException("Imtihonchi topilmadi") }

        val secondaryExaminer = request.secondaryExaminerId?.let {
            userRepository.findById(it).orElseThrow { IllegalArgumentException("Ikkinchi imtihonchi topilmadi") }
        }

        require(request.examDate >= LocalDate.now()) { "Imtihon sanasi bugundan keyingi bo'lishi kerak" }
        require(request.durationMinutes in 1..480) { "Imtihon davomiyligi 1 dan 480 daqiqagacha bo'lishi kerak" }
        require(request.title.isNotBlank()) { "Imtihon nomi majburiy" }
        require(request.location.isNotBlank()) { "Imtihon joyi majburiy" }

        val examSession = ExamSession(
            course = course,
            semesterId = request.semesterId,
            title = request.title.trim(),
            description = request.description,
            examDate = request.examDate,
            examTime = request.examTime,
            location = request.location.trim(),
            maxCapacity = request.maxCapacity,
            examiner = examiner,
            secondaryExaminer = secondaryExaminer,
            examType = request.examType,
            durationMinutes = request.durationMinutes,
        )

        val saved = examSessionRepository.save(examSession)
        auditService.logAction("EXAM_SESSION_CREATED", userId, "Imtihon sessiyasi yaratildi: ${saved.title}")
        return toTeacherDto(saved)
    }

    @Transactional
    fun updateExamSession(
        sessionId: Long,
        request: UpdateExamSessionRequest,
        userId: Long,
        mayManageAll: Boolean,
    ): TeacherExamSessionDto {
        val session = examSessionRepository.findByIdAndDeletedFalse(sessionId)
            ?: throw IllegalArgumentException("Imtihon sessiyasi topilmadi")

        courseAccessService.requireManage(session.course.id, userId, mayManageAll)

        require(session.status == ExamSessionStatus.DRAFT) { "Faqat DRAFT sessiyasi o'zgartiriladi" }

        request.title?.let { session.title = it.trim() }
        request.description?.let { session.description = it }
        request.location?.let { session.location = it.trim() }
        request.examDate?.let {
            require(it >= LocalDate.now()) { "Imtihon sanasi bugundan keyingi bo'lishi kerak" }
            session.examDate = it
        }
        request.examTime?.let { session.examTime = it }
        request.maxCapacity?.let { session.maxCapacity = it }
        request.secondaryExaminerId?.let {
            session.secondaryExaminer = userRepository.findById(it)
                .orElseThrow { IllegalArgumentException("Ikkinchi imtihonchi topilmadi") }
        }
        request.durationMinutes?.let {
            require(it in 1..480) { "Imtihon davomiyligi 1 dan 480 daqiqagacha bo'lishi kerak" }
            session.durationMinutes = it
        }

        val updated = examSessionRepository.save(session)
        auditService.logAction("EXAM_SESSION_UPDATED", userId, "Imtihon sessiyasi yangilandi: ${session.title}")
        return toTeacherDto(updated)
    }

    @Transactional
    fun publishExamSession(
        sessionId: Long,
        request: PublishExamSessionRequest?,
        userId: Long,
        mayManageAll: Boolean,
    ): TeacherExamSessionDto {
        val session = examSessionRepository.findByIdAndDeletedFalse(sessionId)
            ?: throw IllegalArgumentException("Imtihon sessiyasi topilmadi")

        courseAccessService.requireManage(session.course.id, userId, mayManageAll)
        require(session.status == ExamSessionStatus.DRAFT) { "Faqat DRAFT sessiyalari nashr etilishi mumkin" }

        val enrollments = courseEnrollmentRepository
            .findAllByCourseIdAndDeletedFalseOrderByEnrolledAtDesc(requireNotNull(session.course.id))
            .filter { it.status in setOf(CourseEnrollmentStatus.ACTIVE, CourseEnrollmentStatus.COMPLETED) }
        require(enrollments.isNotEmpty()) { "Imtihonga biriktiriladigan talaba yo'q" }
        session.maxCapacity?.let { require(enrollments.size <= it) { "Talabalar soni sig'imdan oshib ketgan" } }

        session.status = ExamSessionStatus.PUBLISHED
        session.publishedAt = Instant.now()
        examSessionRepository.save(session)
        enrollments.forEach { enrollment ->
            if (examAttendanceRepository.findByExamSessionIdAndEnrollmentIdAndDeletedFalse(sessionId, requireNotNull(enrollment.id)) == null) {
                examAttendanceRepository.save(ExamAttendance(
                    session,
                    enrollment,
                    onsiteAttendanceRequired = Decision559Rules.requiresOnsiteParticipation(
                        enrollment.student.citizenship != Citizenship.UZBEKISTAN,
                    ),
                ))
            }
        }

        val updated = examSessionRepository.save(session)
        auditService.logAction("EXAM_SESSION_PUBLISHED", userId, "Imtihon sessiyasi nashr etildi: ${session.title}")
        return toTeacherDto(updated)
    }

    @Transactional
    fun startExamSession(sessionId: Long, userId: Long, mayManageAll: Boolean): TeacherExamSessionDto {
        val session = examSessionRepository.findByIdAndDeletedFalse(sessionId)
            ?: throw IllegalArgumentException("Imtihon sessiyasi topilmadi")
        courseAccessService.requireManage(session.course.id, userId, mayManageAll)
        require(session.status == ExamSessionStatus.PUBLISHED) { "Faqat e'lon qilingan sessiya boshlanadi" }
        require(session.examDate == LocalDate.now()) { "Imtihon faqat belgilangan sanada boshlanadi" }
        session.status = ExamSessionStatus.ONGOING
        val updated = examSessionRepository.save(session)
        auditService.logAction("EXAM_SESSION_STARTED", userId, "Imtihon boshlandi: ${session.title}")
        return toTeacherDto(updated)
    }

    @Transactional
    fun completeExamSession(
        sessionId: Long,
        request: CompleteExamSessionRequest?,
        userId: Long,
        mayManageAll: Boolean,
    ): TeacherExamSessionDto {
        val session = examSessionRepository.findByIdAndDeletedFalse(sessionId)
            ?: throw IllegalArgumentException("Imtihon sessiyasi topilmadi")

        courseAccessService.requireManage(session.course.id, userId, mayManageAll)
        require(session.status == ExamSessionStatus.ONGOING) { "Faqat davom etayotgan sessiya tugatiladi" }
        val attendance = examAttendanceRepository.findAllByExamSessionIdAndDeletedFalseOrderByArrivalTimeAsc(sessionId)
        require(attendance.filter { it.onsiteAttendanceRequired }
            .none { it.attendanceStatus == AttendanceStatus.EXPECTED || it.attendanceStatus == AttendanceStatus.EXCUSE }) {
            "Barcha talabalar davomati tasdiqlanishi kerak"
        }
        val attendeeIds = attendance.filter {
            !it.onsiteAttendanceRequired || it.attendanceStatus in setOf(AttendanceStatus.PRESENT, AttendanceStatus.LATE)
        }
            .map { requireNotNull(it.enrollment.id) }.toSet()
        val resultIds = examResultRepository.findAllByExamSessionIdAndDeletedFalseOrderByScoreDesc(sessionId)
            .map { requireNotNull(it.enrollment.id) }.toSet()
        require(resultIds.containsAll(attendeeIds)) { "Qatnashgan barcha talabalar baholanishi kerak" }

        session.status = ExamSessionStatus.COMPLETED
        session.heldAt = Instant.now()

        val updated = examSessionRepository.save(session)
        auditService.logAction("EXAM_SESSION_COMPLETED", userId, "Imtihon sessiyasi tugatildi: ${session.title}")
        return toTeacherDto(updated)
    }

    @Transactional(readOnly = true)
    fun getExamSession(sessionId: Long, userId: Long, mayManageAll: Boolean): ExamSessionDetailDto {
        val session = examSessionRepository.findByIdAndDeletedFalse(sessionId)
            ?: throw IllegalArgumentException("Imtihon sessiyasi topilmadi")

        // Check access
        courseAccessService.requireView(session.course.id, userId, mayManageAll)

        val enrollments = courseEnrollmentRepository.findAllByCourseLazyDelete(session.course.id)
        val attendanceRecords = examAttendanceRepository.findAllByExamSessionIdAndDeletedFalseOrderByArrivalTimeAsc(sessionId)
        val results = examResultRepository.findAllByExamSessionIdAndDeletedFalseOrderByScoreDesc(sessionId)

        return toDetailDto(session, enrollments.size, attendanceRecords, results)
    }

    @Transactional(readOnly = true)
    fun getTeacherSessions(userId: Long, mayManageAll: Boolean): List<TeacherExamSessionDto> {
        val sessions = if (mayManageAll) {
            examSessionRepository.findAllByDeletedFalseOrderByExamDateDesc()
        } else {
            val ownedCourseIds = courseRepository.findAllByUserIdAndDeletedFalseOrderByCreatedAtDesc(userId)
                .mapNotNull { it.id }.toSet()
            (examSessionRepository.findAllByExaminerIdAndDeletedFalseOrderByExamDateDesc(userId) +
                examSessionRepository.findAllBySecondaryExaminerIdAndDeletedFalseOrderByExamDateDesc(userId) +
                ownedCourseIds.flatMap { examSessionRepository.findAllByCourseIdAndDeletedFalseOrderByExamDateDesc(it) })
                .distinctBy { it.id }.sortedByDescending { it.examDate }
        }
        return sessions.map(::toTeacherDto)
    }

    @Transactional(readOnly = true)
    fun getStudentSessions(enrollmentIds: List<Long>): List<StudentExamSessionDto> {
        val sessions = mutableListOf<StudentExamSessionDto>()
        // Group enrollments by course and get exam sessions
        val enrollments = courseEnrollmentRepository.findAllById(enrollmentIds)
        val courseIds = enrollments.mapNotNull { it.course.id }.distinct()

        for (courseId in courseIds) {
            val courseSessions = examSessionRepository.findAllByCourseIdAndDeletedFalseOrderByExamDateDesc(courseId)
                .filter { it.status != ExamSessionStatus.DRAFT }
            for (session in courseSessions) {
                for (enrollment in enrollments.filter { it.course.id == courseId }) {
                    val sessionId = requireNotNull(session.id)
                    val enrollmentId = requireNotNull(enrollment.id)
                    val attendance = examAttendanceRepository
                        .findByExamSessionIdAndEnrollmentIdAndDeletedFalse(sessionId, enrollmentId)
                    val result = examResultRepository
                        .findByExamSessionIdAndEnrollmentIdAndDeletedFalse(sessionId, enrollmentId)

                    sessions.add(StudentExamSessionDto(
                        id = session.id.toString(),
                        courseId = session.course.id.toString(),
                        courseTitle = session.course.name,
                        title = session.title,
                        description = session.description,
                        examDate = session.examDate,
                        examTime = session.examTime,
                        location = session.location,
                        examType = session.examType.name,
                        durationMinutes = session.durationMinutes,
                        examinerName = session.examiner.fullName ?: session.examiner.username,
                        status = session.status.name,
                        myAttendanceStatus = attendance?.attendanceStatus?.name,
                        myScore = result?.percentage,
                        myGrade = result?.grade,
                        resultPublished = session.status == ExamSessionStatus.COMPLETED,
                    ))
                }
            }
        }

        return sessions
    }

    @Transactional(readOnly = true)
    fun deleteExamSession(sessionId: Long, userId: Long, mayManageAll: Boolean) {
        val session = examSessionRepository.findByIdAndDeletedFalse(sessionId)
            ?: throw IllegalArgumentException("Imtihon sessiyasi topilmadi")

        courseAccessService.requireManage(session.course.id, userId, mayManageAll)
        require(session.status == ExamSessionStatus.DRAFT) { "Faqat DRAFT sessiyalar o'chirilishi mumkin" }

        session.deleted = true
        examSessionRepository.save(session)
        auditService.logAction("EXAM_SESSION_DELETED", userId, "Imtihon sessiyasi o'chirildi: ${session.title}")
    }

    private fun toTeacherDto(session: ExamSession): TeacherExamSessionDto {
        val attendanceRecords = examAttendanceRepository.findAllByExamSessionIdAndDeletedFalseOrderByArrivalTimeAsc(session.id!!)
        val presentCount = attendanceRecords.count { it.attendanceStatus == AttendanceStatus.PRESENT }
        val lateCount = attendanceRecords.count { it.attendanceStatus == AttendanceStatus.LATE }
        val absentCount = attendanceRecords.count { it.attendanceStatus == AttendanceStatus.ABSENT }
        val registeredCount = attendanceRecords.size

        return TeacherExamSessionDto(
            id = session.id.toString(),
            courseId = session.course.id.toString(),
            courseTitle = session.course.name,
            title = session.title,
            description = session.description,
            examDate = session.examDate,
            examTime = session.examTime,
            location = session.location,
            examType = session.examType.name,
            durationMinutes = session.durationMinutes,
            examinerId = session.examiner.id.toString(),
            examinerName = session.examiner.fullName ?: session.examiner.username,
            secondaryExaminerId = session.secondaryExaminer?.id?.toString(),
            secondaryExaminerName = session.secondaryExaminer?.fullName ?: session.secondaryExaminer?.username,
            status = session.status.name,
            maxCapacity = session.maxCapacity,
            registeredCount = registeredCount,
            presentCount = presentCount,
            absentCount = absentCount,
            publishedAt = session.publishedAt,
            heldAt = session.heldAt,
            createdAt = session.createdAt!!,
            updatedAt = session.updatedAt!!,
        )
    }

    private fun toDetailDto(
        session: ExamSession,
        totalEnrolled: Int,
        attendanceRecords: List<ExamAttendance>,
        results: List<ExamResult>,
    ): ExamSessionDetailDto {
        val presentCount = attendanceRecords.count { it.attendanceStatus == AttendanceStatus.PRESENT }
        val lateCount = attendanceRecords.count { it.attendanceStatus == AttendanceStatus.LATE }
        val absentCount = attendanceRecords.count { it.attendanceStatus == AttendanceStatus.ABSENT }
        val excusedCount = attendanceRecords.count { it.attendanceStatus == AttendanceStatus.EXCUSED }
        val averageScore = results.takeIf { it.isNotEmpty() }?.map { it.percentage }?.average()
        val passedCount = results.count { it.passed }
        val failedCount = results.count { !it.passed }

        return ExamSessionDetailDto(
            id = session.id.toString(),
            courseId = session.course.id.toString(),
            courseTitle = session.course.name,
            title = session.title,
            description = session.description,
            examDate = session.examDate,
            examTime = session.examTime,
            location = session.location,
            examType = session.examType.name,
            durationMinutes = session.durationMinutes,
            examinerName = session.examiner.fullName ?: session.examiner.username,
            secondaryExaminerName = session.secondaryExaminer?.fullName ?: session.secondaryExaminer?.username,
            status = session.status.name,
            maxCapacity = session.maxCapacity,
            totalEnrolled = totalEnrolled,
            presentCount = presentCount,
            lateCount = lateCount,
            absentCount = absentCount,
            excusedCount = excusedCount,
            averageScore = averageScore,
            passedCount = passedCount,
            failedCount = failedCount,
            publishedAt = session.publishedAt,
            heldAt = session.heldAt,
        )
    }
}
