package uz.scorm.lms.app.v1.role.controller

import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import uz.scorm.lms.app.v1.role.dto.RoleDto
import uz.scorm.lms.app.v1.role.mapper.RoleMapper
import uz.scorm.lms.app.v1.role.service.RoleService

@RestController
@RequestMapping("/api/v1/roles")
class RoleController(
    private val roleService: RoleService,
    private val roleMapper: RoleMapper
) {
    data class CreateRoleRequest(val name: String)

    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @PostMapping
    fun create(@RequestBody req: CreateRoleRequest): ResponseEntity<RoleDto> =
        ResponseEntity.status(HttpStatus.CREATED).body(roleMapper.toDto(roleService.create(req.name)))

    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @GetMapping
    fun list(): ResponseEntity<List<RoleDto>> =
        ResponseEntity.ok(roleService.list().map { roleMapper.toDto(it) })

    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @GetMapping("/{name}")
    fun get(@PathVariable name: String): ResponseEntity<RoleDto> =
        ResponseEntity.ok(roleMapper.toDto(roleService.getByName(name)))

    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @DeleteMapping("/{name}")
    fun delete(@PathVariable name: String): ResponseEntity<Void> {
        roleService.delete(name)
        return ResponseEntity.noContent().build()
    }
}
