package uz.scorm.lms.app.v1.user.service

import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.auth.model.PasswordResetToken
import uz.scorm.lms.app.v1.auth.repository.PasswordResetTokenRepository
import uz.scorm.lms.app.v1.auth.repository.RefreshTokenRepository
import uz.scorm.lms.app.v1.email.service.EmailService
import uz.scorm.lms.app.v1.role.service.RoleService
import uz.scorm.lms.app.v1.user.dto.ForgotPasswordRequest
import uz.scorm.lms.app.v1.user.dto.PasswordChangeRequest
import uz.scorm.lms.app.v1.user.dto.PasswordResetRequest
import uz.scorm.lms.app.v1.user.dto.ResetPasswordWithTokenRequest
import uz.scorm.lms.app.v1.user.dto.UserCreateRequest
import uz.scorm.lms.app.v1.user.dto.UserImportRequest
import uz.scorm.lms.app.v1.user.dto.UserDto
import uz.scorm.lms.app.v1.user.dto.UserUpdateRequest
import java.time.Instant
import java.time.temporal.ChronoUnit
import java.util.UUID
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
    private val refreshTokenRepository: RefreshTokenRepository,
    private val passwordResetTokenRepository: PasswordResetTokenRepository,
    private val emailService: EmailService
) {
    fun register(username: String, rawPassword: String, roleName: String = "student"): User {
        if (userRepository.existsByUsername(username)) {
            throw IllegalArgumentException("Username already exists: $username")
        }
        val role = roleService.getByName(roleName)
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
        val role = roleService.getByName(request.roleCode)
        return userMapper.toDto(
            userRepository.save(
                User(
                    fullName = request.fullName,
                    username = request.username,
                    email = request.email,
                    phone = request.phone,
                    jshshir = request.jshshir,
                    faculty = request.faculty,
                    direction = request.direction,
                    groupName = request.groupName,
                    password = passwordEncoder.encode(request.password),
                    role = role,
                    status = UserStatus.ACTIVE
                )
            )
        )
    }

    @Transactional
    fun importUsers(request: UserImportRequest): List<UserDto> {
        val results = mutableListOf<UserDto>()
        for (item in request.users) {
            if (userRepository.existsByUsername(item.username)) continue
            val role = try { roleService.getByName(item.roleCode) } catch (_: Exception) { continue }
            results += userMapper.toDto(
                userRepository.save(
                    User(
                        fullName = item.fullName,
                        username = item.username,
                        email = item.email,
                        phone = item.phone,
                        jshshir = item.jshshir,
                        faculty = item.faculty,
                        direction = item.direction,
                        groupName = item.groupName,
                        password = passwordEncoder.encode(item.password),
                        role = role,
                        status = UserStatus.ACTIVE
                    )
                )
            )
        }
        return results
    }

    @Transactional(readOnly = true)
    fun list(): List<UserDto> = userRepository.findAll().map(userMapper::toDto)

    @Transactional(readOnly = true)
    fun getById(id: Long): UserDto =
        userMapper.toDto(userRepository.findById(id).orElseThrow { NoSuchElementException("User not found: $id") })

    @Transactional(readOnly = true)
    fun getByUsername(username: String): UserDto =
        userMapper.toDto(userRepository.findByUsername(username) ?: throw NoSuchElementException("User not found: $username"))

    @Transactional
    fun update(id: Long, request: UserUpdateRequest): UserDto {
        val user = userRepository.findById(id).orElseThrow { NoSuchElementException("User not found: $id") }
        request.fullName?.let { user.fullName = it }
        request.email?.let { user.email = it }
        request.phone?.let { user.phone = it }
        request.jshshir?.let { user.jshshir = it }
        request.faculty?.let { user.faculty = it }
        request.direction?.let { user.direction = it }
        request.groupName?.let { user.groupName = it }
        request.status?.let { user.status = it }
        request.roleCode?.let { user.role = roleService.getByName(it) }
        return userMapper.toDto(userRepository.save(user))
    }

    @Transactional
    fun changeStatus(id: Long, status: UserStatus): UserDto {
        val user = userRepository.findById(id).orElseThrow { NoSuchElementException("User not found: $id") }
        user.status = status
        return userMapper.toDto(userRepository.save(user))
    }

    @Transactional
    fun assignRole(username: String, roleName: String): UserDto {
        val user = userRepository.findByUsername(username) ?: throw NoSuchElementException("User not found: $username")
        user.role = roleService.getByName(roleName)
        return userMapper.toDto(userRepository.save(user))
    }

    @Transactional
    fun delete(id: Long) {
        val user = userRepository.findById(id).orElseThrow { NoSuchElementException("User not found: $id") }
        refreshTokenRepository.deleteByUser(user)
        userRepository.delete(user)
    }

    @Transactional
    fun deleteByUsername(username: String) {
        val user = userRepository.findByUsername(username) ?: throw NoSuchElementException("User not found: $username")
        refreshTokenRepository.deleteByUser(user)
        userRepository.delete(user)
    }

    @Transactional
    fun changePassword(username: String, request: PasswordChangeRequest) {
        val user = userRepository.findByUsername(username)
            ?: throw NoSuchElementException("User not found: $username")
        if (!passwordEncoder.matches(request.currentPassword, user.password)) {
            throw IllegalArgumentException("Joriy parol noto'g'ri")
        }
        user.password = passwordEncoder.encode(request.newPassword)
        userRepository.save(user)
    }

    @Transactional
    fun forgotPassword(request: ForgotPasswordRequest) {
        val user = userRepository.findByEmail(request.email) ?: return

        passwordResetTokenRepository.deleteAllByUser(user)

        val token = UUID.randomUUID().toString().replace("-", "")
        passwordResetTokenRepository.save(
            PasswordResetToken(
                user = user,
                token = token,
                expiresAt = Instant.now().plus(1, ChronoUnit.HOURS)
            )
        )
        emailService.sendPasswordResetEmail(user.email!!, token)
    }

    @Transactional
    fun resetPasswordWithToken(request: ResetPasswordWithTokenRequest) {
        val resetToken = passwordResetTokenRepository.findByToken(request.token)
            ?: throw IllegalArgumentException("Token noto'g'ri yoki muddati o'tgan")

        if (resetToken.used) throw IllegalArgumentException("Token allaqachon ishlatilgan")
        if (resetToken.expiresAt.isBefore(Instant.now())) throw IllegalArgumentException("Token muddati o'tgan")

        resetToken.user.password = passwordEncoder.encode(request.newPassword)
        resetToken.used = true
        userRepository.save(resetToken.user)
        passwordResetTokenRepository.save(resetToken)
    }

    @Transactional
    fun resetPassword(id: Long, request: PasswordResetRequest): UserDto {
        val user = userRepository.findById(id)
            .orElseThrow { NoSuchElementException("User not found: $id") }
        user.password = passwordEncoder.encode(request.newPassword)
        return userMapper.toDto(userRepository.save(user))
    }
}