package uz.scorm.lms.app.v1.email.controller

import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import uz.scorm.lms.app.v1.email.service.EmailService
import uz.scorm.lms.app.v1.user.repository.UserRepository
import java.time.Instant

@RestController
@RequestMapping("/auth/email")
class EmailVerificationController(
    private val emailService: EmailService,
    private val userRepository: UserRepository
) {
    data class SendRequest(val username: String)
    data class VerifyRequest(val username: String, val token: String)

    @PostMapping("/send")
    fun send(@RequestBody req: SendRequest): ResponseEntity<Void> {
        val user = userRepository.findByUsername(req.username) ?: return ResponseEntity.notFound().build()
        val email = user.email ?: return ResponseEntity.badRequest().build()
        val token = emailService.generateVerificationToken()
        user.emailVerificationToken = token
        user.emailVerificationExpiresAt = emailService.expiration(24)
        userRepository.save(user)
        emailService.sendVerificationEmail(email, token)
        return ResponseEntity.noContent().build()
    }

    @PostMapping("/verify")
    fun verify(@RequestBody req: VerifyRequest): ResponseEntity<Void> {
        val user = userRepository.findByUsername(req.username) ?: return ResponseEntity.notFound().build()
        val token = user.emailVerificationToken
        val exp = user.emailVerificationExpiresAt
        if (token == null || exp == null) return ResponseEntity.badRequest().build()
        if (token != req.token) return ResponseEntity.status(403).build()
        if (exp.isBefore(Instant.now())) return ResponseEntity.status(403).build()
        user.emailVerified = true
        user.emailVerificationToken = null
        user.emailVerificationExpiresAt = null
        userRepository.save(user)
        return ResponseEntity.noContent().build()
    }
}
