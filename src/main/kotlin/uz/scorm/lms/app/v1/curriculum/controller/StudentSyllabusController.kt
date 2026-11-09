package uz.scorm.lms.app.v1.curriculum.controller

import org.springframework.core.io.InputStreamResource
import org.springframework.http.CacheControl
import org.springframework.http.ContentDisposition
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import uz.scorm.lms.app.common.ApiResponse
import uz.scorm.lms.app.security.CurrentUser
import uz.scorm.lms.app.v1.courses.service.LegacyWordPreview
import uz.scorm.lms.app.v1.courses.service.PresentationPreview
import uz.scorm.lms.app.v1.curriculum.service.StudentSyllabusLessonsDto
import uz.scorm.lms.app.v1.curriculum.service.StudentSyllabusService
import uz.scorm.lms.app.v1.user.model.User
import java.nio.charset.StandardCharsets

/** Talaba fanni kurssiz, o'z o'quv rejasidagi tasdiqlangan o'quv dasturidan o'qiydi */
@RestController
@RequestMapping("/api/v1/students/me/syllabi")
@PreAuthorize("hasAuthority('STUDENT_READ')")
class StudentSyllabusController(
    private val service: StudentSyllabusService,
    private val presentation: PresentationPreview,
    private val legacyWord: LegacyWordPreview,
) {
    /** Tasdiqlangan dastur muqova rasmi (cover) yoki tanishtiruv videosi (video) */
    @GetMapping("/{syllabusId}/media/{kind}")
    fun media(@PathVariable syllabusId: Long, @PathVariable kind: String, @CurrentUser user: User) =
        uz.scorm.lms.app.v1.syllabus.controller.syllabusMediaResponse(
            service.media(requireNotNull(user.id), syllabusId, uz.scorm.lms.app.v1.syllabus.service.SyllabusMediaKind.of(kind)))

    @GetMapping("/{syllabusId}/lessons")
    fun lessons(@PathVariable syllabusId: Long, @CurrentUser user: User): ApiResponse<StudentSyllabusLessonsDto> =
        ApiResponse.success(service.lessons(requireNotNull(user.id), syllabusId))

    /** Material bajarildi — qaytadi: bajarilgan materiallar id'lari */
    @PostMapping("/{syllabusId}/materials/{materialId}/complete")
    fun complete(@PathVariable syllabusId: Long, @PathVariable materialId: Long, @CurrentUser user: User): ApiResponse<List<Long>> =
        ApiResponse.success(service.complete(requireNotNull(user.id), syllabusId, materialId))

    @GetMapping("/{syllabusId}/materials/{materialId}/file")
    fun file(@PathVariable syllabusId: Long, @PathVariable materialId: Long, @CurrentUser user: User): ResponseEntity<InputStreamResource> {
        val download = service.file(requireNotNull(user.id), syllabusId, materialId)
        return ResponseEntity.ok()
            .cacheControl(CacheControl.noStore())
            .header("Content-Disposition", ContentDisposition.attachment().filename(download.fileName, StandardCharsets.UTF_8).build().toString())
            .header("X-Content-Type-Options", "nosniff")
            .contentType(MediaType.parseMediaType(download.mediaType))
            .contentLength(download.sizeBytes)
            .body(download.resource)
    }

    @GetMapping("/{syllabusId}/materials/{materialId}/presentation")
    fun presentation(@PathVariable syllabusId: Long, @PathVariable materialId: Long, @CurrentUser user: User): ResponseEntity<ByteArray> {
        val bytes = presentation.render(service.file(requireNotNull(user.id), syllabusId, materialId))
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).contentType(MediaType.APPLICATION_PDF)
            .contentLength(bytes.size.toLong()).header("X-Content-Type-Options", "nosniff").body(bytes)
    }

    @GetMapping("/{syllabusId}/materials/{materialId}/legacy-word")
    fun legacyWord(@PathVariable syllabusId: Long, @PathVariable materialId: Long, @CurrentUser user: User): ResponseEntity<ApiResponse<String>> =
        ResponseEntity.ok().cacheControl(CacheControl.noStore())
            .body(ApiResponse.success(legacyWord.extract(service.file(requireNotNull(user.id), syllabusId, materialId))))
}
