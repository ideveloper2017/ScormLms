package uz.scorm.lms.app.v1.courses.controller

import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.multipart.MultipartFile
import uz.scorm.lms.app.common.ApiResponse
import uz.scorm.lms.app.security.CurrentUser
import uz.scorm.lms.app.v1.courses.dto.CourseContentAssetDto
import uz.scorm.lms.app.v1.courses.dto.SubjectMaterialDto
import uz.scorm.lms.app.v1.courses.dto.SubjectMaterialRequest
import uz.scorm.lms.app.v1.courses.service.SubjectMaterialService
import uz.scorm.lms.app.v1.user.model.User

@RestController
@RequestMapping("/api/v1/subject-materials")
class SubjectMaterialController(private val service: SubjectMaterialService) {
    @GetMapping
    @PreAuthorize("hasAuthority('COURSE_WRITE')")
    fun list(@CurrentUser user: User, authentication: Authentication): ApiResponse<List<SubjectMaterialDto>> =
        ApiResponse.success(service.list(requireNotNull(user.id), mayManageAll(authentication)))

    @PostMapping
    @PreAuthorize("hasAuthority('COURSE_WRITE')")
    fun create(
        @RequestBody request: SubjectMaterialRequest,
        @CurrentUser user: User,
        authentication: Authentication,
    ): ResponseEntity<ApiResponse<SubjectMaterialDto>> = ResponseEntity.status(HttpStatus.CREATED).body(
        ApiResponse.success(service.create(request, requireNotNull(user.id), mayManageAll(authentication)))
    )

    @PostMapping("/{subjectId}/assets", consumes = [MediaType.MULTIPART_FORM_DATA_VALUE])
    @PreAuthorize("hasAuthority('COURSE_WRITE')")
    fun upload(
        @PathVariable subjectId: Long,
        @RequestParam("file") file: MultipartFile,
        @CurrentUser user: User,
        authentication: Authentication,
    ): ResponseEntity<ApiResponse<CourseContentAssetDto>> = ResponseEntity.status(HttpStatus.CREATED).body(
        ApiResponse.success(service.upload(subjectId, file, requireNotNull(user.id), mayManageAll(authentication)))
    )

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('COURSE_WRITE')")
    fun delete(@PathVariable id: Long, @CurrentUser user: User, authentication: Authentication): ResponseEntity<Void> {
        service.delete(id, requireNotNull(user.id), mayManageAll(authentication))
        return ResponseEntity.noContent().build()
    }

    private fun mayManageAll(authentication: Authentication) = authentication.authorities.any {
        it.authority == "USER_MANAGE" || it.authority == "ACADEMIC_WRITE"
    }
}
