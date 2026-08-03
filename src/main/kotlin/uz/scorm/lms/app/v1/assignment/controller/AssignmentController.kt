package uz.scorm.lms.app.v1.assignment.controller

import org.springframework.http.ContentDisposition
import org.springframework.http.HttpHeaders
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
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
import uz.scorm.lms.app.v1.assignment.dto.StudentAssignmentDetailsDto
import uz.scorm.lms.app.v1.assignment.dto.StudentSubmissionDto
import uz.scorm.lms.app.v1.assignment.service.AssignmentService
import uz.scorm.lms.app.v1.user.model.User

@RestController
@RequestMapping("/api/v1")
class AssignmentController(
    private val assignmentService: AssignmentService,
) {
    @GetMapping("/assignments/{assignmentId}")
    fun details(
        @PathVariable assignmentId: Long,
        @CurrentUser user: User,
        authentication: Authentication,
    ): ApiResponse<StudentAssignmentDetailsDto> = ApiResponse.success(
        assignmentService.details(assignmentId, requireNotNull(user.id), mayManageAll(authentication))
    )

    @PostMapping("/assignments/{assignmentId}/submit", consumes = [MediaType.MULTIPART_FORM_DATA_VALUE])
    fun submitMultipart(
        @PathVariable assignmentId: Long,
        @RequestParam(required = false) answer: String?,
        @RequestParam(required = false) file: MultipartFile?,
        @CurrentUser user: User,
    ): ApiResponse<StudentSubmissionDto> = ApiResponse.success(
        "Topshiriq qabul qilindi",
        assignmentService.submit(assignmentId, requireNotNull(user.id), answer, file),
    )

    @PostMapping("/assignments/{assignmentId}/submit", consumes = [MediaType.APPLICATION_JSON_VALUE])
    fun submitText(
        @PathVariable assignmentId: Long,
        @RequestBody payload: Map<String, String?>,
        @CurrentUser user: User,
    ): ApiResponse<StudentSubmissionDto> = ApiResponse.success(
        "Topshiriq qabul qilindi",
        assignmentService.submit(assignmentId, requireNotNull(user.id), payload["answer"], null),
    )

    @GetMapping("/assignments/{assignmentId}/submissions")
    fun history(
        @PathVariable assignmentId: Long,
        @CurrentUser user: User,
    ): ApiResponse<List<StudentSubmissionDto>> = ApiResponse.success(
        assignmentService.submissionHistory(assignmentId, requireNotNull(user.id))
    )

    @DeleteMapping("/submissions/{submissionId}")
    fun delete(
        @PathVariable submissionId: Long,
        @CurrentUser user: User,
    ): ApiResponse<Unit> {
        assignmentService.deleteSubmission(submissionId, requireNotNull(user.id))
        return ApiResponse.success("Topshiriq o'chirildi", Unit)
    }

    @GetMapping("/submissions/{submissionId}/file")
    fun file(
        @PathVariable submissionId: Long,
        @CurrentUser user: User,
        authentication: Authentication,
    ): ResponseEntity<ByteArray> {
        val file = assignmentService.file(submissionId, requireNotNull(user.id), mayManageAll(authentication))
        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType(file.contentType))
            .header(
                HttpHeaders.CONTENT_DISPOSITION,
                ContentDisposition.attachment().filename(file.fileName, Charsets.UTF_8).build().toString(),
            )
            .contentLength(file.bytes.size.toLong())
            .body(file.bytes)
    }

    private fun mayManageAll(authentication: Authentication): Boolean = authentication.authorities.any {
        it.authority == "USER_MANAGE" || it.authority == "ACADEMIC_WRITE"
    }
}
