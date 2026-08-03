package uz.scorm.lms.app.v1.scorm.controller

import jakarta.servlet.http.HttpServletRequest
import org.springframework.beans.factory.annotation.Value
import org.springframework.core.io.InputStreamResource
import org.springframework.http.CacheControl
import org.springframework.http.HttpHeaders
import org.springframework.http.ResponseCookie
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.CookieValue
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.multipart.MultipartFile
import org.springframework.web.util.UriUtils
import uz.scorm.lms.app.common.ApiResponse
import uz.scorm.lms.app.security.CurrentUser
import uz.scorm.lms.app.v1.scorm.dto.ScormAttemptDto
import uz.scorm.lms.app.v1.scorm.dto.ScormLaunchDto
import uz.scorm.lms.app.v1.scorm.dto.ScormPackageDto
import uz.scorm.lms.app.v1.scorm.dto.ScormRuntimeUpdateRequest
import uz.scorm.lms.app.v1.scorm.service.ScormService
import uz.scorm.lms.app.v1.courses.service.CourseAccessService
import uz.scorm.lms.app.v1.user.model.User
import java.nio.charset.StandardCharsets
import java.time.Duration

@RestController
@RequestMapping("/api/v1/scorm")
class ScormController(
    private val scormService: ScormService,
    private val courseAccessService: CourseAccessService,
    @Value("\${app.scorm.secure-cookie:false}") private val secureCookie: Boolean,
) {
    @PostMapping("/courses/{courseId}/packages", consumes = ["multipart/form-data"])
    @PreAuthorize("hasAuthority('COURSE_WRITE')")
    fun importPackage(
        @PathVariable courseId: Long,
        @RequestParam("file") file: MultipartFile,
        @CurrentUser user: User,
        authentication: Authentication,
    ): ResponseEntity<ApiResponse<ScormPackageDto>> = ResponseEntity.ok(
        ApiResponse.success("SCORM paket import qilindi", scormService.importPackage(
            courseId = courseId,
            file = file,
            importerId = requireNotNull(user.id),
            importedBy = user.username,
            mayManageAllCourses = authentication.authorities.any { it.authority in setOf("USER_MANAGE", "ACADEMIC_WRITE") },
        ))
    )

    @GetMapping("/courses/{courseId}/packages")
    @PreAuthorize("hasAuthority('COURSE_READ')")
    fun packages(
        @PathVariable courseId: Long,
        @CurrentUser user: User,
        authentication: Authentication,
    ): ResponseEntity<ApiResponse<List<ScormPackageDto>>> {
        courseAccessService.requireRead(courseId, requireNotNull(user.id), mayManageAll(authentication))
        return ResponseEntity.ok(ApiResponse.success(scormService.listPackages(courseId)))
    }

    @PostMapping("/courses/{courseId}/launch")
    @PreAuthorize("hasAuthority('COURSE_READ')")
    fun launchLatest(
        @PathVariable courseId: Long,
        @CurrentUser user: User,
        authentication: Authentication,
    ): ResponseEntity<ApiResponse<ScormLaunchDto>> {
        val userId = requireNotNull(user.id)
        courseAccessService.requireRead(courseId, userId, mayManageAll(authentication))
        return launchResponse(scormService.launchLatest(courseId, userId))
    }

    @PostMapping("/packages/{packageId}/launch")
    @PreAuthorize("hasAuthority('COURSE_READ')")
    fun launchPackage(
        @PathVariable packageId: Long,
        @CurrentUser user: User,
        authentication: Authentication,
    ): ResponseEntity<ApiResponse<ScormLaunchDto>> {
        val userId = requireNotNull(user.id)
        courseAccessService.requireRead(
            scormService.courseIdForPackage(packageId), userId, mayManageAll(authentication)
        )
        return launchResponse(scormService.launch(packageId, userId))
    }

    @GetMapping("/attempts/{attemptId}")
    @PreAuthorize("hasAuthority('COURSE_READ')")
    fun attempt(
        @PathVariable attemptId: Long,
        @CurrentUser user: User,
    ): ResponseEntity<ApiResponse<ScormAttemptDto>> = ResponseEntity.ok(
        ApiResponse.success(scormService.getAttempt(attemptId, requireNotNull(user.id)))
    )

    @PutMapping("/attempts/{attemptId}/runtime")
    @PreAuthorize("hasAuthority('COURSE_READ')")
    fun updateRuntime(
        @PathVariable attemptId: Long,
        @RequestBody request: ScormRuntimeUpdateRequest,
        @CurrentUser user: User,
    ): ResponseEntity<ApiResponse<ScormAttemptDto>> {
        val userId = requireNotNull(user.id)
        val result = scormService.updateRuntime(attemptId, userId, request)
        return ResponseEntity.ok(ApiResponse.success(result))
    }

    private fun launchResponse(result: uz.scorm.lms.app.v1.scorm.dto.ScormLaunchResult): ResponseEntity<ApiResponse<ScormLaunchDto>> {
        val cookie = ResponseCookie.from("SCORM_LAUNCH", result.cookieToken)
            .httpOnly(true)
            .secure(secureCookie)
            .sameSite("Lax")
            .path(result.cookiePath)
            .maxAge(Duration.ofHours(2))
            .build()
        return ResponseEntity.ok()
            .header(HttpHeaders.SET_COOKIE, cookie.toString())
            .body(ApiResponse.success(result.dto))
    }

    private fun mayManageAll(authentication: Authentication): Boolean = authentication.authorities.any {
        it.authority == "USER_MANAGE" || it.authority == "ACADEMIC_WRITE"
    }
}

@RestController
@RequestMapping("/scorm-content")
class ScormContentController(
    private val scormService: ScormService,
    @Value("\${app.cors.allowed-origins}") allowedOriginsValue: String,
) {
    private val frameAncestors = allowedOriginsValue.split(',').map(String::trim).filter(String::isNotBlank)
        .joinToString(" ", prefix = "'self' ")
    @GetMapping("/{storageKey}/**")
    fun content(
        @PathVariable storageKey: String,
        @CookieValue(name = "SCORM_LAUNCH", required = false) launchToken: String?,
        request: HttpServletRequest,
    ): ResponseEntity<InputStreamResource> {
        val marker = "/scorm-content/$storageKey/"
        val encodedPath = request.requestURI.substringAfter(marker, "")
        val requestedPath = UriUtils.decode(encodedPath, StandardCharsets.UTF_8)
        val content = scormService.content(storageKey, requestedPath, launchToken)
        return ResponseEntity.ok()
            .cacheControl(CacheControl.noStore())
            .header("Content-Security-Policy", "frame-ancestors $frameAncestors")
            .contentType(content.mediaType)
            .contentLength(content.contentLength)
            .body(content.resource)
    }
}
