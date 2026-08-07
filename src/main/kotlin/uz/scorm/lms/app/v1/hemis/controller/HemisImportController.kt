package uz.scorm.lms.app.v1.hemis.controller

import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import uz.scorm.lms.app.common.ApiResponse
import uz.scorm.lms.app.security.CurrentUser
import uz.scorm.lms.app.v1.hemis.dto.*
import uz.scorm.lms.app.v1.hemis.service.HemisService
import uz.scorm.lms.app.v1.hemis.sync.service.HemisSyncService
import uz.scorm.lms.app.v1.student.repository.StudentRepository
import uz.scorm.lms.app.v1.user.model.User

@RestController
@RequestMapping("/api/v1/hemis")
@PreAuthorize("hasAuthority('INTEGRATION_READ')")
class HemisImportController(
    private val hemisService: HemisService,
    private val studentRepository: StudentRepository,
    private val syncService: HemisSyncService,
) {
    @GetMapping("/groups")
    fun listGroups(): ResponseEntity<ApiResponse<List<HemisGroupItem>>> =
        ResponseEntity.ok(ApiResponse.success(hemisService.fetchGroupList()))

    @GetMapping("/students")
    fun previewStudents(
        @RequestParam groupId: Long,
        @RequestParam(defaultValue = "200") limit: Int,
        @RequestParam(defaultValue = "0") offset: Int,
    ): ResponseEntity<ApiResponse<List<HemisStudentPreviewDto>>> {
        val previews = hemisService.fetchStudentsByGroup(groupId, limit.coerceIn(1, 500), offset.coerceAtLeast(0)).items.map { source ->
            with(hemisService) { source.toPreviewDto(studentRepository.existsByStudentNumber(source.student_id_number)) }
        }
        return ResponseEntity.ok(ApiResponse.success(previews))
    }

    /** Legacy endpoint: direct writes are disabled; requests enter the audited group sync workflow. */
    @PostMapping("/import")
    @PreAuthorize("hasAuthority('INTEGRATION_WRITE')")
    fun importStudents(@RequestBody request: HemisImportRequest, @CurrentUser user: User): ResponseEntity<ApiResponse<HemisImportResult>> {
        require(request.studentNumbers.isNullOrEmpty()) {
            "Tanlangan yozuvlarni bevosita import qilish o'chirilgan; guruh sinxronlashidan foydalaning"
        }
        val run = syncService.startManual(requireNotNull(user.id), request.groupId)
        return ResponseEntity.accepted().body(ApiResponse.success(
            HemisImportResult(0, 0, 0, 0, listOf("HEMIS sync run #${run.id} ishga tushirildi")),
        ))
    }
}
