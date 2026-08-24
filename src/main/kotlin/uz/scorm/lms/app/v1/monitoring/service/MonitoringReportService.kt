package uz.scorm.lms.app.v1.monitoring.service

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.attendance.model.LearningActivitySource
import uz.scorm.lms.app.v1.attendance.repository.LearningActivityEventRepository
import uz.scorm.lms.app.v1.audit.repository.AuditLogRepository
import uz.scorm.lms.app.v1.courses.repository.CourseContentRepository
import uz.scorm.lms.app.v1.courses.repository.CourseEnrollmentRepository
import uz.scorm.lms.app.v1.forum.repository.CourseForumPostRepository
import uz.scorm.lms.app.v1.group.repository.GroupRepository
import uz.scorm.lms.app.v1.monitoring.dto.ElectiveChoiceExceptionDto
import uz.scorm.lms.app.v1.monitoring.dto.LearningParticipationDto
import uz.scorm.lms.app.v1.monitoring.dto.LessonCommentReportDto
import uz.scorm.lms.app.v1.monitoring.dto.StudentIpReportDto
import uz.scorm.lms.app.v1.monitoring.dto.StudentLoginMonitorDto
import uz.scorm.lms.app.v1.program.repository.ProgramRepository
import uz.scorm.lms.app.v1.student.model.StudentStatus
import uz.scorm.lms.app.v1.student.repository.StudentRepository
import java.time.Duration
import java.time.Instant

@Service
class MonitoringReportService(
    private val students: StudentRepository,
    private val groups: GroupRepository,
    private val programs: ProgramRepository,
    private val enrollments: CourseEnrollmentRepository,
    private val activities: LearningActivityEventRepository,
    private val contents: CourseContentRepository,
    private val auditLogs: AuditLogRepository,
    private val forumPosts: CourseForumPostRepository,
) {
    @Transactional(readOnly = true)
    fun inactiveStudents(inactiveDays: Int): List<StudentLoginMonitorDto> {
        require(inactiveDays in 1..3650) { "Faolsizlik kuni 1-3650 oralig'ida bo'lishi kerak" }
        val threshold = Instant.now().minus(Duration.ofDays(inactiveDays.toLong()))
        val groupNames = groupNames()
        return students.findAll().asSequence()
            .filter { it.studentStatus == StudentStatus.ACTIVE }
            .filter { it.user.lastLoginAt == null || it.user.lastLoginAt!!.isBefore(threshold) }
            .map { student ->
                val last = student.user.lastLoginAt
                StudentLoginMonitorDto(
                    studentId = requireNotNull(student.id),
                    fullName = student.fullName,
                    studentNumber = student.studentNumber,
                    group = student.groupId?.let(groupNames::get).orEmpty(),
                    lastLoginAt = last,
                    inactiveDays = last?.let { Duration.between(it, Instant.now()).toDays().coerceAtLeast(0) },
                )
            }
            .sortedWith(compareBy<StudentLoginMonitorDto> { it.lastLoginAt != null }.thenBy { it.lastLoginAt }.thenBy { it.fullName })
            .toList()
    }

    @Transactional(readOnly = true)
    fun electiveExceptions(): List<ElectiveChoiceExceptionDto> {
        val allEnrollments = enrollments.findAllByDeletedFalseOrderByAcademicYearDescSemesterDescEnrolledAtDesc()
        val chosenByStudent = allEnrollments.groupBy { requireNotNull(it.student.id) }.mapValues { (_, rows) -> rows.mapNotNull { it.course.id }.toSet() }
        val optionalContexts = allEnrollments.filter { !it.required }.groupBy { requireNotNull(it.course.id) }
        val groupNames = groupNames()
        val programNames = programNames()
        val activeStudents = students.findAll().filter { it.studentStatus == StudentStatus.ACTIVE }

        return optionalContexts.flatMap { (courseId, contexts) ->
            val example = contexts.first()
            val course = example.course
            val programId = course.subject?.program?.id ?: example.student.programId
            val contextKeys = contexts.map { it.academicYear to it.semester }.distinct()
            contextKeys.flatMap { (academicYear, semester) ->
                activeStudents.asSequence()
                    .filter { it.programId == programId && it.academicYear == academicYear && it.semesterNumber == semester }
                    .filter { courseId !in chosenByStudent[requireNotNull(it.id)].orEmpty() }
                    .map { student -> ElectiveChoiceExceptionDto(
                        studentId = requireNotNull(student.id),
                        fullName = student.fullName,
                        curriculum = student.programId?.let(programNames::get).orEmpty(),
                        group = student.groupId?.let(groupNames::get).orEmpty(),
                        subject = course.subject?.name ?: course.subjectName ?: course.title.orEmpty(),
                        academicYear = academicYear,
                        semester = semester,
                        status = "TANLANMAGAN",
                    ) }.toList()
            }
        }.distinctBy { Triple(it.studentId, it.subject, it.semester) }.sortedBy { it.fullName }
    }

    @Transactional(readOnly = true)
    fun learningParticipation(): List<LearningParticipationDto> {
        val groupNames = groupNames()
        val contentNames = contents.findAll().filter { !it.deleted }.associate { requireNotNull(it.id) to it.title }
        return activities.findAllByDeletedFalseOrderByOccurredAtDesc().map { event ->
            val enrollment = event.enrollment
            val student = enrollment.student
            val course = enrollment.course
            LearningParticipationDto(
                eventId = requireNotNull(event.id),
                studentId = requireNotNull(student.id),
                fullName = student.fullName,
                group = student.groupId?.let(groupNames::get) ?: course.groupName.orEmpty(),
                program = course.subject?.program?.name.orEmpty(),
                lesson = if (event.sourceType == LearningActivitySource.COURSE_CONTENT) contentNames[event.sourceId]
                    ?: course.title.orEmpty() else course.title.orEmpty(),
                eventType = event.eventType.name,
                loginDate = event.occurredAt,
                durationSeconds = event.durationSeconds,
            )
        }
    }

    @Transactional(readOnly = true)
    fun studentIps(): List<StudentIpReportDto> {
        val userLogins = auditLogs.findTop1000ByActionOrderByTimestampDesc("LOGIN_SUCCESS")
            .filter { !it.username.isNullOrBlank() && !it.ip.isNullOrBlank() }
            .groupBy { requireNotNull(it.username) }
        val groupNames = groupNames()
        return students.findAll().mapNotNull { student ->
            val logs = userLogins[student.user.username].orEmpty()
            if (logs.isEmpty()) return@mapNotNull null
            StudentIpReportDto(
                studentId = requireNotNull(student.id),
                fullName = student.fullName,
                studentNumber = student.studentNumber,
                group = student.groupId?.let(groupNames::get).orEmpty(),
                username = student.user.username,
                ipAddresses = logs.mapNotNull { it.ip }.distinct(),
                loginCount = logs.size,
                lastSeenAt = logs.maxOf { it.timestamp },
            )
        }.sortedByDescending { it.lastSeenAt }
    }

    @Transactional(readOnly = true)
    fun lessonComments(): List<LessonCommentReportDto> {
        val enrollmentContexts = enrollments.findAllByDeletedFalseOrderByAcademicYearDescSemesterDescEnrolledAtDesc()
            .groupBy { requireNotNull(it.course.id) }
        return forumPosts.findAllByDeletedFalseOrderByCreatedAtDesc().map { post ->
            val course = post.topic.course
            val contexts = enrollmentContexts[requireNotNull(course.id)].orEmpty()
            LessonCommentReportDto(
                postId = requireNotNull(post.id),
                academicYear = contexts.firstOrNull()?.academicYear.orEmpty(),
                program = course.subject?.program?.name.orEmpty(),
                semester = contexts.firstOrNull()?.semester,
                course = course.title.orEmpty(),
                topic = post.topic.title,
                author = post.author.fullName ?: post.author.username,
                comment = post.body,
                createdAt = post.createdAt,
                hidden = post.hiddenAt != null,
            )
        }
    }

    private fun groupNames() = groups.findAll().filter { !it.deleted }.associate { requireNotNull(it.id) to it.name }
    private fun programNames() = programs.findAll().filter { !it.deleted }.associate { requireNotNull(it.id) to it.name }
}
