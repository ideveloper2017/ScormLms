package uz.scorm.lms.app.v1.group.controller

import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import uz.scorm.lms.app.v1.group.dto.GroupCreateRequest
import uz.scorm.lms.app.v1.group.dto.GroupDto
import uz.scorm.lms.app.v1.group.dto.GroupUpdateRequest
import uz.scorm.lms.app.v1.group.service.GroupService

@RestController
@RequestMapping("/api/v1/groups")
class GroupController(
    private val groupService: GroupService
) {
    @PreAuthorize("hasAuthority('ACADEMIC_READ')")
    @GetMapping
    fun list(@RequestParam(required = false) programId: Long?): ResponseEntity<List<GroupDto>> =
        ResponseEntity.ok(groupService.list(programId))

    @PreAuthorize("hasAuthority('ACADEMIC_READ')")
    @GetMapping("/{id}")
    fun getById(@PathVariable id: Long): ResponseEntity<GroupDto> =
        ResponseEntity.ok(groupService.getById(id))

    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    @PostMapping
    fun create(@RequestBody request: GroupCreateRequest): ResponseEntity<GroupDto> =
        ResponseEntity.status(HttpStatus.CREATED).body(groupService.create(request))

    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    @PutMapping("/{id}")
    fun update(
        @PathVariable id: Long,
        @RequestBody request: GroupUpdateRequest
    ): ResponseEntity<GroupDto> =
        ResponseEntity.ok(groupService.update(id, request))

    @PreAuthorize("hasAuthority('ACADEMIC_WRITE')")
    @DeleteMapping("/{id}")
    fun delete(@PathVariable id: Long): ResponseEntity<Void> {
        groupService.delete(id)
        return ResponseEntity.noContent().build()
    }
}
