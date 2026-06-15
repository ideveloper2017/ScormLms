package uz.scorm.lms.app.v1.email.controller

import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/auth/email")
class EmailVerificationController {
    data class SendRequest(val username: String)
    data class VerifyRequest(val username: String, val token: String)

    @PostMapping("/send")
    fun send(@RequestBody req: SendRequest): ResponseEntity<Void> = ResponseEntity.status(501).build()

    @PostMapping("/verify")
    fun verify(@RequestBody req: VerifyRequest): ResponseEntity<Void> = ResponseEntity.status(501).build()
}
