package uz.scorm.lms.app.v1.courses.controller

import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
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
import uz.scorm.lms.app.v1.courses.dto.CourseContentAssetDto
import uz.scorm.lms.app.v1.courses.dto.SubjectMaterialDto
import uz.scorm.lms.app.v1.courses.service.SyllabusLessonMaterialRequest
import uz.scorm.lms.app.v1.courses.service.SyllabusLessonMaterialService
import uz.scorm.lms.app.v1.courses.service.SyllabusLessonMaterialsDto
import uz.scorm.lms.app.v1.courses.service.SyllabusLessonQuizDto
import uz.scorm.lms.app.v1.courses.service.SyllabusLessonQuizRequest
import uz.scorm.lms.app.v1.courses.service.SyllabusLessonQuizService
import uz.scorm.lms.app.v1.courses.service.SyllabusLessonQuizzesDto
import uz.scorm.lms.app.v1.user.model.User

/** O'quv dasturi darsining kontenti (Everest: dars -> resurslar); bog'langan qoralama kurslar avtomatik moslanadi. */
@RestController
@RequestMapping("/api/v1/syllabus-courses/{syllabusId}")
class SyllabusLessonMaterialController(
    private val service: SyllabusLessonMaterialService,
    private val quizzes: SyllabusLessonQuizService,
) {
    @GetMapping("/lessons/{topicId}/materials")
    @PreAuthorize("hasAuthority('ACADEMIC_READ')")
    fun list(@PathVariable syllabusId: Long, @PathVariable topicId: Long): ApiResponse<List<SubjectMaterialDto>> =
        ApiResponse.success(service.list(syllabusId, topicId))

    @PostMapping("/assets", consumes = [MediaType.MULTIPART_FORM_DATA_VALUE])
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun upload(
        @PathVariable syllabusId: Long,
        @RequestParam("file") file: MultipartFile,
        @CurrentUser user: User,
    ): ResponseEntity<ApiResponse<CourseContentAssetDto>> =
        ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(service.upload(syllabusId, file, requireNotNull(user.id))))

    @PostMapping("/lessons/{topicId}/materials")
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun create(
        @PathVariable syllabusId: Long,
        @PathVariable topicId: Long,
        @RequestBody request: SyllabusLessonMaterialRequest,
        @CurrentUser user: User,
    ): ResponseEntity<ApiResponse<SyllabusLessonMaterialsDto>> = ResponseEntity.status(HttpStatus.CREATED)
        .body(ApiResponse.success(service.create(syllabusId, topicId, request, requireNotNull(user.id))))

    @PutMapping("/lessons/{topicId}/materials/{materialId}")
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun update(
        @PathVariable syllabusId: Long,
        @PathVariable topicId: Long,
        @PathVariable materialId: Long,
        @RequestBody request: SyllabusLessonMaterialRequest,
    ): ApiResponse<SyllabusLessonMaterialsDto> = ApiResponse.success(service.update(syllabusId, topicId, materialId, request))

    @PutMapping("/lessons/{topicId}/materials/order")
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun reorder(
        @PathVariable syllabusId: Long,
        @PathVariable topicId: Long,
        @RequestBody materialIds: List<Long>,
    ): ApiResponse<SyllabusLessonMaterialsDto> = ApiResponse.success(service.reorder(syllabusId, topicId, materialIds))

    @DeleteMapping("/lessons/{topicId}/materials/{materialId}")
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun delete(
        @PathVariable syllabusId: Long,
        @PathVariable topicId: Long,
        @PathVariable materialId: Long,
    ): ApiResponse<SyllabusLessonMaterialsDto> = ApiResponse.success(service.delete(syllabusId, topicId, materialId))

    /** Dars resurslari: Test va Savol/Javob (kursga test sifatida tushadi) */
    @GetMapping("/lessons/{topicId}/quizzes")
    @PreAuthorize("hasAuthority('ACADEMIC_READ')")
    fun quizzes(@PathVariable syllabusId: Long, @PathVariable topicId: Long): ApiResponse<List<SyllabusLessonQuizDto>> =
        ApiResponse.success(quizzes.list(syllabusId, topicId))

    @PostMapping("/lessons/{topicId}/quizzes")
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun createQuiz(
        @PathVariable syllabusId: Long,
        @PathVariable topicId: Long,
        @RequestBody request: SyllabusLessonQuizRequest,
    ): ResponseEntity<ApiResponse<SyllabusLessonQuizzesDto>> =
        ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(quizzes.create(syllabusId, topicId, request)))

    @PutMapping("/lessons/{topicId}/quizzes/{quizId}")
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun updateQuiz(
        @PathVariable syllabusId: Long,
        @PathVariable topicId: Long,
        @PathVariable quizId: Long,
        @RequestBody request: SyllabusLessonQuizRequest,
    ): ApiResponse<SyllabusLessonQuizzesDto> = ApiResponse.success(quizzes.update(syllabusId, topicId, quizId, request))

    @DeleteMapping("/lessons/{topicId}/quizzes/{quizId}")
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun deleteQuiz(
        @PathVariable syllabusId: Long,
        @PathVariable topicId: Long,
        @PathVariable quizId: Long,
    ): ApiResponse<SyllabusLessonQuizzesDto> = ApiResponse.success(quizzes.delete(syllabusId, topicId, quizId))
}
