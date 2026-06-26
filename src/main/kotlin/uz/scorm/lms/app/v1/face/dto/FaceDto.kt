package uz.scorm.lms.app.v1.face.dto

import java.time.LocalDateTime

/**
 * Face photo response DTO
 * Contains face photo URL and upload timestamp
 */
data class FacePhotoResponse(
    val photoUrl: String,
    val uploadedAt: LocalDateTime
)

/**
 * Face photo upload request DTO
 * Supports base64 encoded image data
 */
data class FacePhotoUploadRequest(
    val photo: String, // base64 encoded image data
    val userId: Long? = null
)

/**
 * Face verification request DTO
 * Contains 128-dimensional face descriptor array
 */
data class FaceVerificationRequest(
    val faceDescriptor: List<Double>, // 128-dimensional face descriptor
    val userId: Long? = null
)

/**
 * Face verification response DTO
 * Contains match result and similarity score
 */
data class FaceVerificationResponse(
    val isMatch: Boolean,
    val similarity: Double, // 0-1 similarity score
    val threshold: Double, // Threshold used for matching
    val message: String? = null
)
