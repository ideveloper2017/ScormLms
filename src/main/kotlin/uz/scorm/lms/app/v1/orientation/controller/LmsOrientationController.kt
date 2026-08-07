package uz.scorm.lms.app.v1.orientation.controller

import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import uz.scorm.lms.app.security.CurrentUser
import uz.scorm.lms.app.v1.orientation.dto.CreateLmsOrientationRequest
import uz.scorm.lms.app.v1.orientation.dto.LmsOrientationAttendeeDto
import uz.scorm.lms.app.v1.orientation.dto.LmsOrientationSessionDto
import uz.scorm.lms.app.v1.orientation.dto.RecordLmsOrientationAttendanceRequest
import uz.scorm.lms.app.v1.orientation.dto.StudentLmsOrientationDto
import uz.scorm.lms.app.v1.orientation.service.LmsOrientationService
import uz.scorm.lms.app.v1.user.model.User

@RestController
@RequestMapping("/api/v1/orientations")
class LmsOrientationController(private val service: LmsOrientationService) {
    @GetMapping
    @PreAuthorize("hasAuthority('ACADEMIC_READ')")
    fun list(): List<LmsOrientationSessionDto> = service.list()

    @GetMapping("/{id}/attendees")
    @PreAuthorize("hasAuthority('ACADEMIC_READ')")
    fun attendees(@PathVariable id: Long): List<LmsOrientationAttendeeDto> = service.attendees(id)

    @PostMapping
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun create(@RequestBody request: CreateLmsOrientationRequest, @CurrentUser user: User): ResponseEntity<LmsOrientationSessionDto> =
        ResponseEntity.status(HttpStatus.CREATED).body(service.create(request, requireNotNull(user.id)))

    @PostMapping("/{id}/publish")
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun publish(@PathVariable id: Long, @CurrentUser user: User) = service.publish(id, requireNotNull(user.id))

    @PostMapping("/{id}/attendees/{studentId}/attendance")
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun attendance(
        @PathVariable id: Long,
        @PathVariable studentId: Long,
        @RequestBody request: RecordLmsOrientationAttendanceRequest,
        @CurrentUser user: User,
    ) = service.recordAttendance(id, studentId, request.status, requireNotNull(user.id))

    @PostMapping("/{id}/complete")
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun complete(@PathVariable id: Long, @CurrentUser user: User) = service.complete(id, requireNotNull(user.id))

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    fun cancel(@PathVariable id: Long, @CurrentUser user: User) = service.cancel(id, requireNotNull(user.id))

    @GetMapping("/me")
    @PreAuthorize("hasAuthority('STUDENT_READ')")
    fun mine(@CurrentUser user: User): StudentLmsOrientationDto = service.mine(requireNotNull(user.id))

    @PostMapping("/{id}/acknowledge")
    @PreAuthorize("hasAuthority('STUDENT_WRITE')")
    fun acknowledge(@PathVariable id: Long, @CurrentUser user: User): StudentLmsOrientationDto =
        service.acknowledge(id, requireNotNull(user.id))
}

