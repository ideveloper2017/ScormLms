package uz.scorm.lms.app.v1.courses.controller

import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.*
import uz.scorm.lms.app.security.CurrentUser
import uz.scorm.lms.app.v1.user.model.User
import uz.scorm.lms.app.v1.courses.service.CourseResourceService

@RestController
@RequestMapping("/api/v1/resources")
@PreAuthorize("hasAuthority('COURSE_READ')")
class CourseResourceController(private val resources: CourseResourceService) {
    @GetMapping
    fun list(@CurrentUser user: User, authentication: Authentication, @RequestParam(required = false) courseId: Long?) = resources.list(
        requireNotNull(user.id), authentication.authorities.any { it.authority in setOf("USER_MANAGE", "ACADEMIC_WRITE") },
        user.role?.name.equals("student", true), courseId)
}
