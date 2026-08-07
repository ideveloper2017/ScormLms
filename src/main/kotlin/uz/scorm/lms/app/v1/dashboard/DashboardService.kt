package uz.scorm.lms.app.v1.dashboard

import com.sun.management.OperatingSystemMXBean
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.assignment.model.SubmissionStatus
import uz.scorm.lms.app.v1.assignment.repository.AssignmentSubmissionRepository
import uz.scorm.lms.app.v1.audit.model.AuditLog
import uz.scorm.lms.app.v1.audit.repository.AuditLogRepository
import uz.scorm.lms.app.v1.courses.model.Course
import uz.scorm.lms.app.v1.courses.model.CourseEnrollment
import uz.scorm.lms.app.v1.courses.model.CourseEnrollmentStatus
import uz.scorm.lms.app.v1.courses.model.CourseStatus
import uz.scorm.lms.app.v1.courses.repository.CourseEnrollmentRepository
import uz.scorm.lms.app.v1.courses.repository.CourseRepository
import uz.scorm.lms.app.v1.exam.model.ExamSessionStatus
import uz.scorm.lms.app.v1.exam.repository.ExamSessionRepository
import uz.scorm.lms.app.v1.scorm.repository.ScormPackageRepository
import uz.scorm.lms.app.v1.session.repository.CourseLearningSessionRepository
import uz.scorm.lms.app.v1.student.repository.StudentRepository
import uz.scorm.lms.app.v1.teacher.repository.TeacherRepository
import uz.scorm.lms.app.v1.user.model.User
import uz.scorm.lms.app.v1.user.model.UserStatus
import uz.scorm.lms.app.v1.user.repository.UserRepository
import java.lang.management.ManagementFactory
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.time.temporal.ChronoUnit
import java.time.YearMonth
import kotlin.math.round

@Service
class DashboardService(
    private val userRepository: UserRepository,
    private val studentRepository: StudentRepository,
    private val teacherRepository: TeacherRepository,
    private val courseRepository: CourseRepository,
    private val enrollmentRepository: CourseEnrollmentRepository,
    private val examSessionRepository: ExamSessionRepository,
    private val scormPackageRepository: ScormPackageRepository,
    private val submissionRepository: AssignmentSubmissionRepository,
    private val learningSessionRepository: CourseLearningSessionRepository,
    private val auditLogRepository: AuditLogRepository,
) {
    private val zone: ZoneId = ZoneId.systemDefault()

    @Transactional(readOnly = true)
    fun adminStats(): AdminSystemStatsDto {
        val users = userRepository.findAll().filterNot { it.deleted }
        val courses = courseRepository.findAllByDeletedFalseOrderByCreatedAtDesc()
        val exams = examSessionRepository.findAllByDeletedFalseOrderByExamDateDesc()
        val enrollments = enrollmentRepository.findAll().filterNot { it.deleted }
        val submissions = submissionRepository.findAllByDeletedFalseOrderBySubmittedAtDesc()
        val graded = submissions.filter { it.status == SubmissionStatus.GRADED && it.score != null }
        val avgAchievement = graded.mapNotNull { submission ->
            val maxScore = submission.assignment.maxScore.takeIf { it > 0 } ?: return@mapNotNull null
            submission.score?.toDouble()?.times(100.0)?.div(maxScore)
        }.averageOrZero()

        return AdminSystemStatsDto(
            totalUsers = users.size.toLong(),
            activeUsers = users.count { it.status == UserStatus.ACTIVE }.toLong(),
            totalStudents = studentRepository.count(),
            totalTeachers = teacherRepository.count(),
            totalCourses = courses.size.toLong(),
            activeCourses = courses.count { it.status == CourseStatus.PUBLISHED.name }.toLong(),
            totalExams = exams.size.toLong(),
            activeExams = exams.count { it.status in setOf(ExamSessionStatus.PUBLISHED, ExamSessionStatus.ONGOING) }.toLong(),
            scormPackages = scormPackageRepository.countByDeletedFalse(),
            systemUptime = ManagementFactory.getRuntimeMXBean().uptime / 1_000,
            serverLoad = cpuUsage(),
            contentCompletion = enrollments.map { it.progress.toDouble() }.averageOrZero(),
            avgAchievement = avgAchievement,
            passRate = if (graded.isEmpty()) 0.0 else percent(graded.count { (it.score ?: 0) >= it.assignment.maxScore * 0.6 }, graded.size),
        )
    }

    @Transactional(readOnly = true)
    fun recentActivities(): List<AdminActivityDto> =
        auditLogRepository.findTop200ByOrderByTimestampDesc().take(20).map { log ->
            AdminActivityDto(
                id = log.id ?: 0,
                username = log.username ?: "system",
                action = log.action,
                details = log.details,
                timestamp = log.timestamp,
                type = activityType(log),
            )
        }

    @Transactional(readOnly = true)
    fun monthlyMetrics(): List<AdminMonthlyMetricDto> {
        val months = (5 downTo 0).map { YearMonth.now(zone).minusMonths(it.toLong()) }
        val users = userRepository.findAll().filterNot { it.deleted }
        val courses = courseRepository.findAllByDeletedFalseOrderByCreatedAtDesc()
        val exams = examSessionRepository.findAllByDeletedFalseOrderByExamDateDesc()
        return months.map { month ->
            AdminMonthlyMetricDto(
                name = month.toString(),
                users = users.count { it.createdAt?.atZone(zone)?.let(YearMonth::from) == month }.toLong(),
                courses = courses.count { it.createdAt?.atZone(zone)?.let(YearMonth::from) == month }.toLong(),
                exams = exams.count { it.createdAt?.atZone(zone)?.let(YearMonth::from) == month }.toLong(),
            )
        }
    }

    @Transactional(readOnly = true)
    fun topInstructors(): List<AdminTopInstructorDto> = teacherRepository.findAll()
        .asSequence()
        .filterNot { it.deleted }
        .map { teacher ->
            val userId = teacher.user?.id
            val courses = if (userId == null) emptyList() else courseRepository.findAllByUserIdAndDeletedFalseOrderByCreatedAtDesc(userId)
            val enrollments = courses.flatMap(::courseEnrollments)
            AdminTopInstructorDto(
                id = (teacher.id ?: 0).toString(),
                fullName = teacher.fullName,
                departmentName = teacher.department?.name,
                totalStudents = enrollments.mapNotNull { it.student.id }.distinct().size.toLong(),
                totalCourses = courses.size.toLong(),
                rating = 0.0,
            )
        }
        .sortedWith(compareByDescending<AdminTopInstructorDto> { it.totalStudents }.thenBy { it.fullName })
        .take(10)
        .toList()

    @Transactional(readOnly = true)
    fun instructorStats(user: User): InstructorStatsDto {
        val userId = requireNotNull(user.id) { "Foydalanuvchi IDsi mavjud emas" }
        val courses = ownedCourses(userId)
        val enrollments = courses.flatMap(::courseEnrollments)
        val submissions = submissionRepository.findAllByAssignmentCourseUserIdAndDeletedFalseOrderBySubmittedAtDesc(userId)
        val today = LocalDate.now(zone)
        val todayLessons = learningSessionRepository.findAllByCourseUserIdAndDeletedFalseOrderByStartsAtDesc(userId)
            .count { it.startsAt.atZone(zone).toLocalDate() == today }
        return InstructorStatsDto(
            totalStudents = enrollments.mapNotNull { it.student.id }.distinct().size.toLong(),
            activeCourses = courses.count { it.status == CourseStatus.PUBLISHED.name }.toLong(),
            completedCourses = courses.count { it.status == CourseStatus.ARCHIVED.name }.toLong(),
            pendingAssignments = submissions.count { it.status == SubmissionStatus.SUBMITTED }.toLong(),
            newSubmissions = submissions.count { ChronoUnit.DAYS.between(it.submittedAt, Instant.now()) <= 7 }.toLong(),
            avgRating = 0.0,
            todayLessons = todayLessons.toLong(),
            unreadMessages = 0,
        )
    }

    @Transactional(readOnly = true)
    fun instructorCourses(user: User): List<InstructorCourseDto> = ownedCourses(requireNotNull(user.id)).map { course ->
        val enrollments = courseEnrollments(course)
        val progress = enrollments.map { it.progress.toDouble() }.averageOrZero()
        InstructorCourseDto(
            id = requireNotNull(course.id).toString(),
            title = course.title.orEmpty(),
            description = course.shortDescription ?: course.description,
            students = enrollments.size.toLong(),
            progress = progress,
            status = when (course.status) {
                CourseStatus.PUBLISHED.name -> "active"
                CourseStatus.ARCHIVED.name -> "completed"
                else -> "draft"
            },
            startDate = (course.startDate ?: course.createdAt?.atZone(zone)?.toLocalDate() ?: LocalDate.now(zone)).toString(),
            endDate = (course.endDate ?: course.startDate ?: LocalDate.now(zone)).toString(),
            avgGrade = 0.0,
            completionRate = if (enrollments.isEmpty()) 0.0 else percent(enrollments.count { it.status == CourseEnrollmentStatus.COMPLETED }, enrollments.size),
        )
    }

    @Transactional(readOnly = true)
    fun recentInstructorSubmissions(user: User): List<InstructorSubmissionDto> =
        submissionRepository.findAllByAssignmentCourseUserIdAndDeletedFalseOrderBySubmittedAtDesc(requireNotNull(user.id))
            .take(10)
            .map { submission ->
                InstructorSubmissionDto(
                    id = requireNotNull(submission.id).toString(),
                    studentName = submission.enrollment.student.user.fullName
                        ?: "${submission.enrollment.student.lastName} ${submission.enrollment.student.firstName}",
                    assignmentTitle = submission.assignment.title,
                    courseTitle = submission.assignment.course.title.orEmpty(),
                    submittedAt = submission.submittedAt,
                    status = when {
                        submission.status == SubmissionStatus.GRADED -> "graded"
                        submission.late -> "late"
                        else -> "pending"
                    },
                )
            }

    @Transactional(readOnly = true)
    fun todayInstructorLessons(user: User): List<InstructorLessonDto> {
        val today = LocalDate.now(zone)
        return learningSessionRepository.findAllByCourseUserIdAndDeletedFalseOrderByStartsAtDesc(requireNotNull(user.id))
            .filter { it.startsAt.atZone(zone).toLocalDate() == today }
            .sortedBy { it.startsAt }
            .map { session ->
                InstructorLessonDto(
                    id = requireNotNull(session.id).toString(),
                    time = session.startsAt.atZone(zone).format(DateTimeFormatter.ofPattern("HH:mm")),
                    subject = session.course.title.orEmpty(),
                    room = listOfNotNull(session.building, session.room).joinToString(", "),
                    group = session.course.groupName.orEmpty(),
                    students = enrollmentRepository.countByCourseIdAndStatusAndDeletedFalse(requireNotNull(session.course.id), CourseEnrollmentStatus.ACTIVE),
                    type = session.sessionType.name.lowercase(),
                )
            }
    }

    @Transactional(readOnly = true)
    fun instructorWeeklyActivity(user: User): List<InstructorWeeklyActivityDto> {
        val submissions = submissionRepository.findAllByAssignmentCourseUserIdAndDeletedFalseOrderBySubmittedAtDesc(requireNotNull(user.id))
        return (6 downTo 0).map { offset ->
            val day = LocalDate.now(zone).minusDays(offset.toLong())
            InstructorWeeklyActivityDto(
                day = day.toString(),
                submissions = submissions.count { it.submittedAt.atZone(zone).toLocalDate() == day }.toLong(),
                tests = 0,
            )
        }
    }

    @Transactional(readOnly = true)
    fun teacherProfile(user: User): TeacherProfileDto {
        val teacher = teacherRepository.findByUserId(requireNotNull(user.id))
        return TeacherProfileDto(
            id = (teacher?.id ?: user.id ?: 0).toString(),
            fullName = teacher?.fullName ?: user.fullName ?: user.username,
            username = user.username,
            email = teacher?.email ?: user.email,
            phone = teacher?.phone ?: user.phone,
            position = teacher?.position,
            academicDegree = teacher?.academicDegree,
            academicRank = teacher?.academicRank,
            departmentName = teacher?.department?.name,
            photoUrl = user.facePhotoUrl,
        )
    }

    @Transactional(readOnly = true)
    fun teacherDashboardStats(user: User): TeacherDashboardStatsDto {
        val stats = instructorStats(user)
        return TeacherDashboardStatsDto(
            activeCourses = stats.activeCourses,
            totalStudents = stats.totalStudents,
            pendingSubmissions = stats.pendingAssignments,
            todayLessons = stats.todayLessons,
            avgTestScore = 0.0,
            newSubmissions = stats.newSubmissions,
            unreadMessages = stats.unreadMessages,
        )
    }

    @Transactional(readOnly = true)
    fun teacherStudents(user: User, courseId: Long?): List<TeacherStudentDto> {
        val userId = requireNotNull(user.id)
        val courses = ownedCourses(userId).let { owned ->
            if (courseId == null) owned else listOf(owned.firstOrNull { it.id == courseId }
                ?: throw NoSuchElementException("Kurs topilmadi yoki sizga tegishli emas: $courseId"))
        }
        return courses.flatMap(::courseEnrollments)
            .distinctBy { it.student.id }
            .map { enrollment ->
                val progress = enrollment.progress.toDouble()
                TeacherStudentDto(
                    id = requireNotNull(enrollment.student.id).toString(),
                    fullName = enrollment.student.user.fullName
                        ?: "${enrollment.student.lastName} ${enrollment.student.firstName}",
                    studentNumber = enrollment.student.studentNumber,
                    groupName = enrollment.course.groupName,
                    attendance = 0.0,
                    avgScore = progress,
                    status = when {
                        progress >= 85 -> "excellent"
                        progress < 50 -> "at-risk"
                        else -> "active"
                    },
                )
            }
            .sortedBy { it.fullName }
    }

    @Transactional(readOnly = true)
    fun teacherGradebook(user: User, courseId: Long): List<TeacherGradebookEntryDto> {
        val course = ownedCourses(requireNotNull(user.id)).firstOrNull { it.id == courseId }
            ?: throw NoSuchElementException("Kurs topilmadi yoki sizga tegishli emas: $courseId")
        return courseEnrollments(course).map { enrollment ->
            val finalGrade = enrollment.progress.toDouble()
            TeacherGradebookEntryDto(
                studentId = requireNotNull(enrollment.student.id).toString(),
                studentName = enrollment.student.user.fullName
                    ?: "${enrollment.student.lastName} ${enrollment.student.firstName}",
                assignments = 0.0,
                tests = 0.0,
                attendance = 0.0,
                finalGrade = finalGrade,
                letterGrade = when {
                    finalGrade >= 90 -> "A"
                    finalGrade >= 80 -> "B"
                    finalGrade >= 70 -> "C"
                    finalGrade >= 60 -> "D"
                    else -> "F"
                },
            )
        }
    }

    @Transactional(readOnly = true)
    fun teacherTodaySchedule(user: User): List<TeacherTodayScheduleDto> {
        val today = LocalDate.now(zone)
        return learningSessionRepository.findAllByCourseUserIdAndDeletedFalseOrderByStartsAtDesc(requireNotNull(user.id))
            .filter { it.startsAt.atZone(zone).toLocalDate() == today }
            .sortedBy { it.startsAt }
            .map { session ->
                TeacherTodayScheduleDto(
                    id = requireNotNull(session.id).toString(),
                    startTime = session.startsAt.atZone(zone).format(DateTimeFormatter.ofPattern("HH:mm")),
                    endTime = session.endsAt.atZone(zone).format(DateTimeFormatter.ofPattern("HH:mm")),
                    subject = session.course.title.orEmpty(),
                    group = session.course.groupName.orEmpty(),
                    room = listOfNotNull(session.building, session.room).joinToString(", "),
                    type = session.sessionType.name.lowercase(),
                    students = enrollmentRepository.countByCourseIdAndStatusAndDeletedFalse(
                        requireNotNull(session.course.id),
                        CourseEnrollmentStatus.ACTIVE,
                    ),
                )
            }
    }

    @Transactional(readOnly = true)
    fun monitoringStats(): MonitoringStatsDto {
        val audit = auditLogRepository.findTop200ByOrderByTimestampDesc()
        val requests = audit.filter { it.method != null }
        val errors = requests.count { (it.status ?: 0) >= 400 }
        val memory = ManagementFactory.getMemoryMXBean().heapMemoryUsage
        val memoryUsage = if (memory.max <= 0) 0.0 else memory.used.toDouble() * 100.0 / memory.max
        val recentlyActive = Instant.now().minus(15, ChronoUnit.MINUTES)
        return MonitoringStatsDto(
            cpuUsage = cpuUsage(),
            memoryUsage = oneDecimal(memoryUsage),
            activeUsers = userRepository.findAll().count { !it.deleted && (it.lastLoginAt?.isAfter(recentlyActive) == true) }.toLong(),
            totalRequests = auditLogRepository.count(),
            errorRate = if (requests.isEmpty()) 0.0 else percent(errors, requests.size),
            uptime = ManagementFactory.getRuntimeMXBean().uptime / 1_000,
            avgResponseTime = 0.0,
            dbConnections = 0,
        )
    }

    @Transactional(readOnly = true)
    fun monitoringAlerts(): List<MonitoringAlertDto> =
        auditLogRepository.findTop200ByOrderByTimestampDesc()
            .asSequence()
            .filter { (it.status ?: 0) >= 400 }
            .take(20)
            .map { log ->
                val status = log.status ?: 0
                MonitoringAlertDto(
                    id = (log.id ?: 0).toString(),
                    type = if (status >= 500) "error" else "warning",
                    message = "HTTP $status: ${log.method.orEmpty()} ${log.path.orEmpty()}",
                    timestamp = log.timestamp,
                    resolved = false,
                )
            }
            .toList()

    private fun ownedCourses(userId: Long): List<Course> =
        courseRepository.findAllByUserIdAndDeletedFalseOrderByCreatedAtDesc(userId)

    private fun courseEnrollments(course: Course): List<CourseEnrollment> =
        enrollmentRepository.findAllByCourseIdAndDeletedFalseOrderByEnrolledAtDesc(requireNotNull(course.id))

    private fun activityType(log: AuditLog): String = when {
        (log.status ?: 0) >= 500 -> "error"
        (log.status ?: 0) >= 400 -> "warning"
        log.action.contains("FAIL", ignoreCase = true) -> "warning"
        else -> "success"
    }

    private fun cpuUsage(): Double {
        val os = ManagementFactory.getOperatingSystemMXBean() as? OperatingSystemMXBean ?: return 0.0
        val load = os.cpuLoad
        return if (load.isFinite() && load >= 0) oneDecimal(load * 100.0) else 0.0
    }

    private fun Iterable<Double>.averageOrZero(): Double =
        if (none()) 0.0 else oneDecimal(average())

    private fun percent(part: Int, total: Int): Double =
        if (total <= 0) 0.0 else oneDecimal(part.toDouble() * 100.0 / total)

    private fun oneDecimal(value: Double): Double = round(value * 10.0) / 10.0
}
