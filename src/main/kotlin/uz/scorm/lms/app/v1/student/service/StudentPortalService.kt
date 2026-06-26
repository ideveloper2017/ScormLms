package uz.scorm.lms.app.v1.student.service

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.notification.service.NotificationService
import uz.scorm.lms.app.v1.student.dto.*
import uz.scorm.lms.app.v1.student.model.StudentProfile
import uz.scorm.lms.app.v1.student.repository.StudentRepository
import uz.scorm.lms.app.v1.user.model.User
import uz.scorm.lms.app.v1.user.repository.UserRepository
import java.time.LocalDate

@Service
class StudentPortalService(
    private val studentRepository: StudentRepository,
    private val userRepository: UserRepository,
    private val notificationService: NotificationService,
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
        req.currentRegion?.let    { s.currentRegion = it }
        req.currentDistrict?.let  { s.currentDistrict = it }
        req.currentAddress?.let   { s.currentAddress = it }
        req.photoUrl?.let         { s.photoUrl = it }
        userRepository.save(user)
        return toProfileResponse(studentRepository.save(s))
    }

    // ─── Dashboard stats ─────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    fun getDashboardStats(user: User): StudentDashboardStatsDto {
        val s = profile(user)
        return StudentDashboardStatsDto(
            activeCourses        = 0,
            completedCourses     = 0,
            pendingAssignments   = 0,
            upcomingTests        = 0,
            averageGrade         = 0.0,
            attendancePercentage = 0.0,
            gpa                  = 0.0,
            totalCredits         = 0,
            learningStreak       = 0,
        )
    }

    // ─── Courses ─────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    fun getCourses(user: User): List<StudentCourseDto> = emptyList()

    // ─── Schedule ────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    fun getSchedule(user: User): List<StudentScheduleItemDto> = emptyList()

    // ─── Attendance ──────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    fun getAttendance(user: User, courseId: String? = null): List<StudentAttendanceRecordDto> =
        emptyList()

    @Transactional(readOnly = true)
    fun getAttendanceStats(user: User): StudentAttendanceStatsDto = StudentAttendanceStatsDto()

    @Transactional(readOnly = true)
    fun getAttendanceSummary(user: User): StudentAttendanceSummaryDto = StudentAttendanceSummaryDto()

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
    fun getAssignments(user: User): List<StudentAssignmentDto> = emptyList()

    // ─── Tests ───────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    fun getTests(user: User): List<StudentTestDto> = emptyList()

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
    fun getExams(user: User): List<StudentExamDto> = emptyList()

    @Transactional(readOnly = true)
    fun getExamResults(user: User): List<StudentExamResultDto> = emptyList()

    @Transactional(readOnly = true)
    fun getExamStats(user: User): StudentExamStatsDto = StudentExamStatsDto()

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
        photoUrl         = s.photoUrl,
        phoneNumber      = s.phoneNumber,
        email            = s.email,
        permanentRegion  = s.permanentRegion,
        permanentDistrict= s.permanentDistrict,
        permanentAddress = s.permanentAddress,
        currentRegion    = s.currentRegion,
        currentDistrict  = s.currentDistrict,
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
