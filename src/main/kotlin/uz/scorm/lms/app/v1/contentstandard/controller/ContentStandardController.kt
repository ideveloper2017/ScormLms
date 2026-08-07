package uz.scorm.lms.app.v1.contentstandard.controller

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
import uz.scorm.lms.app.v1.contentstandard.dto.ReviewContentStandardAssessmentRequest
import uz.scorm.lms.app.v1.contentstandard.dto.ReviewContentStandardRequest
import uz.scorm.lms.app.v1.contentstandard.dto.SaveContentStandardAssessmentRequest
import uz.scorm.lms.app.v1.contentstandard.dto.SaveContentStandardChecklistRequest
import uz.scorm.lms.app.v1.contentstandard.service.ContentStandardService
import uz.scorm.lms.app.v1.user.model.User

@RestController
@RequestMapping("/api/v1/content-standard")
@PreAuthorize("hasAnyAuthority('ACADEMIC_READ', 'AUDIT_READ')")
class ContentStandardController(private val service: ContentStandardService) {
    @GetMapping("/checklists") fun checklists() = service.listChecklists()
    @GetMapping("/checklists/current") fun currentChecklist() = service.activeChecklistDto()
    @GetMapping("/checklists/{id}") fun checklist(@PathVariable id: Long) = service.getChecklist(id)
    @GetMapping("/revisions") fun revisions() = service.revisionCandidates()
    @GetMapping("/assessments") fun assessments() = service.listAssessments()

    @PostMapping("/checklists") @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun createChecklist(@RequestBody request: SaveContentStandardChecklistRequest, @CurrentUser user: User) =
        ResponseEntity.status(HttpStatus.CREATED).body(service.createChecklist(request, requireNotNull(user.id)))
    @PutMapping("/checklists/{id}") @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun updateChecklist(@PathVariable id: Long, @RequestBody request: SaveContentStandardChecklistRequest, @CurrentUser user: User) = service.updateChecklist(id, request, requireNotNull(user.id))
    @PostMapping("/checklists/{id}/publish") @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun publishChecklist(@PathVariable id: Long, @RequestBody request: ReviewContentStandardRequest, @CurrentUser user: User) = service.publishChecklist(id, request, requireNotNull(user.id))
    @PostMapping("/checklists/{id}/reject") @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun rejectChecklist(@PathVariable id: Long, @RequestBody request: ReviewContentStandardRequest, @CurrentUser user: User) = service.rejectChecklist(id, request, requireNotNull(user.id))
    @PostMapping("/checklists/{id}/archive") @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun archiveChecklist(@PathVariable id: Long, @CurrentUser user: User) = service.archiveChecklist(id, requireNotNull(user.id))

    @PostMapping("/assessments") @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun createAssessment(@RequestBody request: SaveContentStandardAssessmentRequest, @CurrentUser user: User) =
        ResponseEntity.status(HttpStatus.CREATED).body(service.createAssessment(request, requireNotNull(user.id)))
    @PostMapping("/assessments/{id}/review") @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun reviewAssessment(@PathVariable id: Long, @RequestBody request: ReviewContentStandardAssessmentRequest, @CurrentUser user: User) = service.reviewAssessment(id, request, requireNotNull(user.id))
}
