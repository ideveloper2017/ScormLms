package uz.scorm.lms.app.v1.face.dto

import java.time.LocalDateTime
import java.time.Instant

/**
 * Face photo response DTO
 * Contains face photo URL and upload timestamp
 */
data class FacePhotoResponse(
    val photoUrl: String,
    val uploadedAt: LocalDateTime,
    val policyVersion: String,
    val expiresAt: Instant,
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
 * Yuzni tekshirish so'rovi: kamera kadri (base64, `data:image/jpeg;base64,...` ham bo'ladi).
 * Shablon serverda hisoblanadi; [faceDescriptor] eski mijozlar uchun qoldirilgan va QABUL QILINMAYDI.
 */
data class FaceVerificationRequest(
    val photo: String? = null,
    @Deprecated("Brauzer hisoblagan deskriptorga ishonilmaydi — photo yuboring")
    val faceDescriptor: List<Double>? = null,
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
