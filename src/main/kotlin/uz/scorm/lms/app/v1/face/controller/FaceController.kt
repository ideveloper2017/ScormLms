package uz.scorm.lms.app.v1.face.controller

import org.springframework.http.ResponseEntity
import org.springframework.security.core.Authentication
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.multipart.MultipartFile
import uz.scorm.lms.app.v1.face.service.FaceService
import uz.scorm.lms.app.v1.user.repository.UserRepository
import java.time.Instant

@RestController
@RequestMapping("/auth/face")
class FaceController(
    private val faceService: FaceService,
    private val userRepository: UserRepository
) {
    data class FaceResponse(val verified: Boolean, val verifiedAt: Instant?)

    private fun currentUsername(): String {
        val auth: Authentication = SecurityContextHolder.getContext().authentication
        return auth.name
    }

    @PostMapping("/enroll")
    fun enroll(@RequestParam("file") file: MultipartFile): ResponseEntity<FaceResponse> {
        if (file.isEmpty) return ResponseEntity.badRequest().build()
        val username = currentUsername()
        val user = userRepository.findByUsername(username) ?: return ResponseEntity.notFound().build()
        val template = faceService.generateTemplate(file.bytes)
        user.faceTemplate = template
        user.faceVerified = true
        user.lastFaceVerifiedAt = Instant.now()
        userRepository.save(user)
        return ResponseEntity.ok(FaceResponse(verified = true, verifiedAt = user.lastFaceVerifiedAt))
    }

    @PostMapping("/verify")
    fun verify(@RequestParam("file") file: MultipartFile): ResponseEntity<FaceResponse> {
        if (file.isEmpty) return ResponseEntity.badRequest().build()
        val username = currentUsername()
        val user = userRepository.findByUsername(username) ?: return ResponseEntity.notFound().build()
        val stored = user.faceTemplate ?: return ResponseEntity.badRequest().build()
        val ok = faceService.matches(stored, file.bytes)
        return if (ok) {
            user.faceVerified = true
            user.lastFaceVerifiedAt = Instant.now()
            userRepository.save(user)
            ResponseEntity.ok(FaceResponse(true, user.lastFaceVerifiedAt))
        } else {
            ResponseEntity.status(403).body(FaceResponse(false, user.lastFaceVerifiedAt))
        }
    }
}
