package uz.scorm.lms.app.v1.compliance.uat

import tools.jackson.databind.ObjectMapper
import org.springframework.core.io.ByteArrayResource
import org.springframework.http.ContentDisposition
import org.springframework.http.HttpHeaders
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.multipart.MultipartFile
import uz.scorm.lms.app.common.ApiResponse
import uz.scorm.lms.app.security.CurrentUser
import uz.scorm.lms.app.v1.user.model.User
import java.nio.charset.StandardCharsets
import java.nio.file.Files
import java.time.LocalDate
import java.security.MessageDigest

@RestController
@RequestMapping("/api/v1/compliance/559/uat")
@PreAuthorize("hasAuthority('UAT_READ')")
class Decision559UatController(
    private val service: Decision559UatService,
    private val bundleService: Decision559UatBundleService,
    private val requirementCatalog: Decision559UatRequirementCatalog,
    private val objectMapper: ObjectMapper,
) {

    @GetMapping("/requirements")
    fun requirements(): ResponseEntity<ApiResponse<List<Decision559UatRequirementGuidanceDto>>> =
        ResponseEntity.ok(ApiResponse.success(requirementCatalog.list()))

    @GetMapping("/requirements/manual-evidence-pack", produces = ["text/html"])
    fun manualEvidencePack(): ResponseEntity<ByteArrayResource> =
        download(requirementCatalog.manualEvidencePack())

    @GetMapping("/runs")
    fun list(): ResponseEntity<ApiResponse<List<Decision559UatRunDto>>> =
        ResponseEntity.ok(ApiResponse.success(service.list()))

    @GetMapping("/runs/{id}")
    fun detail(@PathVariable id: Long): ResponseEntity<ApiResponse<Decision559UatRunDetailDto>> =
        ResponseEntity.ok(ApiResponse.success(service.detail(id)))

    @GetMapping("/runs/{id}/manual-evidence-progress")
    fun manualEvidenceProgress(
        @PathVariable id: Long,
    ): ResponseEntity<ApiResponse<Decision559UatManualEvidenceProgressDto>> =
        ResponseEntity.ok(ApiResponse.success(service.manualEvidenceProgress(id)))

    @GetMapping("/runs/{id}/manual-evidence-progress.csv", produces = ["text/csv"])
    fun manualEvidenceProgressCsv(@PathVariable id: Long): ResponseEntity<ByteArrayResource> =
        download(service.manualEvidenceProgressCsv(id))

    @PostMapping("/runs/{id}/manual-evidence-progress/{requirementId}/{itemIndex}/coordination")
    @PreAuthorize("hasAuthority('UAT_WRITE')")
    fun updateManualTaskCoordination(
        @PathVariable id: Long,
        @PathVariable requirementId: String,
        @PathVariable itemIndex: Int,
        @RequestBody request: UpdateDecision559UatManualTaskCoordinationRequest,
        @CurrentUser user: User,
    ): ResponseEntity<ApiResponse<Decision559UatManualEvidenceProgressDto>> =
        ResponseEntity.ok(ApiResponse.success(service.updateManualTaskCoordination(
            id,
            requirementId,
            itemIndex,
            request,
            requireNotNull(user.id),
        )))

    @PostMapping("/runs/{id}/manual-evidence-progress/coordination/bulk")
    @PreAuthorize("hasAuthority('UAT_WRITE')")
    fun bulkCoordinateManualTasks(
        @PathVariable id: Long,
        @RequestBody request: BulkCoordinateDecision559UatManualTasksRequest,
        @CurrentUser user: User,
    ): ResponseEntity<ApiResponse<Decision559UatManualEvidenceProgressDto>> =
        ResponseEntity.ok(ApiResponse.success(service.bulkCoordinateManualTasks(
            id,
            request,
            requireNotNull(user.id),
        )))

    @GetMapping("/runs/{id}/manifest", produces = ["application/json"])
    fun manifest(@PathVariable id: Long): ResponseEntity<ByteArrayResource> {
        val bytes = objectMapper.writeValueAsBytes(service.manifest(id))
        val sha256 = MessageDigest.getInstance("SHA-256").digest(bytes)
            .joinToString("") { "%02x".format(it) }
        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_JSON)
            .contentLength(bytes.size.toLong())
            .header(
                HttpHeaders.CONTENT_DISPOSITION,
                ContentDisposition.attachment()
                    .filename("decision-559-uat-run-$id-manifest.json", StandardCharsets.UTF_8)
                    .build().toString(),
            )
            .header(HttpHeaders.CACHE_CONTROL, "private, no-store")
            .header("X-Content-SHA256", sha256)
            .body(ByteArrayResource(bytes))
    }

    @GetMapping("/runs/{id}/bundle", produces = ["application/zip"])
    fun bundle(
        @PathVariable id: Long,
        @CurrentUser user: User,
    ): ResponseEntity<StreamingResponseBody> {
        val bundle = bundleService.create(id, requireNotNull(user.id))
        val body = StreamingResponseBody { output ->
            try {
                Files.newInputStream(bundle.path).use { input -> input.copyTo(output) }
            } finally {
                Files.deleteIfExists(bundle.path)
            }
        }
        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType("application/zip"))
            .contentLength(bundle.sizeBytes)
            .header(
                HttpHeaders.CONTENT_DISPOSITION,
                ContentDisposition.attachment().filename(bundle.fileName, StandardCharsets.UTF_8).build().toString(),
            )
            .header(HttpHeaders.CACHE_CONTROL, "private, no-store")
            .header("X-Content-SHA256", bundle.sha256)
            .body(body)
    }

    @PostMapping("/runs")
    @PreAuthorize("hasAuthority('UAT_WRITE')")
    fun create(
        @RequestBody request: CreateDecision559UatRunRequest,
        @CurrentUser user: User,
    ): ResponseEntity<ApiResponse<Decision559UatRunDto>> =
        ResponseEntity.ok(ApiResponse.success(service.create(request, requireNotNull(user.id))))

    @PostMapping("/runs/{id}/evidence", consumes = ["multipart/form-data"])
    @PreAuthorize("hasAuthority('UAT_WRITE')")
    fun saveEvidence(
        @PathVariable id: Long,
        @RequestParam band: Int,
        @RequestParam requirementId: String,
        @RequestParam outcome: Decision559UatOutcome,
        @RequestParam ownerName: String,
        @RequestParam summary: String,
        @RequestParam(required = false) evidenceReference: String?,
        @RequestParam(required = false) manualEvidenceIndexes: List<Int>?,
        @RequestParam(required = false) file: MultipartFile?,
        @RequestParam(required = false) files: List<MultipartFile>?,
        @CurrentUser user: User,
    ): ResponseEntity<ApiResponse<Decision559UatEvidenceDto>> = ResponseEntity.ok(ApiResponse.success(
        service.saveEvidence(
            id, band, requirementId, outcome, ownerName, summary, evidenceReference, file, requireNotNull(user.id),
            files.orEmpty(), manualEvidenceIndexes.orEmpty(),
        ),
    ))

    @PostMapping("/evidence/{id}/review")
    @PreAuthorize("hasAuthority('UAT_APPROVE')")
    fun reviewEvidence(
        @PathVariable id: Long,
        @RequestBody request: ReviewDecision559UatEvidenceRequest,
        @CurrentUser user: User,
    ): ResponseEntity<ApiResponse<Decision559UatEvidenceDto>> =
        ResponseEntity.ok(ApiResponse.success(service.reviewEvidence(id, request, requireNotNull(user.id))))

    @PostMapping("/runs/{id}/protocol", consumes = ["multipart/form-data"])
    @PreAuthorize("hasAuthority('UAT_WRITE')")
    fun uploadProtocol(
        @PathVariable id: Long,
        @RequestParam protocolNumber: String,
        @RequestParam signedDate: LocalDate,
        @RequestParam signatories: String,
        @RequestParam evidenceSetSha256: String,
        @RequestParam file: MultipartFile,
        @CurrentUser user: User,
    ): ResponseEntity<ApiResponse<Decision559UatRunDto>> = ResponseEntity.ok(ApiResponse.success(
        service.uploadProtocol(
            id, protocolNumber, signedDate, signatories, evidenceSetSha256, file, requireNotNull(user.id),
        ),
    ))

    @PostMapping("/runs/{id}/submit")
    @PreAuthorize("hasAuthority('UAT_WRITE')")
    fun submit(
        @PathVariable id: Long,
        @CurrentUser user: User,
    ): ResponseEntity<ApiResponse<Decision559UatRunDto>> =
        ResponseEntity.ok(ApiResponse.success(service.submit(id, requireNotNull(user.id))))

    @PostMapping("/runs/{id}/approve")
    @PreAuthorize("hasAuthority('UAT_APPROVE')")
    fun approve(
        @PathVariable id: Long,
        @CurrentUser user: User,
    ): ResponseEntity<ApiResponse<Decision559UatRunDto>> =
        ResponseEntity.ok(ApiResponse.success(service.approve(id, requireNotNull(user.id))))

    @PostMapping("/runs/{id}/reject")
    @PreAuthorize("hasAuthority('UAT_APPROVE')")
    fun reject(
        @PathVariable id: Long,
        @RequestBody request: RejectDecision559UatRunRequest,
        @CurrentUser user: User,
    ): ResponseEntity<ApiResponse<Decision559UatRunDto>> =
        ResponseEntity.ok(ApiResponse.success(service.reject(id, request, requireNotNull(user.id))))

    @GetMapping("/evidence/{id}/file")
    fun evidenceFile(@PathVariable id: Long): ResponseEntity<ByteArrayResource> =
        download(service.evidenceFile(id))

    @GetMapping("/evidence/files/{id}")
    fun evidenceAttachmentFile(@PathVariable id: Long): ResponseEntity<ByteArrayResource> =
        download(service.evidenceAttachmentFile(id))

    @DeleteMapping("/evidence/files/{id}")
    @PreAuthorize("hasAuthority('UAT_WRITE')")
    fun deleteEvidenceAttachment(
        @PathVariable id: Long,
        @CurrentUser user: User,
    ): ResponseEntity<ApiResponse<Decision559UatEvidenceDto>> =
        ResponseEntity.ok(ApiResponse.success(service.deleteEvidenceAttachment(id, requireNotNull(user.id))))

    @GetMapping("/runs/{id}/protocol/file")
    fun protocolFile(@PathVariable id: Long): ResponseEntity<ByteArrayResource> =
        download(service.protocolFile(id))

    @GetMapping("/runs/{id}/protocol/draft", produces = ["text/html"])
    fun protocolDraft(@PathVariable id: Long): ResponseEntity<ByteArrayResource> =
        download(service.protocolDraft(id))

    private fun download(file: PrivateEvidenceFile): ResponseEntity<ByteArrayResource> =
        ResponseEntity.ok()
            .contentType(MediaType.parseMediaType(file.contentType))
            .contentLength(file.bytes.size.toLong())
            .header(
                HttpHeaders.CONTENT_DISPOSITION,
                ContentDisposition.attachment()
                    .filename(file.originalName, StandardCharsets.UTF_8)
                    .build().toString(),
            )
            .header(HttpHeaders.CACHE_CONTROL, "private, no-store")
            .header("X-Content-SHA256", file.sha256)
            .body(ByteArrayResource(file.bytes))
}
