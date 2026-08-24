package uz.scorm.lms.app.v1.rereading.controller

import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import uz.scorm.lms.app.security.CurrentUser
import uz.scorm.lms.app.v1.rereading.dto.*
import uz.scorm.lms.app.v1.rereading.service.ReReadingService
import uz.scorm.lms.app.v1.user.model.User

@RestController
@RequestMapping("/api/v1/re-reading")
@PreAuthorize("hasAuthority('ACADEMIC_READ')")
class ReReadingController(private val service: ReReadingService) {
    @GetMapping("/plans") fun plans() = service.plans()
    @PostMapping("/plans") @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun createPlan(@RequestBody request: SaveReReadingPlanRequest, @CurrentUser user: User) = ResponseEntity.status(HttpStatus.CREATED).body(service.createPlan(request, requireNotNull(user.id)))
    @PutMapping("/plans/{id}") @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun updatePlan(@PathVariable id: Long, @RequestBody request: SaveReReadingPlanRequest, @CurrentUser user: User) = service.updatePlan(id, request, requireNotNull(user.id))
    @DeleteMapping("/plans/{id}") @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun deletePlan(@PathVariable id: Long, @CurrentUser user: User): ResponseEntity<Void> { service.deletePlan(id, requireNotNull(user.id)); return ResponseEntity.noContent().build() }

    @GetMapping("/students") fun students() = service.studentOptions()
    @GetMapping("/applications") fun applications() = service.applications()
    @PostMapping("/applications") @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun createApplication(@RequestBody request: SaveReReadingApplicationRequest, @CurrentUser user: User) = ResponseEntity.status(HttpStatus.CREATED).body(service.createApplication(request, requireNotNull(user.id)))
    @PutMapping("/applications/{id}") @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun updateApplication(@PathVariable id: Long, @RequestBody request: SaveReReadingApplicationRequest, @CurrentUser user: User) = service.updateApplication(id, request, requireNotNull(user.id))
    @PostMapping("/applications/{id}/status") @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun changeStatus(@PathVariable id: Long, @RequestBody request: ChangeReReadingStatusRequest, @CurrentUser user: User) = service.changeStatus(id, request, requireNotNull(user.id))
    @DeleteMapping("/applications/{id}") @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun deleteApplication(@PathVariable id: Long, @CurrentUser user: User): ResponseEntity<Void> { service.deleteApplication(id, requireNotNull(user.id)); return ResponseEntity.noContent().build() }

    @GetMapping("/recovery-results") fun recoveryResults() = service.recoveryResults()
    @GetMapping("/teacher-report") fun teacherReport() = service.teacherReport()
    @GetMapping("/student-report") fun studentReport() = service.studentReport()
}
