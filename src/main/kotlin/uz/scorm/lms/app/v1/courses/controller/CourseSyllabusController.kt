package uz.scorm.lms.app.v1.courses.controller

import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import uz.scorm.lms.app.common.ApiResponse
import uz.scorm.lms.app.security.CurrentUser
import uz.scorm.lms.app.v1.courses.dto.CourseSyllabusStatusDto
import uz.scorm.lms.app.v1.courses.dto.CourseSyllabusSyncResult
import uz.scorm.lms.app.v1.courses.service.CourseSyllabusService
import uz.scorm.lms.app.v1.user.model.User

/** Kurs bo'limlarini o'quv dasturi mavzulari bilan moslash. */
@RestController
@RequestMapping("/api/v1/courses/{courseId}/syllabus")
class CourseSyllabusController(private val service: CourseSyllabusService) {
    @GetMapping
    @PreAuthorize("hasAuthority('COURSE_WRITE')")
    fun status(
        @PathVariable courseId: Long,
        @CurrentUser user: User,
        authentication: Authentication,
    ): ResponseEntity<ApiResponse<CourseSyllabusStatusDto>> =
        ResponseEntity.ok(ApiResponse.success(service.status(courseId, requireNotNull(user.id), mayManageAll(authentication))))

    @PostMapping("/sync")
    @PreAuthorize("hasAuthority('COURSE_WRITE')")
    fun sync(
        @PathVariable courseId: Long,
        @CurrentUser user: User,
        authentication: Authentication,
    ): ResponseEntity<ApiResponse<CourseSyllabusSyncResult>> =
        ResponseEntity.ok(ApiResponse.success(service.sync(courseId, requireNotNull(user.id), mayManageAll(authentication))))

    // CourseController bilan bir xil qoida
    private fun mayManageAll(authentication: Authentication): Boolean = authentication.authorities.any {
        it.authority == "USER_MANAGE" || it.authority == "ACADEMIC_WRITE"
    }
}
