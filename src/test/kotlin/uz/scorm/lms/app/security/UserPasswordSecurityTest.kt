package uz.scorm.lms.app.security

import io.mockk.every
import io.mockk.mockk
import io.mockk.slot
import io.mockk.verify
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import org.springframework.security.crypto.password.PasswordEncoder
import uz.scorm.lms.app.v1.auth.model.PasswordResetToken
import uz.scorm.lms.app.v1.auth.repository.PasswordResetTokenRepository
import uz.scorm.lms.app.v1.auth.repository.RefreshTokenRepository
import uz.scorm.lms.app.v1.email.service.EmailService
import uz.scorm.lms.app.v1.role.service.RoleService
import uz.scorm.lms.app.v1.user.dto.ForgotPasswordRequest
import uz.scorm.lms.app.v1.user.dto.ResetPasswordWithTokenRequest
import uz.scorm.lms.app.v1.user.mapper.UserMapper
import uz.scorm.lms.app.v1.user.model.User
import uz.scorm.lms.app.v1.user.repository.UserRepository
import uz.scorm.lms.app.v1.user.service.UserService
import java.security.MessageDigest

class UserPasswordSecurityTest {
    private val userRepository = mockk<UserRepository>(relaxed = true)
    private val passwordEncoder = mockk<PasswordEncoder>(relaxed = true)
    private val refreshTokenRepository = mockk<RefreshTokenRepository>(relaxed = true)
    private val resetTokenRepository = mockk<PasswordResetTokenRepository>(relaxed = true)
    private val emailService = mockk<EmailService>(relaxed = true)
    private val service = UserService(
        userRepository,
        mockk<RoleService>(relaxed = true),
        passwordEncoder,
        mockk<UserMapper>(relaxed = true),
        refreshTokenRepository,
        resetTokenRepository,
        emailService,
        PasswordPolicy(),
    )

    @Test
    fun `reset token bazada hash boladi va parol almashganda sessiyalar bekor qilinadi`() {
        val user = User(username = "secure-user", email = "secure@example.test", password = "old-hash")
        val savedToken = slot<PasswordResetToken>()
        val deliveredToken = slot<String>()
        every { userRepository.findByEmail("secure@example.test") } returns user
        every { resetTokenRepository.save(capture(savedToken)) } answers { savedToken.captured }
        every { emailService.sendPasswordResetEmail("secure@example.test", capture(deliveredToken)) } returns Unit

        service.forgotPassword(ForgotPasswordRequest("secure@example.test"))

        assertNotEquals(deliveredToken.captured, savedToken.captured.token)
        assertEquals(sha256(deliveredToken.captured), savedToken.captured.token)

        every { resetTokenRepository.findByToken(sha256(deliveredToken.captured)) } returns savedToken.captured
        every { passwordEncoder.encode("New-secure-password-2026!") } returns "new-hash"
        every { userRepository.save(user) } returns user
        service.resetPasswordWithToken(ResetPasswordWithTokenRequest(
            token = deliveredToken.captured,
            newPassword = "New-secure-password-2026!",
        ))

        assertEquals("new-hash", user.password)
        assertTrue(savedToken.captured.used)
        verify(exactly = 1) { refreshTokenRepository.deleteByUser(user) }
    }

    private fun sha256(value: String): String = MessageDigest.getInstance("SHA-256")
        .digest(value.toByteArray()).joinToString("") { "%02x".format(it) }
}
