package uz.scorm.lms.app.v1.courses.controller

import org.springframework.http.CacheControl
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import uz.scorm.lms.app.security.CurrentUser
import uz.scorm.lms.app.v1.courses.service.CourseContentAssetService
import uz.scorm.lms.app.v1.courses.service.PresentationPreview
import uz.scorm.lms.app.v1.user.model.User

@RestController
@RequestMapping("/api/v1/courses")
class PresentationPreviewController(private val assets: CourseContentAssetService, private val preview: PresentationPreview) {
    @GetMapping("/{courseId}/contents/{contentId}/presentation")
    @PreAuthorize("hasAuthority('COURSE_READ')")
    fun show(@PathVariable courseId: Long, @PathVariable contentId: Long, @CurrentUser user: User, authentication: Authentication): ResponseEntity<ByteArray> {
        val mayManageAll = authentication.authorities.any { it.authority == "USER_MANAGE" || it.authority == "ACADEMIC_WRITE" }
        val download = assets.download(courseId, contentId, requireNotNull(user.id), mayManageAll)
        val bytes = preview.render(download)
        return ResponseEntity.ok().cacheControl(CacheControl.noStore())
            .contentType(MediaType.APPLICATION_PDF).contentLength(bytes.size.toLong())
            .header("X-Content-Type-Options", "nosniff")
            .body(bytes)
    }
}
