package uz.scorm.lms.app.v1.foreignteacher.controller

import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import uz.scorm.lms.app.security.CurrentUser
import uz.scorm.lms.app.v1.foreignteacher.dto.RejectForeignTeacherEngagementRequest
import uz.scorm.lms.app.v1.foreignteacher.dto.SaveForeignTeacherEngagementRequest
import uz.scorm.lms.app.v1.foreignteacher.dto.VerifyForeignTeacherEngagementRequest
import uz.scorm.lms.app.v1.foreignteacher.service.ForeignTeacherEngagementService
import uz.scorm.lms.app.v1.user.model.User

@RestController
@RequestMapping("/api/v1/foreign-teacher-engagements")
class ForeignTeacherEngagementController(private val service: ForeignTeacherEngagementService) {
    @GetMapping
    @PreAuthorize("hasAuthority('TEACHER_WRITE')")
    fun list() = service.list()

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('TEACHER_WRITE')")
    fun get(@PathVariable id: Long) = service.get(id)

    @GetMapping("/eligible-teachers")
    @PreAuthorize("hasAuthority('TEACHER_WRITE')")
    fun eligibleTeachers() = service.eligibleTeachers()

    @GetMapping("/eligible-courses")
    @PreAuthorize("hasAuthority('TEACHER_WRITE')")
    fun eligibleCourses() = service.eligibleCourses()

    @PostMapping
    @PreAuthorize("hasAuthority('TEACHER_WRITE')")
    fun create(@RequestBody request: SaveForeignTeacherEngagementRequest, @CurrentUser user: User) =
        ResponseEntity.status(HttpStatus.CREATED).body(service.create(request, requireNotNull(user.id)))

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('TEACHER_WRITE')")
    fun update(@PathVariable id: Long, @RequestBody request: SaveForeignTeacherEngagementRequest, @CurrentUser user: User) =
        service.update(id, request, requireNotNull(user.id))

    @PostMapping("/{id}/verify")
    @PreAuthorize("hasAuthority('TEACHER_WRITE')")
    fun verify(@PathVariable id: Long, @RequestBody request: VerifyForeignTeacherEngagementRequest, @CurrentUser user: User) =
        service.verify(id, request, requireNotNull(user.id))

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasAuthority('TEACHER_WRITE')")
    fun reject(@PathVariable id: Long, @RequestBody request: RejectForeignTeacherEngagementRequest, @CurrentUser user: User) =
        service.reject(id, request, requireNotNull(user.id))
}
