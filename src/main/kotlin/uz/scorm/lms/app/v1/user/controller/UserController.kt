package uz.scorm.lms.app.v1.user.controller

import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import uz.scorm.lms.app.v1.user.dto.UserCreateRequest
import uz.scorm.lms.app.v1.user.dto.UserDto
import uz.scorm.lms.app.v1.user.dto.UserImportRequest
import uz.scorm.lms.app.v1.user.dto.UserUpdateRequest
import uz.scorm.lms.app.v1.user.dto.PasswordResetRequest
import uz.scorm.lms.app.v1.user.model.UserStatus
import uz.scorm.lms.app.v1.user.service.UserService

@RestController
@RequestMapping("/api/v1/users")
class UserController(
    private val userService: UserService
) {
    @PreAuthorize("hasAuthority('USER_READ')")
    @GetMapping
    fun list(): ResponseEntity<List<UserDto>> =
        ResponseEntity.ok(userService.list())

    @PreAuthorize("hasAuthority('USER_READ')")
    @GetMapping("/{id}")
    fun getById(@PathVariable id: Long): ResponseEntity<UserDto> =
        ResponseEntity.ok(userService.getById(id))

    @PreAuthorize("hasAuthority('USER_READ')")
    @GetMapping("/username/{username}")
    fun getByUsername(@PathVariable username: String): ResponseEntity<UserDto> =
        ResponseEntity.ok(userService.getByUsername(username))

    @PreAuthorize("hasAuthority('USER_WRITE')")
    @PostMapping
    fun create(@RequestBody request: UserCreateRequest): ResponseEntity<UserDto> =
        ResponseEntity.status(HttpStatus.CREATED).body(userService.create(request))

    @PreAuthorize("hasAuthority('USER_WRITE')")
    @PutMapping("/{id}")
    fun update(
        @PathVariable id: Long,
        @RequestBody request: UserUpdateRequest
    ): ResponseEntity<UserDto> =
        ResponseEntity.ok(userService.update(id, request))

    @PreAuthorize("hasAuthority('USER_WRITE')")
    @PatchMapping("/{id}/status")
    fun changeStatus(
        @PathVariable id: Long,
        @RequestParam status: UserStatus
    ): ResponseEntity<UserDto> =
        ResponseEntity.ok(userService.changeStatus(id, status))

    @PreAuthorize("hasAuthority('ROLE_MANAGE')")
    @PostMapping("/{username}/roles/{roleCode}")
    fun assignRole(
        @PathVariable username: String,
        @PathVariable roleCode: String
    ): ResponseEntity<UserDto> =
        ResponseEntity.ok(userService.assignRole(username, roleCode))

    @PreAuthorize("hasAuthority('USER_MANAGE')")
    @PatchMapping("/{id}/password")
    fun resetPassword(
        @PathVariable id: Long,
        @RequestBody request: PasswordResetRequest
    ): ResponseEntity<UserDto> =
        ResponseEntity.ok(userService.resetPassword(id, request))

    @PreAuthorize("hasAuthority('USER_WRITE')")
    @PostMapping("/import")
    fun importUsers(@RequestBody request: UserImportRequest): ResponseEntity<List<UserDto>> =
        ResponseEntity.ok(userService.importUsers(request))

    @PreAuthorize("hasAuthority('USER_WRITE')")
    @DeleteMapping("/{id}")
    fun delete(@PathVariable id: Long): ResponseEntity<Void> {
        userService.delete(id)
        return ResponseEntity.noContent().build()
    }
}
