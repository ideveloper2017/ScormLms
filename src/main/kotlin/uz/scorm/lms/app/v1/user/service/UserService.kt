package uz.scorm.lms.app.v1.user.service

import org.springframework.beans.factory.annotation.Autowired
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.user.model.User
import uz.scorm.lms.app.v1.user.repository.UserRepository
import uz.scorm.lms.app.v1.role.service.RoleService
import uz.scorm.lms.app.v1.user.dto.UserDto
import uz.scorm.lms.app.v1.user.mapper.UserMapper

@Service
class UserService(
    private val userRepository: UserRepository,
    private val roleService: RoleService,
    private val passwordEncoder: PasswordEncoder,
    private val userMapper: UserMapper
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
    fun assignRole(username: String, roleCode: String): UserDto {
        val user = userRepository.findByUsername(username)
            ?: throw NoSuchElementException("User not found: $username")
        val role = roleService.getByCode(roleCode)
        user.roles.add(role)
        return userMapper.toDto(user)
    }

    fun list(): List<User> = userRepository.findAll()


    
    fun getByUsername(username: String): UserDto {
        val user = userRepository.findByUsername(username)
            ?: throw NoSuchElementException("User not found: $username")
        return userMapper.toDto(user)
    }

    fun deleteByUsername(username: String) {
        val user = userRepository.findByUsername(username)
            ?: throw NoSuchElementException("User not found: $username")
        userRepository.delete(user)
    }
}
