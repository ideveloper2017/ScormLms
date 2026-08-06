package uz.scorm.lms.app.v1.student.controller

import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import uz.scorm.lms.app.common.ApiResponse
import uz.scorm.lms.app.security.CurrentUser
import uz.scorm.lms.app.v1.student.dto.*
import uz.scorm.lms.app.v1.student.service.StudentPortalService
import uz.scorm.lms.app.v1.courses.service.StudyPlanService
import uz.scorm.lms.app.v1.session.dto.StudentLearningSessionDto
import uz.scorm.lms.app.v1.user.model.User
import java.time.DayOfWeek
import java.time.LocalDate
import java.time.temporal.TemporalAdjusters
import java.time.temporal.WeekFields

@RestController
@RequestMapping("/api/v1/students/me")
@PreAuthorize("hasAuthority('STUDENT_READ')")
class StudentPortalController(
    private val svc: StudentPortalService,
    private val studyPlanService: StudyPlanService,
) {

    // ─── Profile ─────────────────────────────────────────────────────────────

    @GetMapping
    fun getProfile(@CurrentUser user: User): ResponseEntity<ApiResponse<StudentProfileResponse>> =
        ResponseEntity.ok(ApiResponse.success(svc.getProfile(user)))

    @PutMapping
    @PreAuthorize("hasAuthority('STUDENT_WRITE') or hasAuthority('USER_MANAGE')")
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

    @GetMapping("/study-plan")
    fun getStudyPlan(
        @CurrentUser user: User,
        @RequestParam(required = false) academicYear: String?,
    ): ResponseEntity<ApiResponse<StudentStudyPlanDto>> = ResponseEntity.ok(ApiResponse.success(
        studyPlanService.studyPlan(requireNotNull(user.id), academicYear)
    ))

    @GetMapping("/courses/{courseId}/progress")
    fun getCourseProgress(
        @CurrentUser user: User,
        @PathVariable courseId: Long,
    ): ResponseEntity<ApiResponse<StudentCourseProgressDto>> = ResponseEntity.ok(ApiResponse.success(
        studyPlanService.courseProgress(courseId, requireNotNull(user.id))
    ))

    @PostMapping("/courses/{courseId}/contents/{contentId}/progress")
    @PreAuthorize("hasAuthority('STUDENT_WRITE')")
    fun recordContentProgress(
        @CurrentUser user: User,
        @PathVariable courseId: Long,
        @PathVariable contentId: Long,
        @RequestBody request: ContentProgressRequest,
    ): ResponseEntity<ApiResponse<StudentCourseProgressDto>> = ResponseEntity.ok(ApiResponse.success(
        "Kontent progressi saqlandi",
        studyPlanService.recordContentProgress(courseId, contentId, request.progress, requireNotNull(user.id)),
    ))

    // ─── Schedule ────────────────────────────────────────────────────────────

    @GetMapping("/schedule")
    fun getSchedule(
        @CurrentUser user: User,
        @RequestParam(required = false) startDate: String?,
        @RequestParam(required = false) endDate: String?,
        @RequestParam(required = false) courseId: String?,
        @RequestParam(required = false) dayOfWeek: Int?,
    ): ResponseEntity<ApiResponse<List<StudentLearningSessionDto>>> {
        val defaultMonday = LocalDate.now().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY))
        val parsedStart = startDate?.let(LocalDate::parse) ?: if (endDate == null) defaultMonday else null
        val parsedEnd = endDate?.let(LocalDate::parse) ?: if (startDate == null) defaultMonday.plusDays(6) else null
        return ResponseEntity.ok(ApiResponse.success(
            svc.getSchedule(user, parsedStart, parsedEnd, courseId?.toLongOrNull(), dayOfWeek),
        ))
    }

    @GetMapping("/schedule/today")
    fun getTodaySchedule(@CurrentUser user: User): ResponseEntity<ApiResponse<List<StudentLearningSessionDto>>> {
        val today = LocalDate.now()
        return ResponseEntity.ok(ApiResponse.success(svc.getSchedule(user, today, today)))
    }

    @GetMapping("/schedule/week")
    fun getWeekSchedule(@CurrentUser user: User): ResponseEntity<ApiResponse<List<StudentLearningSessionDto>>> {
        val monday = LocalDate.now().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY))
        return ResponseEntity.ok(ApiResponse.success(svc.getSchedule(user, monday, monday.plusDays(6))))
    }

    @GetMapping("/schedule/upcoming")
    fun getUpcomingSchedule(@CurrentUser user: User): ResponseEntity<ApiResponse<List<StudentLearningSessionDto>>> {
        val today = LocalDate.now()
        val now = java.time.Instant.now()
        return ResponseEntity.ok(ApiResponse.success(
            svc.getSchedule(user, today, today.plusDays(30)).filter { it.endsAt.isAfter(now) },
        ))
    }

    @GetMapping("/schedule/next")
    fun getNextClass(@CurrentUser user: User): ResponseEntity<ApiResponse<StudentLearningSessionDto?>> {
        val today = LocalDate.now()
        val now = java.time.Instant.now()
        return ResponseEntity.ok(ApiResponse.success(
            svc.getSchedule(user, today, today.plusDays(30)).firstOrNull { it.endsAt.isAfter(now) },
        ))
    }

    @GetMapping("/schedule/week/{weekNumber}")
    fun getScheduleByWeek(
        @CurrentUser user: User,
        @PathVariable weekNumber: Int,
    ): ResponseEntity<ApiResponse<Map<String, Any>>> {
        require(weekNumber in 1..53) { "Hafta raqami 1 dan 53 gacha bo'lishi kerak" }
        val weekFields = WeekFields.ISO
        val monday = LocalDate.now()
            .with(weekFields.weekOfWeekBasedYear(), weekNumber.toLong())
            .with(weekFields.dayOfWeek(), 1)
        val items = svc.getSchedule(user, monday, monday.plusDays(6))
        val result = mapOf(
            "weekNumber" to weekNumber,
            "startDate" to monday.toString(),
            "endDate" to monday.plusDays(6).toString(),
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
        ResponseEntity.ok(ApiResponse.success(svc.getAttendance(
            user,
            courseId,
            startDate?.let(java.time.LocalDate::parse),
            endDate?.let(java.time.LocalDate::parse),
            status,
        )))

    @GetMapping("/attendance/stats")
    fun getAttendanceStats(@CurrentUser user: User): ResponseEntity<ApiResponse<StudentAttendanceStatsDto>> =
        ResponseEntity.ok(ApiResponse.success(svc.getAttendanceStats(user)))

    @GetMapping("/attendance/summary")
    fun getAttendanceSummary(@CurrentUser user: User): ResponseEntity<ApiResponse<StudentAttendanceSummaryDto>> =
        ResponseEntity.ok(ApiResponse.success(svc.getAttendanceSummary(user)))

    @GetMapping("/attendance/percentage")
    fun getAttendancePercentage(@CurrentUser user: User): ResponseEntity<ApiResponse<AttendancePercentageDto>> =
        ResponseEntity.ok(ApiResponse.success(svc.getAttendancePercentage(user)))

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
        ResponseEntity.ok(ApiResponse.success(svc.getAttendancePercentage(user, courseId)))

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
        ResponseEntity.ok(ApiResponse.success(svc.getAssignments(user, status, courseId?.toLongOrNull(), priority)))

    // ─── Tests ───────────────────────────────────────────────────────────────

    @GetMapping("/tests")
    fun getTests(
        @CurrentUser user: User,
        @RequestParam(required = false) status: String?,
        @RequestParam(required = false) courseId: String?,
    ): ResponseEntity<ApiResponse<List<StudentTestDto>>> =
        ResponseEntity.ok(ApiResponse.success(svc.getTests(user, status, courseId?.toLongOrNull())))

    @GetMapping("/tests/history")
    fun getTestHistory(@CurrentUser user: User) =
        ResponseEntity.ok(ApiResponse.success(svc.getTestHistory(user)))

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
