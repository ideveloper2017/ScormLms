package uz.scorm.lms.app.v1.courses.controller

import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import uz.scorm.lms.app.common.ApiResponse
import uz.scorm.lms.app.security.CurrentUser
import uz.scorm.lms.app.v1.courses.dto.CourseUnitDto
import uz.scorm.lms.app.v1.courses.dto.CourseUnitRequest
import uz.scorm.lms.app.v1.courses.dto.LearningItemStatusRequest
import uz.scorm.lms.app.v1.courses.service.CourseUnitService
import uz.scorm.lms.app.v1.user.model.User

/** Kurs modullari (modul -> dars -> material), o'quv dasturi modullari kabi. */
@RestController
@RequestMapping("/api/v1/courses/{courseId}/units")
class CourseUnitController(private val unitService: CourseUnitService) {
    @GetMapping
    @PreAuthorize("hasAuthority('COURSE_READ')")
    fun list(@PathVariable courseId: Long, @CurrentUser user: User, authentication: Authentication): ApiResponse<List<CourseUnitDto>> =
        ApiResponse.success(unitService.list(courseId, requireNotNull(user.id), mayManageAll(authentication)))

    @PostMapping
    @PreAuthorize("hasAuthority('COURSE_WRITE')")
    fun create(
        @PathVariable courseId: Long,
        @RequestBody request: CourseUnitRequest,
        @CurrentUser user: User,
        authentication: Authentication,
    ): ResponseEntity<ApiResponse<CourseUnitDto>> = ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(
        unitService.create(courseId, request, requireNotNull(user.id), mayManageAll(authentication))
    ))

    @PutMapping("/{unitId}")
    @PreAuthorize("hasAuthority('COURSE_WRITE')")
    fun update(
        @PathVariable courseId: Long,
        @PathVariable unitId: Long,
        @RequestBody request: CourseUnitRequest,
        @CurrentUser user: User,
        authentication: Authentication,
    ): ApiResponse<CourseUnitDto> =
        ApiResponse.success(unitService.update(courseId, unitId, request, requireNotNull(user.id), mayManageAll(authentication)))

    @PatchMapping("/{unitId}/status")
    @PreAuthorize("hasAuthority('COURSE_WRITE')")
    fun changeStatus(
        @PathVariable courseId: Long,
        @PathVariable unitId: Long,
        @RequestBody request: LearningItemStatusRequest,
        @CurrentUser user: User,
        authentication: Authentication,
    ): ApiResponse<CourseUnitDto> =
        ApiResponse.success(unitService.changeStatus(courseId, unitId, request.status, requireNotNull(user.id), mayManageAll(authentication)))

    @DeleteMapping("/{unitId}")
    @PreAuthorize("hasAuthority('COURSE_WRITE')")
    fun delete(@PathVariable courseId: Long, @PathVariable unitId: Long, @CurrentUser user: User, authentication: Authentication): ResponseEntity<Void> {
        unitService.delete(courseId, unitId, requireNotNull(user.id), mayManageAll(authentication))
        return ResponseEntity.noContent().build()
    }

    private fun mayManageAll(authentication: Authentication): Boolean = authentication.authorities.any {
        it.authority == "USER_MANAGE" || it.authority == "ACADEMIC_WRITE"
    }
}
