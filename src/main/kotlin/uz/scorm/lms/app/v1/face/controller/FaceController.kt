package uz.scorm.lms.app.v1.face.controller

import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile
import uz.scorm.lms.app.common.ApiResponse
import uz.scorm.lms.app.security.UserDetailsImpl
import uz.scorm.lms.app.v1.face.dto.*
import uz.scorm.lms.app.v1.face.service.FaceService

/**
 * Face Recognition Controller
 * Handles face photo upload, retrieval, verification, and deletion
 * 
 * Endpoints:
 * - POST /api/v1/users/face/upload - Upload face photo (multipart or JSON)
 * - GET /api/v1/users/face/photo - Get face photo URL
 * - POST /api/v1/users/face/verify - Verify face match
 * - DELETE /api/v1/users/face/photo - Delete face photo
 */
@RestController
@RequestMapping("/api/v1/users/face")
class FaceController(
    private val faceService: FaceService
) {

    /**
     * Upload face photo (multipart file upload)
     * POST /api/v1/users/face/upload
     * 
     * Accepts multipart/form-data with 'photo' field
     */
    @PostMapping("/upload", consumes = ["multipart/form-data"])
    fun uploadFacePhotoMultipart(
        @RequestParam("photo") file: MultipartFile,
        @RequestParam(required = false) userId: Long?,
        @AuthenticationPrincipal currentUser: UserDetailsImpl
    ): ResponseEntity<ApiResponse<FacePhotoResponse>> {
        val targetUserId = userId ?: (currentUser.getId()
            ?: return ResponseEntity.badRequest().body(ApiResponse.error("User ID not found")))
        
        // Validate file
        if (file.isEmpty) {
            return ResponseEntity.badRequest().body(
                ApiResponse.error("File is empty")
            )
        }

        // Validate file type
        val contentType = file.contentType
        if (contentType == null || !contentType.startsWith("image/")) {
            return ResponseEntity.badRequest().body(
                ApiResponse.error("File must be an image")
            )
        }

        val result = faceService.uploadFacePhoto(file, targetUserId)
        return ResponseEntity.ok(ApiResponse.success("Face photo uploaded successfully", result))
    }

    /**
     * Upload face photo (base64 JSON upload)
     * POST /api/v1/users/face/upload
     * 
     * Accepts application/json with base64 encoded image
     */
    @PostMapping("/upload", consumes = ["application/json"])
    fun uploadFacePhotoJson(
        @RequestBody request: FacePhotoUploadRequest,
        @AuthenticationPrincipal currentUser: UserDetailsImpl
    ): ResponseEntity<ApiResponse<FacePhotoResponse>> {
        val targetUserId = request.userId ?: (currentUser.getId()
            ?: return ResponseEntity.badRequest().body(ApiResponse.error("User ID not found")))

        val result = faceService.uploadFacePhotoBase64(request, targetUserId)
        return ResponseEntity.ok(ApiResponse.success("Face photo uploaded successfully", result))
    }

    /**
     * Get user's face photo URL
     * GET /api/v1/users/face/photo
     * 
     * Returns face photo URL and upload timestamp, or 404 if not found
     */
    @GetMapping("/photo")
    fun getFacePhoto(
        @RequestParam(required = false) userId: Long?,
        @AuthenticationPrincipal currentUser: UserDetailsImpl
    ): ResponseEntity<ApiResponse<FacePhotoResponse>> {
        val targetUserId = userId ?: (currentUser.getId()
            ?: return ResponseEntity.badRequest().body(ApiResponse.error("User ID not found")))

        val result = faceService.getFacePhotoUrl(targetUserId)
        
        return if (result != null) {
            ResponseEntity.ok(ApiResponse.success("Face photo retrieved", result))
        } else {
            ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error("No face photo found for user"))
        }
    }

    /**
     * Verify face match
     * POST /api/v1/users/face/verify
     * 
     * Compares provided face descriptor with stored descriptor
     */
    @PostMapping("/verify")
    fun verifyFace(
        @RequestBody request: FaceVerificationRequest,
        @AuthenticationPrincipal currentUser: UserDetailsImpl
    ): ResponseEntity<ApiResponse<FaceVerificationResponse>> {
        val targetUserId = request.userId ?: (currentUser.getId()
            ?: return ResponseEntity.badRequest().body(ApiResponse.error("User ID not found")))

        val result = faceService.verifyFaceMatch(request, targetUserId)
        return ResponseEntity.ok(ApiResponse.success("Face verification completed", result))
    }

    /**
     * Delete user's face photo and descriptor
     * DELETE /api/v1/users/face/photo
     * 
     * Removes face photo file and clears database fields
     */
    @DeleteMapping("/photo")
    fun deleteFacePhoto(
        @RequestParam(required = false) userId: Long?,
        @AuthenticationPrincipal currentUser: UserDetailsImpl
    ): ResponseEntity<ApiResponse<Unit>> {
        val targetUserId = userId ?: (currentUser.getId()
            ?: return ResponseEntity.badRequest().body(ApiResponse.error("User ID not found")))

        faceService.deleteFacePhoto(targetUserId)
        return ResponseEntity.ok(ApiResponse.success("Face photo deleted successfully"))
    }

    // Legacy endpoints for backward compatibility (return 501)
    @PostMapping("/register")
    fun register(@RequestParam("file") file: MultipartFile): ResponseEntity<Unit> =
        ResponseEntity.status(501).build()

    @PostMapping("/verify-legacy")
    fun verifyLegacy(@RequestParam("file") file: MultipartFile): ResponseEntity<Unit> =
        ResponseEntity.status(501).build()
}
