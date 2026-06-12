package uz.scorm.lms.app.v1.face.controller

import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile

@RestController
@RequestMapping("/api/v1/face")
class FaceController {

    @PostMapping("/register")
    fun register(@RequestParam("file") file: MultipartFile): ResponseEntity<Void> =
        ResponseEntity.status(501).build()

    @PostMapping("/verify")
    fun verify(@RequestParam("file") file: MultipartFile): ResponseEntity<Void> =
        ResponseEntity.status(501).build()
}
