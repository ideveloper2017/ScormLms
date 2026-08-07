package uz.scorm.lms.app.v1.dashboard

import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import uz.scorm.lms.app.security.CurrentUser
import uz.scorm.lms.app.v1.user.model.User

@RestController
@RequestMapping("/api/v1/admin")
@PreAuthorize("hasAuthority('STAT_READ')")
class AdminDashboardController(private val dashboardService: DashboardService) {
    @GetMapping("/stats")
    fun stats(): AdminSystemStatsDto = dashboardService.adminStats()

    @GetMapping("/activities/recent")
    fun recentActivities(): List<AdminActivityDto> = dashboardService.recentActivities()

    @GetMapping("/stats/monthly")
    fun monthlyMetrics(): List<AdminMonthlyMetricDto> = dashboardService.monthlyMetrics()

    @GetMapping("/instructors/top")
    fun topInstructors(): List<AdminTopInstructorDto> = dashboardService.topInstructors()
}

@RestController
@RequestMapping("/api/v1/instructors/me")
@PreAuthorize("hasAuthority('COURSE_READ')")
class InstructorDashboardController(private val dashboardService: DashboardService) {
    @GetMapping("/stats")
    fun stats(@CurrentUser user: User): InstructorStatsDto = dashboardService.instructorStats(user)

    @GetMapping("/courses")
    fun courses(@CurrentUser user: User): List<InstructorCourseDto> = dashboardService.instructorCourses(user)

    @GetMapping("/submissions/recent")
    fun recentSubmissions(@CurrentUser user: User): List<InstructorSubmissionDto> =
        dashboardService.recentInstructorSubmissions(user)

    @GetMapping("/schedule/today")
    fun todayLessons(@CurrentUser user: User): List<InstructorLessonDto> =
        dashboardService.todayInstructorLessons(user)

    @GetMapping("/activity/weekly")
    fun weeklyActivity(@CurrentUser user: User): List<InstructorWeeklyActivityDto> =
        dashboardService.instructorWeeklyActivity(user)
}

@RestController
@RequestMapping("/api/v1/teachers/me")
@PreAuthorize("hasAuthority('COURSE_READ')")
class TeacherPortalDashboardController(private val dashboardService: DashboardService) {
    @GetMapping
    fun profile(@CurrentUser user: User): TeacherProfileDto = dashboardService.teacherProfile(user)

    @GetMapping("/stats")
    fun stats(@CurrentUser user: User): TeacherDashboardStatsDto = dashboardService.teacherDashboardStats(user)

    @GetMapping("/students")
    fun students(
        @CurrentUser user: User,
        @RequestParam(required = false) courseId: Long?,
    ): List<TeacherStudentDto> = dashboardService.teacherStudents(user, courseId)

    @GetMapping("/courses/{courseId}/gradebook")
    fun gradebook(
        @CurrentUser user: User,
        @PathVariable courseId: Long,
    ): List<TeacherGradebookEntryDto> = dashboardService.teacherGradebook(user, courseId)

    @GetMapping("/schedule/today")
    fun todaySchedule(@CurrentUser user: User): List<TeacherTodayScheduleDto> =
        dashboardService.teacherTodaySchedule(user)
}

@RestController
@RequestMapping("/api/v1/monitoring")
@PreAuthorize("hasAuthority('STAT_READ')")
class MonitoringDashboardController(private val dashboardService: DashboardService) {
    @GetMapping("/stats")
    fun stats(): MonitoringStatsDto = dashboardService.monitoringStats()

    @GetMapping("/alerts")
    fun alerts(): List<MonitoringAlertDto> = dashboardService.monitoringAlerts()
}
