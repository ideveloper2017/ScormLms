package uz.scorm.lms.app.v1.user.controller

import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import uz.scorm.lms.app.v1.user.dto.UserDto
import uz.scorm.lms.app.v1.user.mapper.UserMapper
import uz.scorm.lms.app.v1.user.service.UserService

@RestController
@RequestMapping("/api/v1/users")
class UserController(
    private val userService: UserService,
    private val userMapper: UserMapper,
) {
    data class RegisterRequest(
        val username: String,
        val password: String
    )

    @PostMapping("/register")
    fun register(@RequestBody req: RegisterRequest): ResponseEntity<UserDto> {
        // Ochiq registratsiya doim STUDENT roli bilan yaratiladi;
        // boshqa rol berish faqat admin'ning assignRole endpointi orqali
        val user = userService.register(
            username = req.username,
            rawPassword = req.password
        )
        return ResponseEntity.ok(userMapper.toDto(user))
    }

    @PreAuthorize("hasAuthority('ROLE_MANAGE')")
    @PostMapping("/{username}/roles/{roleCode}")
    fun assignRole(
        @PathVariable username: String,
        @PathVariable roleCode: String
    ): ResponseEntity<UserDto> {
        val user = userService.assignRole(username, roleCode)
        return ResponseEntity.ok(user)
    }

    @PreAuthorize("hasAuthority('USER_READ')")
    @GetMapping
    fun list(): ResponseEntity<List<UserDto>> =
        ResponseEntity.ok(userService.list().map(userMapper::toDto))

    @PreAuthorize("hasAuthority('USER_READ')")
    @GetMapping("/{username}")
    fun get(@PathVariable username: String): ResponseEntity<UserDto> =
        ResponseEntity.ok(userService.getByUsername(username))

    @PreAuthorize("hasAuthority('USER_WRITE')")
    @DeleteMapping("/{username}")
    fun delete(@PathVariable username: String): ResponseEntity<Void> {
        userService.deleteByUsername(username)
        return ResponseEntity.noContent().build()
    }
}
