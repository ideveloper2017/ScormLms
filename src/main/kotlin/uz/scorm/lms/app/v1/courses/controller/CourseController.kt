package uz.scorm.lms.app.v1.courses.controller

import org.springframework.http.HttpStatus
import org.springframework.http.CacheControl
import org.springframework.http.ContentDisposition
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.core.io.InputStreamResource
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
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.multipart.MultipartFile
import uz.scorm.lms.app.common.ApiResponse
import uz.scorm.lms.app.security.CurrentUser
import uz.scorm.lms.app.v1.courses.dto.CourseCreateRequest
import uz.scorm.lms.app.v1.courses.dto.CourseDto
import uz.scorm.lms.app.v1.courses.dto.CourseEnrollmentDto
import uz.scorm.lms.app.v1.courses.dto.CourseEnrollmentRequest
import uz.scorm.lms.app.v1.courses.dto.CourseModuleDto
import uz.scorm.lms.app.v1.courses.dto.CourseModuleRequest
import uz.scorm.lms.app.v1.courses.dto.CourseContentDto
import uz.scorm.lms.app.v1.courses.dto.CourseContentAssetDto
import uz.scorm.lms.app.v1.courses.dto.CourseContentRequest
import uz.scorm.lms.app.v1.courses.dto.CourseContentRevisionDto
import uz.scorm.lms.app.v1.courses.dto.CourseContentReviewDto
import uz.scorm.lms.app.v1.courses.dto.LearningItemStatusRequest
import uz.scorm.lms.app.v1.courses.dto.CourseStatusRequest
import uz.scorm.lms.app.v1.courses.dto.CourseUpdateRequest
import uz.scorm.lms.app.v1.courses.service.CourseEnrollmentService
import uz.scorm.lms.app.v1.courses.service.CourseService
import uz.scorm.lms.app.v1.courses.service.CourseModuleService
import uz.scorm.lms.app.v1.courses.service.CourseContentService
import uz.scorm.lms.app.v1.courses.service.CourseContentAssetService
import uz.scorm.lms.app.v1.courses.service.CourseContentReviewService
import uz.scorm.lms.app.v1.user.model.User
import java.nio.charset.StandardCharsets

@RestController
@RequestMapping("/api/v1/courses")
class CourseController(
    private val courseService: CourseService,
    private val enrollmentService: CourseEnrollmentService,
    private val moduleService: CourseModuleService,
    private val contentService: CourseContentService,
    private val contentAssetService: CourseContentAssetService,
    private val contentReviewService: CourseContentReviewService,
) {
    @GetMapping("/owned")
    @PreAuthorize("hasAuthority('COURSE_WRITE')")
    fun owned(
        @CurrentUser user: User,
        authentication: Authentication,
    ): ResponseEntity<ApiResponse<List<CourseDto>>> = ResponseEntity.ok(
        ApiResponse.success(courseService.owned(requireNotNull(user.id), mayManageAll(authentication)))
    )

    @GetMapping("/{courseId}")
    @PreAuthorize("hasAuthority('COURSE_READ')")
    fun get(
        @PathVariable courseId: Long,
        @CurrentUser user: User,
        authentication: Authentication,
    ): ResponseEntity<ApiResponse<CourseDto>> = ResponseEntity.ok(
        ApiResponse.success(courseService.get(courseId, requireNotNull(user.id), mayManageAll(authentication)))
    )

    @PostMapping
    @PreAuthorize("hasAuthority('COURSE_WRITE')")
    fun create(
        @RequestBody request: CourseCreateRequest,
        @CurrentUser user: User,
    ): ResponseEntity<ApiResponse<CourseDto>> = ResponseEntity.status(HttpStatus.CREATED).body(
        ApiResponse.success(
            "Kurs qoralama sifatida yaratildi",
            courseService.create(
                request,
                requireNotNull(user.id),
                enforceTeachingScope = user.role?.name.equals("teacher", ignoreCase = true),
            ),
        )
    )

    @PutMapping("/{courseId}")
    @PreAuthorize("hasAuthority('COURSE_WRITE')")
    fun update(
        @PathVariable courseId: Long,
        @RequestBody request: CourseUpdateRequest,
        @CurrentUser user: User,
        authentication: Authentication,
    ): ResponseEntity<ApiResponse<CourseDto>> = ResponseEntity.ok(ApiResponse.success(
        courseService.update(courseId, request, requireNotNull(user.id), mayManageAll(authentication))
    ))

    @PatchMapping("/{courseId}/status")
    @PreAuthorize("hasAuthority('COURSE_WRITE')")
    fun changeStatus(
        @PathVariable courseId: Long,
        @RequestBody request: CourseStatusRequest,
        @CurrentUser user: User,
        authentication: Authentication,
    ): ResponseEntity<ApiResponse<CourseDto>> = ResponseEntity.ok(ApiResponse.success(
        courseService.changeStatus(courseId, request.status, requireNotNull(user.id), mayManageAll(authentication))
    ))

    @DeleteMapping("/{courseId}")
    @PreAuthorize("hasAuthority('COURSE_WRITE')")
    fun delete(
        @PathVariable courseId: Long,
        @CurrentUser user: User,
        authentication: Authentication,
    ): ResponseEntity<Void> {
        courseService.delete(courseId, requireNotNull(user.id), mayManageAll(authentication))
        return ResponseEntity.noContent().build()
    }

    @GetMapping("/{courseId}/enrollments")
    @PreAuthorize("hasAuthority('COURSE_WRITE')")
    fun enrollments(
        @PathVariable courseId: Long,
        @CurrentUser user: User,
        authentication: Authentication,
    ): ResponseEntity<ApiResponse<List<CourseEnrollmentDto>>> = ResponseEntity.ok(ApiResponse.success(
        enrollmentService.list(courseId, requireNotNull(user.id), mayManageAll(authentication))
    ))

    @PostMapping("/{courseId}/enrollments")
    @PreAuthorize("hasAuthority('COURSE_WRITE')")
    fun enroll(
        @PathVariable courseId: Long,
        @RequestBody request: CourseEnrollmentRequest,
        @CurrentUser user: User,
        authentication: Authentication,
    ): ResponseEntity<ApiResponse<List<CourseEnrollmentDto>>> = ResponseEntity.ok(ApiResponse.success(
        "Talabalar kursga biriktirildi",
        enrollmentService.enroll(courseId, request, requireNotNull(user.id), mayManageAll(authentication)),
    ))

    @DeleteMapping("/{courseId}/enrollments/{studentId}")
    @PreAuthorize("hasAuthority('COURSE_WRITE')")
    fun withdraw(
        @PathVariable courseId: Long,
        @PathVariable studentId: Long,
        @CurrentUser user: User,
        authentication: Authentication,
    ): ResponseEntity<Void> {
        enrollmentService.withdraw(courseId, studentId, requireNotNull(user.id), mayManageAll(authentication))
        return ResponseEntity.noContent().build()
    }

    @GetMapping("/{courseId}/modules")
    @PreAuthorize("hasAuthority('COURSE_READ')")
    fun modules(
        @PathVariable courseId: Long,
        @CurrentUser user: User,
        authentication: Authentication,
    ): ResponseEntity<ApiResponse<List<CourseModuleDto>>> = ResponseEntity.ok(ApiResponse.success(
        moduleService.list(courseId, requireNotNull(user.id), mayManageAll(authentication))
    ))

    @PostMapping("/{courseId}/modules")
    @PreAuthorize("hasAuthority('COURSE_WRITE')")
    fun createModule(
        @PathVariable courseId: Long,
        @RequestBody request: CourseModuleRequest,
        @CurrentUser user: User,
        authentication: Authentication,
    ): ResponseEntity<ApiResponse<CourseModuleDto>> = ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(
        moduleService.create(courseId, request, requireNotNull(user.id), mayManageAll(authentication))
    ))

    @PutMapping("/{courseId}/modules/{moduleId}")
    @PreAuthorize("hasAuthority('COURSE_WRITE')")
    fun updateModule(
        @PathVariable courseId: Long,
        @PathVariable moduleId: Long,
        @RequestBody request: CourseModuleRequest,
        @CurrentUser user: User,
        authentication: Authentication,
    ): ResponseEntity<ApiResponse<CourseModuleDto>> = ResponseEntity.ok(ApiResponse.success(
        moduleService.update(courseId, moduleId, request, requireNotNull(user.id), mayManageAll(authentication))
    ))

    @PatchMapping("/{courseId}/modules/{moduleId}/status")
    @PreAuthorize("hasAuthority('COURSE_WRITE')")
    fun changeModuleStatus(
        @PathVariable courseId: Long,
        @PathVariable moduleId: Long,
        @RequestBody request: LearningItemStatusRequest,
        @CurrentUser user: User,
        authentication: Authentication,
    ): ResponseEntity<ApiResponse<CourseModuleDto>> = ResponseEntity.ok(ApiResponse.success(
        moduleService.changeStatus(courseId, moduleId, request.status, requireNotNull(user.id), mayManageAll(authentication))
    ))

    @DeleteMapping("/{courseId}/modules/{moduleId}")
    @PreAuthorize("hasAuthority('COURSE_WRITE')")
    fun deleteModule(
        @PathVariable courseId: Long,
        @PathVariable moduleId: Long,
        @CurrentUser user: User,
        authentication: Authentication,
    ): ResponseEntity<Void> {
        moduleService.delete(courseId, moduleId, requireNotNull(user.id), mayManageAll(authentication))
        return ResponseEntity.noContent().build()
    }

    @GetMapping("/{courseId}/contents")
    @PreAuthorize("hasAuthority('COURSE_READ')")
    fun contents(
        @PathVariable courseId: Long,
        @CurrentUser user: User,
        authentication: Authentication,
    ): ResponseEntity<ApiResponse<List<CourseContentDto>>> = ResponseEntity.ok(ApiResponse.success(
        contentService.list(courseId, requireNotNull(user.id), mayManageAll(authentication))
    ))

    @PostMapping("/{courseId}/assets", consumes = [MediaType.MULTIPART_FORM_DATA_VALUE])
    @PreAuthorize("hasAuthority('COURSE_WRITE')")
    fun uploadContentAsset(
        @PathVariable courseId: Long,
        @RequestParam("file") file: MultipartFile,
        @CurrentUser user: User,
        authentication: Authentication,
    ): ResponseEntity<ApiResponse<CourseContentAssetDto>> = ResponseEntity.status(HttpStatus.CREATED).body(
        ApiResponse.success(
            "Fayl xavfsiz saqlandi",
            contentAssetService.upload(courseId, file, requireNotNull(user.id), mayManageAll(authentication)),
        )
    )

    @PostMapping("/{courseId}/modules/{moduleId}/contents")
    @PreAuthorize("hasAuthority('COURSE_WRITE')")
    fun createContent(
        @PathVariable courseId: Long,
        @PathVariable moduleId: Long,
        @RequestBody request: CourseContentRequest,
        @CurrentUser user: User,
        authentication: Authentication,
    ): ResponseEntity<ApiResponse<CourseContentDto>> = ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(
        contentService.create(courseId, moduleId, request, requireNotNull(user.id), mayManageAll(authentication))
    ))

    @PostMapping("/{courseId}/modules/{moduleId}/materials/{materialId}")
    @PreAuthorize("hasAuthority('COURSE_WRITE')")
    fun attachSubjectMaterial(
        @PathVariable courseId: Long,
        @PathVariable moduleId: Long,
        @PathVariable materialId: Long,
        @CurrentUser user: User,
        authentication: Authentication,
    ): ResponseEntity<ApiResponse<CourseContentDto>> = ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(
        "Fan materiali modulga biriktirildi",
        contentService.attachMaterial(courseId, moduleId, materialId, requireNotNull(user.id), mayManageAll(authentication)),
    ))

    @PutMapping("/{courseId}/contents/{contentId}")
    @PreAuthorize("hasAuthority('COURSE_WRITE')")
    fun updateContent(
        @PathVariable courseId: Long,
        @PathVariable contentId: Long,
        @RequestBody request: CourseContentRequest,
        @CurrentUser user: User,
        authentication: Authentication,
    ): ResponseEntity<ApiResponse<CourseContentDto>> = ResponseEntity.ok(ApiResponse.success(
        contentService.update(courseId, contentId, request, requireNotNull(user.id), mayManageAll(authentication))
    ))

    @GetMapping("/{courseId}/contents/{contentId}/file")
    @PreAuthorize("hasAuthority('COURSE_READ')")
    fun downloadContentFile(
        @PathVariable courseId: Long,
        @PathVariable contentId: Long,
        @CurrentUser user: User,
        authentication: Authentication,
    ): ResponseEntity<InputStreamResource> {
        val download = contentAssetService.download(courseId, contentId, requireNotNull(user.id), mayManageAll(authentication))
        val disposition = ContentDisposition.attachment()
            .filename(download.fileName, StandardCharsets.UTF_8)
            .build()
            .toString()
        return ResponseEntity.ok()
            .cacheControl(CacheControl.noStore())
            .header("Content-Disposition", disposition)
            .header("X-Content-Type-Options", "nosniff")
            .contentType(MediaType.parseMediaType(download.mediaType))
            .contentLength(download.sizeBytes)
            .body(download.resource)
    }

    @PatchMapping("/{courseId}/contents/{contentId}/status")
    @PreAuthorize("hasAuthority('COURSE_WRITE')")
    fun changeContentStatus(
        @PathVariable courseId: Long,
        @PathVariable contentId: Long,
        @RequestBody request: LearningItemStatusRequest,
        @CurrentUser user: User,
        authentication: Authentication,
    ): ResponseEntity<ApiResponse<CourseContentDto>> = ResponseEntity.ok(ApiResponse.success(
        contentService.changeStatus(courseId, contentId, request.status, requireNotNull(user.id), mayManageAll(authentication))
    ))

    @DeleteMapping("/{courseId}/contents/{contentId}")
    @PreAuthorize("hasAuthority('COURSE_WRITE')")
    fun deleteContent(
        @PathVariable courseId: Long,
        @PathVariable contentId: Long,
        @CurrentUser user: User,
        authentication: Authentication,
    ): ResponseEntity<Void> {
        contentService.delete(courseId, contentId, requireNotNull(user.id), mayManageAll(authentication))
        return ResponseEntity.noContent().build()
    }

    @GetMapping("/{courseId}/contents/{contentId}/revisions")
    @PreAuthorize("hasAuthority('COURSE_READ')")
    fun contentRevisions(
        @PathVariable courseId: Long,
        @PathVariable contentId: Long,
        @CurrentUser user: User,
        authentication: Authentication,
    ): ResponseEntity<ApiResponse<List<CourseContentRevisionDto>>> = ResponseEntity.ok(ApiResponse.success(
        contentService.revisions(courseId, contentId, requireNotNull(user.id), mayManageAll(authentication))
    ))

    @PostMapping("/{courseId}/contents/{contentId}/submit-review")
    @PreAuthorize("hasAuthority('COURSE_WRITE')")
    fun submitContentReview(
        @PathVariable courseId: Long,
        @PathVariable contentId: Long,
        @CurrentUser user: User,
        authentication: Authentication,
    ): ResponseEntity<ApiResponse<CourseContentReviewDto>> = ResponseEntity.ok(ApiResponse.success(
        "Kontent ekspertizaga yuborildi",
        contentReviewService.submit(courseId, contentId, requireNotNull(user.id), mayManageAll(authentication)),
    ))

    @GetMapping("/{courseId}/contents/{contentId}/reviews")
    @PreAuthorize("hasAuthority('COURSE_READ')")
    fun contentReviewHistory(
        @PathVariable courseId: Long,
        @PathVariable contentId: Long,
        @CurrentUser user: User,
        authentication: Authentication,
    ): ResponseEntity<ApiResponse<List<CourseContentReviewDto>>> = ResponseEntity.ok(ApiResponse.success(
        contentReviewService.history(courseId, contentId, requireNotNull(user.id), mayManageAll(authentication)),
    ))

    private fun mayManageAll(authentication: Authentication): Boolean = authentication.authorities.any {
        it.authority == "USER_MANAGE" || it.authority == "ACADEMIC_WRITE"
    }
}
