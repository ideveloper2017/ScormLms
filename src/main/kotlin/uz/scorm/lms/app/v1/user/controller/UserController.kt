package uz.scorm.lms.app.v1.user.controller

import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import uz.scorm.lms.app.v1.user.dto.UserDto
import uz.scorm.lms.app.v1.user.mapper.UserMapper
import uz.scorm.lms.app.v1.user.model.User
import uz.scorm.lms.app.v1.user.service.UserService

@RestController
@RequestMapping("/users")
class UserController(
    private val userService: UserService,
    private val userMapper: UserMapper,
) {
    data class RegisterRequest(
        val username: String,
        val password: String,
        val roles: List<String>? = null
    )

    @PostMapping("/register")
    fun register(@RequestBody req: RegisterRequest): ResponseEntity<User> {
        val user = userService.register(
            username = req.username,
            rawPassword = req.password,
            roles = req.roles ?: listOf("STUDENT")
        )
        return ResponseEntity.ok(user)
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/{username}/roles/{roleCode}")
    fun assignRole(
        @PathVariable username: String,
        @PathVariable roleCode: String
    ): ResponseEntity<UserDto> {
        val user = userService.assignRole(username, roleCode)
        return ResponseEntity.ok(user)
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    fun list(): ResponseEntity<List<User>> = ResponseEntity.ok(userService.list())

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/{username}")
    fun get(@PathVariable username: String): ResponseEntity<UserDto> =
        ResponseEntity.ok(userService.getByUsername(username))

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{username}")
    fun delete(@PathVariable username: String): ResponseEntity<Void> {
        userService.deleteByUsername(username)
        return ResponseEntity.noContent().build()
    }
}
