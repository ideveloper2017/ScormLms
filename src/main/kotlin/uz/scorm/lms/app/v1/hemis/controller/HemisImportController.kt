package uz.scorm.lms.app.v1.hemis.controller

import mu.KotlinLogging
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import uz.scorm.lms.app.common.ApiResponse
import uz.scorm.lms.app.v1.hemis.dto.*
import uz.scorm.lms.app.v1.hemis.service.HemisService
import uz.scorm.lms.app.v1.student.repository.StudentRepository
import uz.scorm.lms.app.v1.student.service.StudentService

private val logger = KotlinLogging.logger {}

@RestController
@RequestMapping("/api/v1/hemis")
@PreAuthorize("hasAnyAuthority('USER_MANAGE', 'SYSTEM_ADMIN')")
class HemisImportController(
    private val hemisService: HemisService,
    private val studentService: StudentService,
    private val studentRepository: StudentRepository,
) {
    /**
     * GET /api/v1/hemis/groups
     * HEMIS dagi barcha guruhlar ro'yxati (admin HEMIS kreditsiallari kerak)
     */
    @GetMapping("/groups")
    fun listGroups(): ResponseEntity<ApiResponse<List<HemisGroupItem>>> {
        val groups = hemisService.fetchGroupList()
        return ResponseEntity.ok(ApiResponse.success(groups))
    }

    /**
     * GET /api/v1/hemis/students?groupId={id}
     * Guruh bo'yicha talabalar ro'yxati — import oldidan ko'rish uchun
     */
    @GetMapping("/students")
    fun previewStudents(
        @RequestParam groupId: Long,
        @RequestParam(defaultValue = "200") limit: Int,
        @RequestParam(defaultValue = "0") offset: Int,
    ): ResponseEntity<ApiResponse<List<HemisStudentPreviewDto>>> {
        val data = hemisService.fetchStudentsByGroup(groupId, limit, offset)

        val previews = data.items.map { hs ->
            val exists = studentRepository.existsByStudentNumber(hs.student_id_number)
            with(hemisService) { hs.toPreviewDto(exists) }
        }

        return ResponseEntity.ok(ApiResponse.success(previews))
    }

    /**
     * POST /api/v1/hemis/import
     * Guruh talabalarini DB ga import qiladi.
     * studentNumbers null bo'lsa — hammasini import qiladi.
     */
    @PostMapping("/import")
    fun importStudents(
        @RequestBody req: HemisImportRequest,
    ): ResponseEntity<ApiResponse<HemisImportResult>> {
        val data = hemisService.fetchStudentsByGroup(req.groupId, limit = 500)

        val toImport = if (req.studentNumbers.isNullOrEmpty()) {
            data.items
        } else {
            data.items.filter { it.student_id_number in req.studentNumbers }
        }

        var created = 0; var updated = 0; var skipped = 0
        val errors  = mutableListOf<String>()

        toImport.forEach { hs ->
            try {
                if (studentRepository.existsByStudentNumber(hs.student_id_number)) {
                    // Mavjud — hozircha skip (keyinroq update mexanizmi qo'shiladi)
                    skipped++
                } else {
                    val createReq = with(hemisService) { hs.toCreateRequest() }
                    studentService.create(createReq)
                    created++
                    logger.info { "HEMIS import: yangi talaba yaratildi — ${hs.student_id_number}" }
                }
            } catch (e: Exception) {
                logger.warn { "HEMIS import xatosi (${hs.student_id_number}): ${e.message}" }
                errors.add("${hs.student_id_number}: ${e.message}")
            }
        }

        val result = HemisImportResult(
            total   = toImport.size,
            created = created,
            updated = updated,
            skipped = skipped,
            errors  = errors,
        )
        return ResponseEntity.ok(ApiResponse.success(result))
    }
}
