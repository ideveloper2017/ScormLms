package uz.scorm.lms.app.v1.user.service

import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.auth.repository.RefreshTokenRepository
import uz.scorm.lms.app.v1.role.service.RoleService
import uz.scorm.lms.app.v1.user.dto.UserCreateRequest
import uz.scorm.lms.app.v1.user.dto.UserDto
import uz.scorm.lms.app.v1.user.dto.UserUpdateRequest
import uz.scorm.lms.app.v1.user.mapper.UserMapper
import uz.scorm.lms.app.v1.user.model.User
import uz.scorm.lms.app.v1.user.model.UserStatus
import uz.scorm.lms.app.v1.user.repository.UserRepository

@Service
class UserService(
    private val userRepository: UserRepository,
    private val roleService: RoleService,
    private val passwordEncoder: PasswordEncoder,
    private val userMapper: UserMapper,
    private val refreshTokenRepository: RefreshTokenRepository
) {
    fun register(username: String, rawPassword: String, roleCode: String = "ROLE_STUDENT"): User {
        if (userRepository.existsByUsername(username)) {
            throw IllegalArgumentException("Username already exists: $username")
        }
        val role = roleService.getByCode(roleCode)
        return userRepository.save(
            User(
                username = username,
                password = passwordEncoder.encode(rawPassword),
                role = role,
                status = UserStatus.ACTIVE
            )
        )
    }

    @Transactional
    fun create(request: UserCreateRequest): UserDto {
        if (userRepository.existsByUsername(request.username)) {
            throw IllegalArgumentException("Username already exists: ${request.username}")
        }
        val role = roleService.getByCode(request.roleCode)
        val user = User(
            username = request.username,
            email = request.email,
            phone = request.phone,
            password = passwordEncoder.encode(request.password),
            role = role,
            status = UserStatus.ACTIVE
        )
        return userMapper.toDto(userRepository.save(user))
    }

    @Transactional(readOnly = true)
    fun list(): List<UserDto> = userRepository.findAll().map(userMapper::toDto)

    @Transactional(readOnly = true)
    fun getById(id: Long): UserDto {
        val user = userRepository.findById(id)
            .orElseThrow { NoSuchElementException("User not found: $id") }
        return userMapper.toDto(user)
    }

    @Transactional(readOnly = true)
    fun getByUsername(username: String): UserDto {
        val user = userRepository.findByUsername(username)
            ?: throw NoSuchElementException("User not found: $username")
        return userMapper.toDto(user)
    }

    @Transactional
    fun update(id: Long, request: UserUpdateRequest): UserDto {
        val user = userRepository.findById(id)
            .orElseThrow { NoSuchElementException("User not found: $id") }
        request.email?.let { user.email = it }
        request.phone?.let { user.phone = it }
        request.status?.let { user.status = it }
        request.roleCode?.let { user.role = roleService.getByCode(it) }
        return userMapper.toDto(userRepository.save(user))
    }

    @Transactional
    fun changeStatus(id: Long, status: UserStatus): UserDto {
        val user = userRepository.findById(id)
            .orElseThrow { NoSuchElementException("User not found: $id") }
        user.status = status
        return userMapper.toDto(userRepository.save(user))
    }

    @Transactional
    fun assignRole(username: String, roleCode: String): UserDto {
        val user = userRepository.findByUsername(username)
            ?: throw NoSuchElementException("User not found: $username")
        user.role = roleService.getByCode(roleCode)
        return userMapper.toDto(userRepository.save(user))
    }

    @Transactional
    fun delete(id: Long) {
        val user = userRepository.findById(id)
            .orElseThrow { NoSuchElementException("User not found: $id") }
        refreshTokenRepository.deleteByUser(user)
        userRepository.delete(user)
    }

    @Transactional
    fun deleteByUsername(username: String) {
        val user = userRepository.findByUsername(username)
            ?: throw NoSuchElementException("User not found: $username")
        refreshTokenRepository.deleteByUser(user)
        userRepository.delete(user)
    }
}
