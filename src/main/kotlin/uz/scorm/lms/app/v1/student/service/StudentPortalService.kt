package uz.scorm.lms.app.v1.student.service

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.notification.service.NotificationService
import uz.scorm.lms.app.v1.courses.model.CourseEnrollmentStatus
import uz.scorm.lms.app.v1.courses.repository.CourseEnrollmentRepository
import uz.scorm.lms.app.v1.courses.service.StudyPlanService
import uz.scorm.lms.app.v1.attendance.service.AttendanceService
import uz.scorm.lms.app.v1.assignment.service.AssignmentService
import uz.scorm.lms.app.v1.quiz.service.QuizService
import uz.scorm.lms.app.v1.session.dto.StudentLearningSessionDto
import uz.scorm.lms.app.v1.session.service.LearningSessionService
import uz.scorm.lms.app.v1.exam.service.ExamSessionService
import uz.scorm.lms.app.v1.exam.service.ExamResultService
import uz.scorm.lms.app.v1.student.dto.*
import uz.scorm.lms.app.v1.student.model.StudentProfile
import uz.scorm.lms.app.v1.student.repository.StudentRepository
import uz.scorm.lms.app.v1.user.model.User
import uz.scorm.lms.app.v1.user.repository.UserRepository
import uz.scorm.lms.app.v1.classifier.service.GeographyClassifierService
import java.time.LocalDate

@Service
class StudentPortalService(
    private val studentRepository: StudentRepository,
    private val userRepository: UserRepository,
    private val notificationService: NotificationService,
    private val enrollmentRepository: CourseEnrollmentRepository,
    private val studyPlanService: StudyPlanService,
    private val attendanceService: AttendanceService,
    private val assignmentService: AssignmentService,
    private val quizService: QuizService,
    private val learningSessionService: LearningSessionService,
    private val examSessionService: ExamSessionService,
    private val examResultService: ExamResultService,
    private val classifierService: GeographyClassifierService,
) {

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private fun profile(user: User): StudentProfile? =
        studentRepository.findByUserId(user.id!!)

    private fun profileOrThrow(user: User): StudentProfile =
        profile(user) ?: throw NoSuchElementException("Talaba profili topilmadi")

    // ─── Profile ─────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    fun getProfile(user: User): StudentProfileResponse = toProfileResponse(profileOrThrow(user))

    @Transactional
    fun updateProfile(user: User, req: UpdateStudentProfileRequest): StudentProfileResponse {
        val s = profileOrThrow(user)
        req.phoneNumber?.let  { s.phoneNumber = it; user.phone = it }
        req.email?.let        { s.email = it; user.email = it }
        if (req.currentRegionId != null || req.currentDistrictId != null) {
            val current = classifierService.resolveAddress(req.currentRegionId, req.currentDistrictId, req.currentRegion, req.currentDistrict)
            s.currentRegion = current.regionName
            s.currentRegionId = current.regionId
            s.currentDistrict = current.districtName
            s.currentDistrictId = current.districtId
        } else {
            req.currentRegion?.let { s.currentRegion = it }
            req.currentDistrict?.let { s.currentDistrict = it }
        }
        req.currentAddress?.let   { s.currentAddress = it }
        req.photoUrl?.let         { s.photoUrl = it }
        userRepository.save(user)
        return toProfileResponse(studentRepository.save(s))
    }

    // ─── Dashboard stats ─────────────────────────────────────────────────────

    @Transactional
    fun getDashboardStats(user: User): StudentDashboardStatsDto {
        val plan = studyPlanService.studyPlan(requireNotNull(user.id), null)
        val attendance = attendanceService.studentStats(requireNotNull(user.id))
        return StudentDashboardStatsDto(
            activeCourses        = plan.courses.count { it.status == "active" },
            completedCourses     = plan.courses.count { it.status == "completed" },
            pendingAssignments   = assignmentService.studentAssignments(requireNotNull(user.id))
                .count { it.status == "pending" || it.status == "overdue" },
            upcomingTests        = quizService.studentQuizzes(requireNotNull(user.id)).count { it.status == "upcoming" },
            averageGrade         = 0.0,
            attendancePercentage = attendance.attendancePercentage,
            gpa                  = 0.0,
            totalCredits         = plan.completedCredits,
            learningStreak       = 0,
        )
    }

    // ─── Courses ─────────────────────────────────────────────────────────────

    @Transactional
    fun getCourses(user: User): List<StudentCourseDto> {
        val student = profileOrThrow(user)
        return enrollmentRepository.findAllByStudentIdAndStatusInAndDeletedFalseOrderByEnrolledAtDesc(
            requireNotNull(student.id),
            setOf(CourseEnrollmentStatus.ACTIVE, CourseEnrollmentStatus.COMPLETED),
        ).map { enrollment ->
            val course = enrollment.course
            val calculated = studyPlanService.courseProgress(requireNotNull(course.id), requireNotNull(user.id))
            StudentCourseDto(
                id = requireNotNull(course.id).toString(),
                title = course.title.orEmpty(),
                description = course.description ?: course.shortDescription.orEmpty(),
                instructor = course.userId?.let { ownerId ->
                    userRepository.findById(ownerId).orElse(null)?.let {
                        it.fullName?.takeIf(String::isNotBlank) ?: it.username
                    }
                } ?: "O'qituvchi",
                progress = calculated.progress,
                status = calculated.status,
                credits = enrollment.credits,
                imageUrl = course.thumbnail,
            )
        }
    }

    // ─── Schedule ────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    fun getSchedule(
        user: User,
        startDate: LocalDate? = null,
        endDate: LocalDate? = null,
        courseId: Long? = null,
        dayOfWeek: Int? = null,
    ): List<StudentLearningSessionDto> = learningSessionService.studentSessions(
        requireNotNull(user.id), startDate, endDate, courseId, dayOfWeek,
    )

    // ─── Attendance ──────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    fun getAttendance(
        user: User,
        courseId: String? = null,
        startDate: LocalDate? = null,
        endDate: LocalDate? = null,
        status: String? = null,
    ): List<StudentAttendanceRecordDto> = attendanceService.studentRecords(
        requireNotNull(user.id), attendanceCourseId(courseId), startDate, endDate, status,
    )

    @Transactional(readOnly = true)
    fun getAttendanceStats(user: User): StudentAttendanceStatsDto =
        attendanceService.studentStats(requireNotNull(user.id))

    @Transactional(readOnly = true)
    fun getAttendanceSummary(user: User): StudentAttendanceSummaryDto =
        attendanceService.studentSummary(requireNotNull(user.id))

    @Transactional(readOnly = true)
    fun getAttendancePercentage(user: User, courseId: String? = null): AttendancePercentageDto =
        attendanceService.studentPercentage(requireNotNull(user.id), attendanceCourseId(courseId))

    private fun attendanceCourseId(courseId: String?): Long? = courseId?.let {
        it.toLongOrNull()?.takeIf { value -> value > 0 }
            ?: throw IllegalArgumentException("Kurs identifikatori noto'g'ri")
    }

    // ─── Grades ──────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    fun getGrades(user: User, courseId: String? = null): List<StudentGradeDto> = emptyList()

    @Transactional(readOnly = true)
    fun getGradeSummary(user: User): StudentGradeSummaryDto = StudentGradeSummaryDto()

    @Transactional(readOnly = true)
    fun getGPA(user: User): StudentGPADto {
        val s = profile(user)
        return StudentGPADto(
            currentGPA       = 0.0,
            cumulativeGPA    = 0.0,
            totalCredits     = 0,
            completedCredits = 0,
            gradePoints      = 0.0,
        )
    }

    @Transactional(readOnly = true)
    fun getTranscript(user: User): StudentTranscriptDto {
        val s = profile(user)
        val fullName = s?.let { "${it.lastName} ${it.firstName}" } ?: user.username
        return StudentTranscriptDto(
            studentId    = s?.id?.toString() ?: user.id.toString(),
            studentName  = fullName,
            academicYear = s?.academicYear ?: "2024-2025",
            semesters    = emptyList(),
            cumulativeGPA = 0.0,
            totalCredits  = 0,
            degreeProgress = 0.0,
        )
    }

    // ─── Assignments ─────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    fun getAssignments(
        user: User,
        status: String? = null,
        courseId: Long? = null,
        priority: String? = null,
    ): List<StudentAssignmentDto> = assignmentService.studentAssignments(
        requireNotNull(user.id),
        status,
        courseId,
        priority,
    )

    // ─── Tests ───────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    fun getTests(user: User, status: String? = null, courseId: Long? = null): List<StudentTestDto> =
        quizService.studentQuizzes(requireNotNull(user.id), status, courseId)

    @Transactional(readOnly = true)
    fun getTestHistory(user: User) = quizService.history(requireNotNull(user.id))

    // ─── Activity ────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    fun getActivity(user: User): List<StudentActivityItemDto> = emptyList()

    // ─── Notification summary ─────────────────────────────────────────────────

    @Transactional(readOnly = true)
    fun getNotificationSummary(user: User): StudentNotificationSummaryDto {
        val countDto = notificationService.getUnreadCount(user.id!!)
        return StudentNotificationSummaryDto(unreadCount = countDto.count.toInt(), urgent = 0)
    }

    // ─── Exams ───────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    fun getExams(user: User): List<StudentExamDto> {
        val enrollmentIds = studentEnrollments(user).mapNotNull { it.id }
        return examSessionService.getStudentSessions(enrollmentIds).map { session ->
            StudentExamDto(
                id = session.id, title = session.title, course = session.courseTitle, courseId = session.courseId,
                date = session.examDate.toString(), duration = session.durationMinutes, maxScore = 100,
                status = when (session.status) {
                    "PUBLISHED" -> "upcoming"; "ONGOING" -> "active"; "COMPLETED" -> "completed"; else -> "upcoming"
                },
                type = when (session.examType) { "ORAL" -> "oral"; "PRACTICAL" -> "practical"; else -> "written" },
                time = session.examTime.toString(), location = session.location,
                attendanceStatus = session.myAttendanceStatus, resultPublished = session.resultPublished,
            )
        }
    }

    @Transactional(readOnly = true)
    fun getExamResults(user: User): List<StudentExamResultDto> {
        val sessions = getExams(user).associateBy { it.id }
        return examResultService.studentResults(requireNotNull(user.id)).map { result ->
            val session = sessions[result.examSessionId]
            StudentExamResultDto(
                id = result.id, examId = result.examSessionId, examTitle = result.examTitle,
                course = session?.course.orEmpty(), date = result.examDate, score = result.score.toInt(),
                maxScore = result.totalScore.toInt(), percentage = result.percentage, passed = result.passed,
                duration = session?.duration ?: 0, grade = result.grade, attendanceStatus = result.attendanceStatus,
            )
        }
    }

    @Transactional(readOnly = true)
    fun getExamStats(user: User): StudentExamStatsDto {
        val exams = getExams(user)
        val results = getExamResults(user)
        return StudentExamStatsDto(
            total = exams.size, upcoming = exams.count { it.status == "upcoming" || it.status == "active" },
            completed = exams.count { it.status == "completed" },
            avgScore = results.map { it.percentage }.let { if (it.isEmpty()) 0.0 else it.average() },
            passRate = if (results.isEmpty()) 0.0 else results.count { it.passed } * 100.0 / results.size,
        )
    }

    private fun studentEnrollments(user: User) = enrollmentRepository
        .findAllByStudentIdAndStatusInAndDeletedFalseOrderByEnrolledAtDesc(
            requireNotNull(profileOrThrow(user).id), setOf(CourseEnrollmentStatus.ACTIVE, CourseEnrollmentStatus.COMPLETED),
        )

    // ─── Reports ─────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    fun getAcademicStats(user: User): AcademicStatsDto = AcademicStatsDto()

    @Transactional(readOnly = true)
    fun getMonthlyData(): List<MonthlyDataDto> {
        val currentYear = LocalDate.now().year
        return listOf(
            MonthlyDataDto("Sentabr",  0.0, 0.0, 0),
            MonthlyDataDto("Oktabr",   0.0, 0.0, 0),
            MonthlyDataDto("Noyabr",   0.0, 0.0, 0),
            MonthlyDataDto("Dekabr",   0.0, 0.0, 0),
            MonthlyDataDto("Yanvar",   0.0, 0.0, 0),
            MonthlyDataDto("Fevral",   0.0, 0.0, 0),
        )
    }

    // ─── Mapper ──────────────────────────────────────────────────────────────

    private fun toProfileResponse(s: StudentProfile) = StudentProfileResponse(
        id               = s.id,
        pinfl            = s.pinfl,
        lastName         = s.lastName,
        firstName        = s.firstName,
        middleName       = s.middleName,
        fullName         = "${s.lastName} ${s.firstName}${s.middleName?.let { " $it" } ?: ""}",
        birthDate        = s.birthDate,
        gender           = s.gender,
        citizenship      = s.citizenship,
        citizenshipCountryId = s.citizenshipCountryId,
        photoUrl         = s.photoUrl,
        phoneNumber      = s.phoneNumber,
        email            = s.email,
        permanentRegion  = s.permanentRegion,
        permanentRegionId = s.permanentRegionId,
        permanentDistrict= s.permanentDistrict,
        permanentDistrictId = s.permanentDistrictId,
        permanentAddress = s.permanentAddress,
        currentRegion    = s.currentRegion,
        currentRegionId  = s.currentRegionId,
        currentDistrict  = s.currentDistrict,
        currentDistrictId = s.currentDistrictId,
        currentAddress   = s.currentAddress,
        studentNumber    = s.studentNumber,
        degreeLevel      = s.degreeLevel,
        educationForm    = s.educationForm,
        educationLanguage= s.educationLanguage,
        courseNumber     = s.courseNumber,
        groupId          = s.groupId,
        academicYear     = s.academicYear,
        studentStatus    = s.studentStatus,
        paymentType      = s.paymentType,
        username         = s.user.username,
        lastLoginAt      = s.user.lastLoginAt,
    )
}
