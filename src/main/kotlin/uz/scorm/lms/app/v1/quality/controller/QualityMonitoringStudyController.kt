package uz.scorm.lms.app.v1.quality.controller

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
import uz.scorm.lms.app.v1.quality.dto.CompleteQualityMonitoringStudyRequest
import uz.scorm.lms.app.v1.quality.dto.CreateQualityMonitoringStudyRequest
import uz.scorm.lms.app.v1.quality.dto.QualityMonitoringStudyDto
import uz.scorm.lms.app.v1.quality.service.QualityMonitoringStudyService
import uz.scorm.lms.app.v1.user.model.User

@RestController
@RequestMapping("/api/v1/quality-monitoring/studies")
@PreAuthorize("hasAnyAuthority('ACADEMIC_READ', 'STAT_READ')")
class QualityMonitoringStudyController(private val service: QualityMonitoringStudyService) {
    @GetMapping
    fun list(): List<QualityMonitoringStudyDto> = service.list()

    @GetMapping("/{id}")
    fun get(@PathVariable id: Long): QualityMonitoringStudyDto = service.get(id)

    @PostMapping
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun create(@RequestBody request: CreateQualityMonitoringStudyRequest, @CurrentUser user: User): ResponseEntity<QualityMonitoringStudyDto> =
        ResponseEntity.status(HttpStatus.CREATED).body(service.create(request, requireNotNull(user.id)))

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun update(@PathVariable id: Long, @RequestBody request: CreateQualityMonitoringStudyRequest, @CurrentUser user: User) =
        service.update(id, request, requireNotNull(user.id))

    @PostMapping("/{id}/complete")
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun complete(
        @PathVariable id: Long,
        @RequestBody request: CompleteQualityMonitoringStudyRequest,
        @CurrentUser user: User,
    ) = service.complete(id, request, requireNotNull(user.id))

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun approve(@PathVariable id: Long, @CurrentUser user: User) = service.approve(id, requireNotNull(user.id))

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun cancel(@PathVariable id: Long, @CurrentUser user: User) = service.cancel(id, requireNotNull(user.id))
}

