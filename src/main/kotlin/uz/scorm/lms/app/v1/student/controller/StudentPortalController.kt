package uz.scorm.lms.app.v1.student.controller

import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import uz.scorm.lms.app.common.ApiResponse
import uz.scorm.lms.app.security.CurrentUser
import uz.scorm.lms.app.v1.student.dto.*
import uz.scorm.lms.app.v1.student.service.StudentPortalService
import uz.scorm.lms.app.v1.user.model.User

@RestController
@RequestMapping("/api/v1/students/me")
@PreAuthorize("hasAuthority('STUDENT_READ')")
class StudentPortalController(private val svc: StudentPortalService) {

    // ─── Profile ─────────────────────────────────────────────────────────────

    @GetMapping
    fun getProfile(@CurrentUser user: User): ResponseEntity<ApiResponse<StudentProfileResponse>> =
        ResponseEntity.ok(ApiResponse.success(svc.getProfile(user)))

    @PutMapping
    @PreAuthorize("hasAuthority('STUDENT_WRITE')")
    fun updateProfile(
        @CurrentUser user: User,
        @RequestBody req: UpdateStudentProfileRequest,
    ): ResponseEntity<ApiResponse<StudentProfileResponse>> =
        ResponseEntity.ok(ApiResponse.success(svc.updateProfile(user, req)))

    // ─── Dashboard ───────────────────────────────────────────────────────────

    @GetMapping("/dashboard/stats")
    fun getDashboardStats(@CurrentUser user: User): ResponseEntity<ApiResponse<StudentDashboardStatsDto>> =
        ResponseEntity.ok(ApiResponse.success(svc.getDashboardStats(user)))

    @GetMapping("/dashboard/courses")
    fun getDashboardCourses(@CurrentUser user: User): ResponseEntity<ApiResponse<List<StudentCourseDto>>> =
        ResponseEntity.ok(ApiResponse.success(svc.getCourses(user)))

    @GetMapping("/dashboard/assignments")
    fun getDashboardAssignments(@CurrentUser user: User): ResponseEntity<ApiResponse<List<StudentAssignmentDto>>> =
        ResponseEntity.ok(ApiResponse.success(svc.getAssignments(user)))

    @GetMapping("/dashboard/tests")
    fun getDashboardTests(@CurrentUser user: User): ResponseEntity<ApiResponse<List<StudentTestDto>>> =
        ResponseEntity.ok(ApiResponse.success(svc.getTests(user)))

    @GetMapping("/dashboard/activity")
    fun getDashboardActivity(@CurrentUser user: User): ResponseEntity<ApiResponse<List<StudentActivityItemDto>>> =
        ResponseEntity.ok(ApiResponse.success(svc.getActivity(user)))

    @GetMapping("/dashboard/notifications")
    fun getDashboardNotifications(@CurrentUser user: User): ResponseEntity<ApiResponse<StudentNotificationSummaryDto>> =
        ResponseEntity.ok(ApiResponse.success(svc.getNotificationSummary(user)))

    // ─── Courses ─────────────────────────────────────────────────────────────

    @GetMapping("/courses")
    fun getCourses(@CurrentUser user: User): ResponseEntity<ApiResponse<List<StudentCourseDto>>> =
        ResponseEntity.ok(ApiResponse.success(svc.getCourses(user)))

    // ─── Schedule ────────────────────────────────────────────────────────────

    @GetMapping("/schedule")
    fun getSchedule(
        @CurrentUser user: User,
        @RequestParam(required = false) startDate: String?,
        @RequestParam(required = false) endDate: String?,
        @RequestParam(required = false) courseId: String?,
        @RequestParam(required = false) dayOfWeek: Int?,
    ): ResponseEntity<ApiResponse<List<StudentScheduleItemDto>>> =
        ResponseEntity.ok(ApiResponse.success(svc.getSchedule(user)))

    @GetMapping("/schedule/today")
    fun getTodaySchedule(@CurrentUser user: User): ResponseEntity<ApiResponse<List<StudentScheduleItemDto>>> =
        ResponseEntity.ok(ApiResponse.success(svc.getSchedule(user)))

    @GetMapping("/schedule/week")
    fun getWeekSchedule(@CurrentUser user: User): ResponseEntity<ApiResponse<List<StudentScheduleItemDto>>> =
        ResponseEntity.ok(ApiResponse.success(svc.getSchedule(user)))

    @GetMapping("/schedule/upcoming")
    fun getUpcomingSchedule(@CurrentUser user: User): ResponseEntity<ApiResponse<List<StudentScheduleItemDto>>> =
        ResponseEntity.ok(ApiResponse.success(svc.getSchedule(user)))

    @GetMapping("/schedule/next")
    fun getNextClass(@CurrentUser user: User): ResponseEntity<ApiResponse<StudentScheduleItemDto?>> =
        ResponseEntity.ok(ApiResponse.success(svc.getSchedule(user).firstOrNull()))

    @GetMapping("/schedule/week/{weekNumber}")
    fun getScheduleByWeek(
        @CurrentUser user: User,
        @PathVariable weekNumber: Int,
    ): ResponseEntity<ApiResponse<Map<String, Any>>> {
        val items = svc.getSchedule(user)
        val result = mapOf(
            "weekNumber" to weekNumber,
            "startDate" to java.time.LocalDate.now().toString(),
            "endDate" to java.time.LocalDate.now().plusDays(6).toString(),
            "items" to items,
        )
        return ResponseEntity.ok(ApiResponse.success(result))
    }

    // ─── Attendance ──────────────────────────────────────────────────────────

    @GetMapping("/attendance")
    fun getAttendance(
        @CurrentUser user: User,
        @RequestParam(required = false) courseId: String?,
        @RequestParam(required = false) startDate: String?,
        @RequestParam(required = false) endDate: String?,
        @RequestParam(required = false) status: String?,
    ): ResponseEntity<ApiResponse<List<StudentAttendanceRecordDto>>> =
        ResponseEntity.ok(ApiResponse.success(svc.getAttendance(user, courseId)))

    @GetMapping("/attendance/stats")
    fun getAttendanceStats(@CurrentUser user: User): ResponseEntity<ApiResponse<StudentAttendanceStatsDto>> =
        ResponseEntity.ok(ApiResponse.success(svc.getAttendanceStats(user)))

    @GetMapping("/attendance/summary")
    fun getAttendanceSummary(@CurrentUser user: User): ResponseEntity<ApiResponse<StudentAttendanceSummaryDto>> =
        ResponseEntity.ok(ApiResponse.success(svc.getAttendanceSummary(user)))

    @GetMapping("/attendance/percentage")
    fun getAttendancePercentage(@CurrentUser user: User): ResponseEntity<ApiResponse<AttendancePercentageDto>> =
        ResponseEntity.ok(ApiResponse.success(AttendancePercentageDto(0.0)))

    @GetMapping("/courses/{courseId}/attendance")
    fun getCourseAttendance(
        @CurrentUser user: User,
        @PathVariable courseId: String,
    ): ResponseEntity<ApiResponse<List<StudentAttendanceRecordDto>>> =
        ResponseEntity.ok(ApiResponse.success(svc.getAttendance(user, courseId)))

    @GetMapping("/courses/{courseId}/attendance/percentage")
    fun getCourseAttendancePercentage(
        @CurrentUser user: User,
        @PathVariable courseId: String,
    ): ResponseEntity<ApiResponse<AttendancePercentageDto>> =
        ResponseEntity.ok(ApiResponse.success(AttendancePercentageDto(0.0)))

    @GetMapping("/courses/{courseId}/grades")
    fun getCourseGrades(
        @CurrentUser user: User,
        @PathVariable courseId: String,
    ): ResponseEntity<ApiResponse<List<StudentGradeDto>>> =
        ResponseEntity.ok(ApiResponse.success(emptyList()))

    // ─── Grades ──────────────────────────────────────────────────────────────

    @GetMapping("/grades")
    fun getGrades(
        @CurrentUser user: User,
        @RequestParam(required = false) courseId: String?,
        @RequestParam(required = false) semester: String?,
        @RequestParam(required = false) academicYear: String?,
    ): ResponseEntity<ApiResponse<List<StudentGradeDto>>> =
        ResponseEntity.ok(ApiResponse.success(svc.getGrades(user, courseId)))

    @GetMapping("/grades/summary")
    fun getGradeSummary(@CurrentUser user: User): ResponseEntity<ApiResponse<StudentGradeSummaryDto>> =
        ResponseEntity.ok(ApiResponse.success(svc.getGradeSummary(user)))

    @GetMapping("/grades/distribution")
    fun getGradeDistribution(@CurrentUser user: User): ResponseEntity<ApiResponse<StudentGradeDistributionDto>> =
        ResponseEntity.ok(ApiResponse.success(StudentGradeDistributionDto()))

    @GetMapping("/gpa")
    fun getGPA(@CurrentUser user: User): ResponseEntity<ApiResponse<StudentGPADto>> =
        ResponseEntity.ok(ApiResponse.success(svc.getGPA(user)))

    @GetMapping("/transcript")
    fun getTranscript(@CurrentUser user: User): ResponseEntity<ApiResponse<StudentTranscriptDto>> =
        ResponseEntity.ok(ApiResponse.success(svc.getTranscript(user)))

    // ─── Assignments ─────────────────────────────────────────────────────────

    @GetMapping("/assignments")
    fun getAssignments(
        @CurrentUser user: User,
        @RequestParam(required = false) status: String?,
        @RequestParam(required = false) courseId: String?,
        @RequestParam(required = false) priority: String?,
    ): ResponseEntity<ApiResponse<List<StudentAssignmentDto>>> =
        ResponseEntity.ok(ApiResponse.success(svc.getAssignments(user)))

    // ─── Tests ───────────────────────────────────────────────────────────────

    @GetMapping("/tests")
    fun getTests(
        @CurrentUser user: User,
        @RequestParam(required = false) status: String?,
        @RequestParam(required = false) courseId: String?,
    ): ResponseEntity<ApiResponse<List<StudentTestDto>>> =
        ResponseEntity.ok(ApiResponse.success(svc.getTests(user)))

    @GetMapping("/tests/history")
    fun getTestHistory(@CurrentUser user: User): ResponseEntity<ApiResponse<List<StudentTestDto>>> =
        ResponseEntity.ok(ApiResponse.success(emptyList()))

    // ─── Exams (raw response — frontend uses res.data directly) ──────────────

    @GetMapping("/exams")
    fun getExams(@CurrentUser user: User): ResponseEntity<List<StudentExamDto>> =
        ResponseEntity.ok(svc.getExams(user))

    @GetMapping("/exams/results")
    fun getExamResults(@CurrentUser user: User): ResponseEntity<List<StudentExamResultDto>> =
        ResponseEntity.ok(svc.getExamResults(user))

    @GetMapping("/exams/stats")
    fun getExamStats(@CurrentUser user: User): ResponseEntity<StudentExamStatsDto> =
        ResponseEntity.ok(svc.getExamStats(user))

    // ─── Notifications ───────────────────────────────────────────────────────

    @GetMapping("/notifications")
    fun getNotifications(
        @CurrentUser user: User,
        @RequestParam(required = false) page: Int?,
        @RequestParam(required = false) size: Int?,
        @RequestParam(required = false) read: Boolean?,
    ): ResponseEntity<ApiResponse<List<StudentNotificationDto>>> =
        ResponseEntity.ok(ApiResponse.success(emptyList()))

    @GetMapping("/notifications/unread/count")
    fun getUnreadCount(@CurrentUser user: User): ResponseEntity<ApiResponse<UnreadCountDto>> =
        ResponseEntity.ok(ApiResponse.success(UnreadCountDto(0)))

    @PostMapping("/notifications/read-all")
    @PreAuthorize("hasAuthority('STUDENT_WRITE')")
    fun markAllRead(@CurrentUser user: User): ResponseEntity<ApiResponse<String>> =
        ResponseEntity.ok(ApiResponse.success("Barcha bildirishnomalar o'qildi deb belgilandi"))

    // ─── Reports (raw response) ──────────────────────────────────────────────

    @GetMapping("/reports")
    fun getReports(@CurrentUser user: User): ResponseEntity<List<ReportSummaryDto>> =
        ResponseEntity.ok(emptyList())

    @GetMapping("/reports/academic")
    fun getAcademicStats(@CurrentUser user: User): ResponseEntity<AcademicStatsDto> =
        ResponseEntity.ok(svc.getAcademicStats(user))

    @GetMapping("/reports/monthly")
    fun getMonthlyData(@CurrentUser user: User): ResponseEntity<List<MonthlyDataDto>> =
        ResponseEntity.ok(svc.getMonthlyData())

    @GetMapping("/reports/courses")
    fun getCourseCompletion(@CurrentUser user: User): ResponseEntity<List<CourseCompletionDto>> =
        ResponseEntity.ok(emptyList())

    // ─── Resources (raw response) ─────────────────────────────────────────────

    @GetMapping("/resources")
    fun getResources(
        @CurrentUser user: User,
        @RequestParam(required = false) courseId: String?,
        @RequestParam(required = false) type: String?,
        @RequestParam(required = false) category: String?,
    ): ResponseEntity<List<StudentResourceDto>> =
        ResponseEntity.ok(emptyList())

    @GetMapping("/resources/categories")
    fun getResourceCategories(@CurrentUser user: User): ResponseEntity<List<ResourceCategoryDto>> =
        ResponseEntity.ok(emptyList())
}
