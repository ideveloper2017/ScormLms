package uz.scorm.lms.app.v1.academicresult.controller

import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import uz.scorm.lms.app.security.CurrentUser
import uz.scorm.lms.app.v1.academicresult.dto.SaveRatingSystemRequest
import uz.scorm.lms.app.v1.academicresult.service.AcademicAnalyticsService
import uz.scorm.lms.app.v1.academicresult.service.RatingSystemService
import uz.scorm.lms.app.v1.user.model.User

@RestController
@RequestMapping("/api/v1/academic-results")
class AcademicResultController(
    private val ratingSystems: RatingSystemService,
    private val analytics: AcademicAnalyticsService,
) {
    @GetMapping("/rating-systems")
    @PreAuthorize("hasAuthority('ACADEMIC_READ')")
    fun ratingSystems() = ratingSystems.list()

    @PostMapping("/rating-systems")
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun createRatingSystem(@RequestBody request: SaveRatingSystemRequest, @CurrentUser user: User) =
        ResponseEntity.status(HttpStatus.CREATED).body(ratingSystems.create(request, requireNotNull(user.id)))

    @PutMapping("/rating-systems/{id}")
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun updateRatingSystem(@PathVariable id: Long, @RequestBody request: SaveRatingSystemRequest, @CurrentUser user: User) =
        ratingSystems.update(id, request, requireNotNull(user.id))

    @DeleteMapping("/rating-systems/{id}")
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun deleteRatingSystem(@PathVariable id: Long, @CurrentUser user: User): ResponseEntity<Void> {
        ratingSystems.delete(id, requireNotNull(user.id))
        return ResponseEntity.noContent().build()
    }

    @GetMapping("/statements")
    @PreAuthorize("hasAuthority('REPORT_READ')")
    fun statements(@RequestParam(required = false) final: Boolean?) = analytics.statements(final)

    @GetMapping("/student-results")
    @PreAuthorize("hasAuthority('REPORT_READ')")
    fun studentResults() = analytics.studentResults()

    @GetMapping("/gpa")
    @PreAuthorize("hasAuthority('REPORT_READ')")
    fun gpa() = analytics.gpa()

    @GetMapping("/test-results")
    @PreAuthorize("hasAuthority('REPORT_READ')")
    fun testResults() = analytics.testResults()

    @GetMapping("/subject-reports")
    @PreAuthorize("hasAuthority('REPORT_READ')")
    fun subjectReports() = analytics.subjectReports()

    @GetMapping("/student-tasks")
    @PreAuthorize("hasAuthority('REPORT_READ')")
    fun studentTasks() = analytics.studentTasks()

    @GetMapping("/appropriation")
    @PreAuthorize("hasAuthority('STAT_READ')")
    fun appropriation() = analytics.appropriation()

    @GetMapping("/grade-distribution")
    @PreAuthorize("hasAuthority('STAT_READ')")
    fun gradeDistribution() = analytics.gradeDistribution()

    @GetMapping("/failed-summary")
    @PreAuthorize("hasAuthority('STAT_READ')")
    fun failedSummary() = analytics.failedSummary()

    @GetMapping("/dashboard")
    @PreAuthorize("hasAuthority('STAT_READ')")
    fun dashboard() = analytics.dashboard()
}
