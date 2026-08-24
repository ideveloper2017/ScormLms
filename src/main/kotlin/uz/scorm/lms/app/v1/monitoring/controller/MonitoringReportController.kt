package uz.scorm.lms.app.v1.monitoring.controller

import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import uz.scorm.lms.app.v1.monitoring.service.MonitoringReportService

@RestController
@RequestMapping("/api/v1/monitoring")
@PreAuthorize("hasAnyAuthority('REPORT_READ', 'AUDIT_READ')")
class MonitoringReportController(private val service: MonitoringReportService) {
    @GetMapping("/inactive-students")
    fun inactiveStudents(@RequestParam(defaultValue = "7") inactiveDays: Int) = service.inactiveStudents(inactiveDays)

    @GetMapping("/elective-exceptions")
    fun electiveExceptions() = service.electiveExceptions()

    @GetMapping("/learning-participation")
    fun learningParticipation() = service.learningParticipation()

    @GetMapping("/student-ips")
    @PreAuthorize("hasAuthority('AUDIT_READ')")
    fun studentIps() = service.studentIps()

    @GetMapping("/lesson-comments")
    fun lessonComments() = service.lessonComments()
}
