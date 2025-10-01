package uz.scorm.lms.app.v1.twofactor.controller

import org.springframework.http.ResponseEntity
import org.springframework.security.core.Authentication
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.web.bind.annotation.*
import uz.scorm.lms.app.v1.twofactor.service.TwoFactorService
import uz.scorm.lms.app.v1.user.repository.UserRepository

@RestController
@RequestMapping("/api/v1/auth/2fa")
class TwoFactorController(
    private val twoFactorService: TwoFactorService,
    private val userRepository: UserRepository
) {
    data class SetupResponse(val secret: String, val otpauthUri: String)
    data class OtpRequest(val code: Int)

    private fun currentUsername(): String {
        val auth: Authentication = SecurityContextHolder.getContext().authentication
        return auth.name
    }

    @PostMapping("/setup")
    fun setup(): ResponseEntity<SetupResponse> {
        val username = currentUsername()
        val user = userRepository.findByUsername(username) ?: return ResponseEntity.notFound().build()
        val secret = twoFactorService.generateSecret()
        user.twoFactorSecret = secret
        userRepository.save(user)
        val uri = twoFactorService.otpauthUri("ScromLMS", username, secret)
        return ResponseEntity.ok(SetupResponse(secret = secret, otpauthUri = uri))
    }

    @PostMapping("/enable")
    fun enable(@RequestBody req: OtpRequest): ResponseEntity<Void> {
        val username = currentUsername()
        val user = userRepository.findByUsername(username) ?: return ResponseEntity.notFound().build()
        val secret = user.twoFactorSecret ?: return ResponseEntity.badRequest().build()
        val ok = twoFactorService.verifyCode(secret, req.code)
        if (!ok) return ResponseEntity.status(403).build()
        user.twoFactorEnabled = true
        userRepository.save(user)
        return ResponseEntity.noContent().build()
    }

    @PostMapping("/disable")
    fun disable(@RequestBody req: OtpRequest): ResponseEntity<Void> {
        val username = currentUsername()
        val user = userRepository.findByUsername(username) ?: return ResponseEntity.notFound().build()
        val secret = user.twoFactorSecret ?: return ResponseEntity.badRequest().build()
        val ok = twoFactorService.verifyCode(secret, req.code)
        if (!ok) return ResponseEntity.status(403).build()
        user.twoFactorEnabled = false
        // Optionally clear secret
        // user.twoFactorSecret = null
        userRepository.save(user)
        return ResponseEntity.noContent().build()
    }
}
