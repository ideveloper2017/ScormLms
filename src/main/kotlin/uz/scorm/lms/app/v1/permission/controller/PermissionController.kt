package uz.scorm.lms.app.v1.permission.controller

import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import uz.scorm.lms.app.v1.permission.model.Permission
import uz.scorm.lms.app.v1.permission.service.PermissionService

@RestController
@RequestMapping("/permissions")
class PermissionController(
    private val permissionService: PermissionService
) {
    data class CreatePermissionRequest(val code: String, val name: String)

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    fun createPermission(@RequestBody req: CreatePermissionRequest): ResponseEntity<Permission> {
        return ResponseEntity.ok(permissionService.create(req.code, req.name))
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    fun list(): ResponseEntity<List<Permission>> = ResponseEntity.ok(permissionService.list())

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/{code}")
    fun get(@PathVariable code: String): ResponseEntity<Permission> =
        ResponseEntity.ok(permissionService.getByCode(code))

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{code}")
    fun delete(@PathVariable code: String): ResponseEntity<Void> {
        permissionService.deleteByCode(code)
        return ResponseEntity.noContent().build()
    }
}
