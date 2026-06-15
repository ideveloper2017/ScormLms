package uz.scorm.lms.app.v1.twofactor.controller

import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/v1/auth/2fa")
class TwoFactorController {
    data class OtpRequest(val code: Int)

    @PostMapping("/setup")
    fun setup(): ResponseEntity<Void> = ResponseEntity.status(501).build()

    @PostMapping("/enable")
    fun enable(@RequestBody req: OtpRequest): ResponseEntity<Void> = ResponseEntity.status(501).build()

    @PostMapping("/disable")
    fun disable(@RequestBody req: OtpRequest): ResponseEntity<Void> = ResponseEntity.status(501).build()
}
