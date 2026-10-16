package uz.scorm.lms.app.v1.face.service

import org.bytedeco.javacpp.BytePointer
import org.springframework.stereotype.Service
import org.springframework.web.multipart.MultipartFile
import org.bytedeco.opencv.global.opencv_core.CV_8UC1
import org.bytedeco.opencv.global.opencv_imgcodecs.IMREAD_COLOR
import org.bytedeco.opencv.global.opencv_imgcodecs.imdecode
import org.bytedeco.opencv.opencv_core.Mat
import uz.scorm.lms.app.v1.user.repository.UserRepository
import uz.scorm.lms.app.v1.face.dto.*
import uz.scorm.lms.app.v1.biometric.service.BiometricDataErasureService
import uz.scorm.lms.app.v1.biometric.service.BiometricGovernanceService
import org.springframework.beans.factory.annotation.Value
import org.springframework.transaction.annotation.Transactional
import java.nio.file.Files
import java.nio.file.Paths
import java.time.LocalDateTime
import java.util.*

@Service
class FaceService(
    private val userRepository: UserRepository,
    private val biometricGovernanceService: BiometricGovernanceService,
    private val biometricDataErasureService: BiometricDataErasureService,
    private val recognizer: SFaceRecognizer,
    @Value("\${file.upload-dir:./uploads}") private val uploadDir: String
) {

    /** Bir shaxs deb hisoblash chegarasi (SFace kosinus o'xshashligi). */
    val matchThreshold: Double get() = SFaceRecognizer.MATCH_THRESHOLD

    fun generateTemplate(imageBytes: ByteArray): String {
        return analyzeFrame(imageBytes).template
    }

    /**
     * Rasmni serverda tahlil qiladi: aynan bitta yuz (YuNet) va uning SFace shabloni. Xom kadr
     * hech qayerga yozilmaydi. Model o'rnatilmagan bo'lsa IllegalStateException (fail-closed).
     */
    fun analyzeFrame(imageBytes: ByteArray): FaceFrameAnalysis {
        require(imageBytes.isNotEmpty()) { "Yuz kadri bo'sh" }
        val decoded = decodeImage(imageBytes)
        try {
            val detection = recognizer.analyze(decoded)
            return FaceFrameAnalysis(template = FaceTemplate.encode(detection.features), centerX = detection.centerX)
        } finally {
            decoded.close()
        }
    }

    /** Ikki shablon o'xshashligi; eski (piksel) formatdagi shablon hech qachon mos kelmaydi. */
    fun templateSimilarity(firstTemplate: String, secondTemplate: String): Double =
        FaceTemplate.similarity(firstTemplate, secondTemplate)

    private fun decodeImage(imageBytes: ByteArray): Mat {
        val pointer = BytePointer(*imageBytes)
        try {
            val encoded = Mat(1, imageBytes.size, CV_8UC1, pointer)
            val decoded = imdecode(encoded, IMREAD_COLOR)
            require(!decoded.isNull && decoded.cols() > 0 && decoded.rows() > 0) { "Rasm formati yaroqsiz" }
            return decoded
        } finally {
            pointer.close()
        }
    }

    /**
     * Upload face photo for user
     * Stores photo file and generates face descriptor
     */
    @Transactional
    fun uploadFacePhoto(file: MultipartFile, userId: Long): FacePhotoResponse {
        require(file.size in 1..MAX_STORED_FACE_BYTES) { "Yuz rasmi 5 MB dan oshmasligi kerak" }
        return storeFacePhoto(file.bytes, userId, extensionFor(file.contentType))
    }

    /**
     * Upload face photo from base64 string
     */
    @Transactional
    fun uploadFacePhotoBase64(request: FacePhotoUploadRequest, userId: Long): FacePhotoResponse {
        val imageBytes = try {
            val base64Data = request.photo.substringAfter("base64,", request.photo)
            Base64.getDecoder().decode(base64Data)
        } catch (e: Exception) {
            throw IllegalArgumentException("Invalid base64 image data: ${e.message}")
        }
        require(imageBytes.size in 1..MAX_STORED_FACE_BYTES.toInt()) { "Yuz rasmi 5 MB dan oshmasligi kerak" }
        val extension = when {
            request.photo.startsWith("data:image/png") -> "png"
            request.photo.startsWith("data:image/webp") -> "webp"
            else -> "jpg"
        }
        return storeFacePhoto(imageBytes, userId, extension)
    }

    /**
     * Get user's face photo URL
     */
    fun getFacePhotoUrl(userId: Long): FacePhotoResponse? {
        val user = userRepository.findById(userId)
            .orElseThrow { IllegalArgumentException("User not found: $userId") }
        val binding = biometricGovernanceService.requireActiveConsent(userId)
        return if (user.facePhotoUrl != null && user.faceUploadedAt != null && user.faceExpiresAt != null &&
            user.facePolicy?.id == binding.policy.id && user.faceConsentEvent?.id == binding.consent.id &&
            user.faceExpiresAt!!.isAfter(java.time.Instant.now())) {
            FacePhotoResponse(
                photoUrl = user.facePhotoUrl!!,
                uploadedAt = user.faceUploadedAt!!,
                policyVersion = binding.policy.versionCode,
                expiresAt = user.faceExpiresAt!!,
            )
        } else {
            null
        }
    }

    /**
     * Yuzni SERVERDA tekshiradi: brauzer kamera kadrini (base64) yuboradi, shablon shu yerda hisoblanadi.
     *
     * Avval brauzer o'zi hisoblagan deskriptor qabul qilinardi — uni soxtalashtirish oson edi (va saqlangan
     * piksel shablon bilan o'lchami ham mos kelmasdi). Endi faqat kadr qabul qilinadi.
     */
    fun verifyFaceMatch(request: FaceVerificationRequest, userId: Long): FaceVerificationResponse {
        val user = userRepository.findById(userId)
            .orElseThrow { IllegalArgumentException("User not found: $userId") }
        val binding = biometricGovernanceService.requireActiveConsent(userId)
        biometricGovernanceService.requireActiveFaceTemplate(user, binding)

        val photo = request.photo?.takeIf { it.isNotBlank() }
            ?: throw IllegalArgumentException("Yuzni tekshirish uchun kamera kadrini yuboring; brauzer hisoblagan deskriptor qabul qilinmaydi")
        val imageBytes = try {
            Base64.getDecoder().decode(photo.substringAfter("base64,", photo))
        } catch (e: IllegalArgumentException) {
            throw IllegalArgumentException("Kadr base64 formati yaroqsiz")
        }
        require(imageBytes.size in 1..MAX_STORED_FACE_BYTES.toInt()) { "Kadr 5 MB dan oshmasligi kerak" }

        val similarity = templateSimilarity(user.faceDescriptor.orEmpty(), analyzeFrame(imageBytes).template)
        val matched = similarity >= matchThreshold
        return FaceVerificationResponse(
            isMatch = matched,
            similarity = similarity,
            threshold = matchThreshold,
            message = if (matched) "Yuz tasdiqlandi" else "Yuz ro'yxatdan o'tgan foydalanuvchiga mos kelmadi",
        )
    }

    /**
     * Delete user's face photo and descriptor
     */
    @Transactional
    fun deleteFacePhoto(userId: Long) {
        biometricDataErasureService.eraseFaceTemplate(userId, "USER_REQUESTED_TEMPLATE_DELETION", userId)
    }

    private fun storeFacePhoto(imageBytes: ByteArray, userId: Long, extension: String): FacePhotoResponse {
        val binding = biometricGovernanceService.requireActiveConsent(userId)
        val descriptor = generateTemplate(imageBytes)
        biometricDataErasureService.eraseFaceTemplate(userId, "FACE_TEMPLATE_REPLACED", userId)
        val user = userRepository.findById(userId).orElseThrow { IllegalArgumentException("User not found: $userId") }
        val facesDir = Paths.get(uploadDir, "faces").toAbsolutePath().normalize()
        Files.createDirectories(facesDir)
        val filename = "${user.id}_${System.currentTimeMillis()}.$extension"
        val filePath = facesDir.resolve(filename).normalize()
        require(filePath.startsWith(facesDir)) { "Yuz rasmi saqlash yo'li yaroqsiz" }
        Files.write(filePath, imageBytes)
        val uploadedAt = LocalDateTime.now()
        val expiresAt = java.time.Instant.now().plus(java.time.Duration.ofDays(binding.policy.faceTemplateRetentionDays.toLong()))
        user.facePhotoUrl = "/uploads/faces/$filename"
        user.faceDescriptor = descriptor
        user.faceUploadedAt = uploadedAt
        user.facePolicy = binding.policy
        user.faceConsentEvent = binding.consent
        user.faceExpiresAt = expiresAt
        userRepository.save(user)
        return FacePhotoResponse(user.facePhotoUrl!!, uploadedAt, binding.policy.versionCode, expiresAt)
    }

    private fun extensionFor(contentType: String?) = when (contentType) {
        "image/png" -> "png"
        "image/webp" -> "webp"
        else -> "jpg"
    }

    companion object { private const val MAX_STORED_FACE_BYTES = 5L * 1024 * 1024 }
}

data class FaceFrameAnalysis(
    val template: String,
    val centerX: Double,
)
