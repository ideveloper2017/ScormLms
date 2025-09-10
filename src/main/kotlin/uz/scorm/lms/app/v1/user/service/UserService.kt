package uz.scorm.lms.app.v1.user.service

import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.user.model.User
import uz.scorm.lms.app.v1.user.repository.UserRepository
import uz.scorm.lms.app.v1.role.service.RoleService

@Service
class UserService(
    private val userRepository: UserRepository,
    private val roleService: RoleService,
    private val passwordEncoder: PasswordEncoder
) {
    fun register(username: String, rawPassword: String, roles: List<String> = listOf("STUDENT")): User {
        if (userRepository.existsByUsername(username)) {
            throw IllegalArgumentException("Username already exists: $username")
        }
        val user = User(
            username = username,
            password = passwordEncoder.encode(rawPassword),
            enabled = true
        )
        val roleEntities = roles.map { roleService.getByCode(it) }.toMutableSet()
        user.roles = roleEntities
        return userRepository.save(user)
    }

    @Transactional
    fun assignRole(username: String, roleCode: String): User {
        val user = userRepository.findByUsername(username)
            ?: throw NoSuchElementException("User not found: $username")
        val role = roleService.getByCode(roleCode)
        user.roles.add(role)
        return user
    }

    fun list(): List<User> = userRepository.findAll()

    fun getByUsername(username: String): User =
        userRepository.findByUsername(username) ?: throw NoSuchElementException("User not found: $username")

    fun deleteByUsername(username: String) {
        val user = userRepository.findByUsername(username)
            ?: throw NoSuchElementException("User not found: $username")
        userRepository.delete(user)
    }
}
