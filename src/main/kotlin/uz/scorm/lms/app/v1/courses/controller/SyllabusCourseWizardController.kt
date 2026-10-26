package uz.scorm.lms.app.v1.courses.controller

import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import uz.scorm.lms.app.common.ApiResponse
import uz.scorm.lms.app.security.CurrentUser
import uz.scorm.lms.app.v1.courses.service.SyllabusCourseWizardService
import uz.scorm.lms.app.v1.courses.service.SyllabusWithCourseDto
import uz.scorm.lms.app.v1.courses.service.SyllabusWithCourseRequest
import uz.scorm.lms.app.v1.user.model.User

/** "Fan dasturi va kurs": dastur, mavzular va kursni bitta so'rovda yaratish. */
@RestController
@RequestMapping("/api/v1/syllabus-courses")
class SyllabusCourseWizardController(private val service: SyllabusCourseWizardService) {
    @PostMapping
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE') and hasAuthority('COURSE_WRITE')")
    fun create(
        @RequestBody request: SyllabusWithCourseRequest,
        @CurrentUser user: User,
    ): ResponseEntity<ApiResponse<SyllabusWithCourseDto>> =
        ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(service.create(request, requireNotNull(user.id))))
}
