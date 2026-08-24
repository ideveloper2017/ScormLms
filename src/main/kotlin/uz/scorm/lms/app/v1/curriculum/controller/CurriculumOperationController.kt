package uz.scorm.lms.app.v1.curriculum.controller

import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import uz.scorm.lms.app.v1.curriculum.dto.AssignCurriculumStudentsRequest
import uz.scorm.lms.app.v1.curriculum.dto.CurriculumSemesterPeriodRequest
import uz.scorm.lms.app.v1.curriculum.service.CurriculumOperationService

@RestController
@RequestMapping("/api/v1/curricula/{curriculumId}")
class CurriculumOperationController(private val service: CurriculumOperationService) {
    @GetMapping("/semesters") @PreAuthorize("hasAuthority('ACADEMIC_READ')")
    fun periods(@PathVariable curriculumId: Long) = service.periods(curriculumId)
    @PutMapping("/semesters/{semester}") @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun savePeriod(@PathVariable curriculumId: Long, @PathVariable semester: Int, @RequestBody request: CurriculumSemesterPeriodRequest) =
        service.savePeriod(curriculumId, request.copy(semesterNumber = semester))
    @GetMapping("/student-assignments") @PreAuthorize("hasAuthority('ACADEMIC_READ')")
    fun assignments(@PathVariable curriculumId: Long) = service.assignments(curriculumId)
    @PostMapping("/student-assignments") @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun assign(@PathVariable curriculumId: Long, @RequestBody request: AssignCurriculumStudentsRequest) = service.assign(curriculumId, request)
    @DeleteMapping("/student-assignments/{assignmentId}") @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun remove(@PathVariable curriculumId: Long, @PathVariable assignmentId: Long): ResponseEntity<Void> {
        service.remove(curriculumId, assignmentId); return ResponseEntity.noContent().build()
    }
}
