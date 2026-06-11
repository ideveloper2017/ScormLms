package uz.scorm.lms.app.v1.role.controller

import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import uz.scorm.lms.app.v1.role.model.Role
import uz.scorm.lms.app.v1.role.service.RoleService

@RestController
@RequestMapping("/api/v1/roles")
class RoleController(
    private val roleService: RoleService
) {
    data class CreateRoleRequest(val code: String, val name: String)

    @PreAuthorize("hasAuthority('ROLE_MANAGE')")
    @PostMapping
    fun createRole(@RequestBody req: CreateRoleRequest): ResponseEntity<Role> {
        return ResponseEntity.ok(roleService.create(req.code, req.name))
    }

    @PreAuthorize("hasAuthority('ROLE_MANAGE')")
    @PostMapping("/{roleCode}/permissions/{permissionCode}")
    fun addPermission(
        @PathVariable roleCode: String,
        @PathVariable permissionCode: String
    ): ResponseEntity<Role> {
        return ResponseEntity.ok(roleService.addPermissionToRole(roleCode, permissionCode))
    }

    @PreAuthorize("hasAuthority('ROLE_MANAGE')")
    @GetMapping
    fun list(): ResponseEntity<List<Role>> = ResponseEntity.ok(roleService.list())

    @PreAuthorize("hasAuthority('ROLE_MANAGE')")
    @GetMapping("/{roleCode}")
    fun get(@PathVariable roleCode: String): ResponseEntity<Role> =
        ResponseEntity.ok(roleService.getByCode(roleCode))

    @PreAuthorize("hasAuthority('ROLE_MANAGE')")
    @DeleteMapping("/{roleCode}")
    fun delete(@PathVariable roleCode: String): ResponseEntity<Void> {
        roleService.deleteByCode(roleCode)
        return ResponseEntity.noContent().build()
    }
}
