package uz.scorm.lms.app.v1.face.controller

import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.AccessDeniedException
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.multipart.MultipartFile
import uz.scorm.lms.app.common.ApiResponse
import uz.scorm.lms.app.security.CurrentUser
import uz.scorm.lms.app.v1.face.dto.FacePhotoResponse
import uz.scorm.lms.app.v1.face.dto.FacePhotoUploadRequest
import uz.scorm.lms.app.v1.face.dto.FaceVerificationRequest
import uz.scorm.lms.app.v1.face.dto.FaceVerificationResponse
import uz.scorm.lms.app.v1.face.service.FaceService
import uz.scorm.lms.app.v1.user.model.User

@RestController
@RequestMapping("/api/v1/users/face")
class FaceController(private val faceService: FaceService) {

    @PostMapping("/upload", consumes = ["multipart/form-data"])
    fun uploadFacePhotoMultipart(
        @RequestParam("photo") file: MultipartFile,
        @RequestParam(required = false) userId: Long?,
        @CurrentUser currentUser: User,
        authentication: Authentication,
    ): ResponseEntity<ApiResponse<FacePhotoResponse>> {
        require(!file.isEmpty) { "Fayl bo'sh" }
        require(file.contentType?.startsWith("image/") == true) { "Fayl rasm formatida bo'lishi kerak" }
        val result = faceService.uploadFacePhoto(file, targetUserId(userId, currentUser, authentication))
        return ResponseEntity.ok(ApiResponse.success("Yuz rasmi yuklandi", result))
    }

    @PostMapping("/upload", consumes = ["application/json"])
    fun uploadFacePhotoJson(
        @RequestBody request: FacePhotoUploadRequest,
        @CurrentUser currentUser: User,
        authentication: Authentication,
    ): ResponseEntity<ApiResponse<FacePhotoResponse>> {
        val result = faceService.uploadFacePhotoBase64(request, targetUserId(request.userId, currentUser, authentication))
        return ResponseEntity.ok(ApiResponse.success("Yuz rasmi yuklandi", result))
    }

    @GetMapping("/photo")
    fun getFacePhoto(
        @RequestParam(required = false) userId: Long?,
        @CurrentUser currentUser: User,
        authentication: Authentication,
    ): ResponseEntity<ApiResponse<FacePhotoResponse>> {
        val result = faceService.getFacePhotoUrl(targetUserId(userId, currentUser, authentication))
        return if (result != null) ResponseEntity.ok(ApiResponse.success("Yuz rasmi olindi", result))
        else ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Yuz rasmi topilmadi"))
    }

    @PostMapping("/verify")
    fun verifyFace(
        @RequestBody request: FaceVerificationRequest,
        @CurrentUser currentUser: User,
        authentication: Authentication,
    ): ResponseEntity<ApiResponse<FaceVerificationResponse>> {
        val result = faceService.verifyFaceMatch(request, targetUserId(request.userId, currentUser, authentication))
        return ResponseEntity.ok(ApiResponse.success("Yuz verifikatsiyasi yakunlandi", result))
    }

    @DeleteMapping("/photo")
    fun deleteFacePhoto(
        @RequestParam(required = false) userId: Long?,
        @CurrentUser currentUser: User,
        authentication: Authentication,
    ): ResponseEntity<ApiResponse<Unit>> {
        faceService.deleteFacePhoto(targetUserId(userId, currentUser, authentication))
        return ResponseEntity.ok(ApiResponse.success("Yuz rasmi o'chirildi"))
    }

    private fun targetUserId(requestedId: Long?, currentUser: User, authentication: Authentication): Long {
        val ownId = requireNotNull(currentUser.id) { "Joriy foydalanuvchi ID si topilmadi" }
        val target = requestedId ?: ownId
        val mayManageUsers = authentication.authorities.any { it.authority in setOf("USER_MANAGE", "SYSTEM_ADMIN") }
        if (target != ownId && !mayManageUsers) throw AccessDeniedException("Boshqa foydalanuvchining biometrik ma'lumotiga kirish taqiqlangan")
        return target
    }

    @PostMapping("/register")
    fun register(@RequestParam("file") file: MultipartFile): ResponseEntity<Unit> = ResponseEntity.status(501).build()

    @PostMapping("/verify-legacy")
    fun verifyLegacy(@RequestParam("file") file: MultipartFile): ResponseEntity<Unit> = ResponseEntity.status(501).build()
}
