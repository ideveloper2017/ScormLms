package uz.scorm.lms.app.v1.leave.controller

import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import uz.scorm.lms.app.security.CurrentUser
import uz.scorm.lms.app.v1.leave.dto.RejectAssessmentLeaveEvidenceRequest
import uz.scorm.lms.app.v1.leave.dto.SaveAssessmentLeaveEvidenceRequest
import uz.scorm.lms.app.v1.leave.dto.VerifyAssessmentLeaveEvidenceRequest
import uz.scorm.lms.app.v1.leave.service.AssessmentLeaveEvidenceService
import uz.scorm.lms.app.v1.user.model.User

@RestController
@RequestMapping("/api/v1/assessment-leaves")
class AssessmentLeaveEvidenceController(private val service: AssessmentLeaveEvidenceService) {
    @GetMapping @PreAuthorize("hasAuthority('ACADEMIC_READ')") fun list() = service.list()
    @GetMapping("/{id}") @PreAuthorize("hasAuthority('ACADEMIC_READ')") fun get(@PathVariable id: Long) = service.get(id)
    @GetMapping("/eligible-students") @PreAuthorize("hasAuthority('ACADEMIC_READ')") fun eligibleStudents() = service.eligibleStudents()
    @GetMapping("/mine") @PreAuthorize("hasAuthority('STUDENT_READ')") fun mine(@CurrentUser user: User) = service.mine(requireNotNull(user.id))
    @PostMapping @PreAuthorize("hasAuthority('ACADEMIC_WRITE')") fun create(@RequestBody request: SaveAssessmentLeaveEvidenceRequest, @CurrentUser user: User) = ResponseEntity.status(HttpStatus.CREATED).body(service.create(request, requireNotNull(user.id)))
    @PutMapping("/{id}") @PreAuthorize("hasAuthority('ACADEMIC_WRITE')") fun update(@PathVariable id: Long, @RequestBody request: SaveAssessmentLeaveEvidenceRequest, @CurrentUser user: User) = service.update(id, request, requireNotNull(user.id))
    @PostMapping("/{id}/verify") @PreAuthorize("hasAuthority('ACADEMIC_WRITE')") fun verify(@PathVariable id: Long, @RequestBody request: VerifyAssessmentLeaveEvidenceRequest, @CurrentUser user: User) = service.verify(id, request, requireNotNull(user.id))
    @PostMapping("/{id}/reject") @PreAuthorize("hasAuthority('ACADEMIC_WRITE')") fun reject(@PathVariable id: Long, @RequestBody request: RejectAssessmentLeaveEvidenceRequest, @CurrentUser user: User) = service.reject(id, request, requireNotNull(user.id))
}
