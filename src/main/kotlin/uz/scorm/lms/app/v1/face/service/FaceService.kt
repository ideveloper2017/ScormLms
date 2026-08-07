package uz.scorm.lms.app.v1.face.service

import org.bytedeco.javacpp.BytePointer
import org.springframework.core.io.ClassPathResource
import org.springframework.stereotype.Service
import org.springframework.web.multipart.MultipartFile
import org.bytedeco.opencv.global.opencv_core.*
import org.bytedeco.opencv.global.opencv_imgcodecs.*
import org.bytedeco.opencv.global.opencv_imgproc.*
import org.bytedeco.opencv.opencv_core.*
import org.bytedeco.opencv.opencv_objdetect.CascadeClassifier
import uz.scorm.lms.app.v1.user.repository.UserRepository
import uz.scorm.lms.app.v1.face.dto.*
import uz.scorm.lms.app.v1.biometric.service.BiometricDataErasureService
import uz.scorm.lms.app.v1.biometric.service.BiometricGovernanceService
import org.springframework.beans.factory.annotation.Value
import org.springframework.transaction.annotation.Transactional
import java.io.File
import java.io.FileOutputStream
import java.nio.file.Files
import java.nio.file.Paths
import java.time.LocalDateTime
import java.util.*

@Service
class FaceService(
    private val userRepository: UserRepository,
    private val biometricGovernanceService: BiometricGovernanceService,
    private val biometricDataErasureService: BiometricDataErasureService,
    @Value("\${file.upload-dir:./uploads}") private val uploadDir: String
) {

    // OpenCV native kutubxonasi konstruktorda emas, birinchi ishlatishda yuklanadi.
    // Shunda native yuklanmasa ham ilova ko'tariladi (faqat face funksiyasi ishlamaydi),
    // bean yaratilishida "Constructor threw exception" bilan yiqilmaydi.
    private val targetSize by lazy { Size(160, 160) }
    private val cascade: CascadeClassifier? by lazy { loadCascade() }

    private fun loadCascade(): CascadeClassifier? {
        return try {
            val res = ClassPathResource("/model/haarcascade_frontalface_default.xml")
            if (!res.exists()) return null
            val tmp = File.createTempFile("haarcascade_frontalface_default", ".xml")
            res.inputStream.use { input ->
                FileOutputStream(tmp).use { out -> input.copyTo(out) }
            }
            CascadeClassifier(tmp.absolutePath)
        } catch (e: Exception) {
            null
        }
    }

    fun generateTemplate(imageBytes: ByteArray): String {
        return analyzeFrame(imageBytes).template
    }

    fun matches(storedTemplate: String, imageBytes: ByteArray, cosineThreshold: Double = 0.85): Boolean {
        if (storedTemplate.isBlank()) return false
        return templateSimilarity(storedTemplate, analyzeFrame(imageBytes).template) >= cosineThreshold
    }

    /**
     * Decodes the image and requires exactly one server-detected face. The raw
     * frame is never persisted by this method.
     */
    fun analyzeFrame(imageBytes: ByteArray): FaceFrameAnalysis {
        require(imageBytes.isNotEmpty()) { "Yuz kadri bo'sh" }
        val decoded = decodeImage(imageBytes)
        val gray = Mat()
        cvtColor(decoded, gray, COLOR_BGR2GRAY)
        equalizeHist(gray, gray)

        val classifier = cascade ?: throw IllegalStateException("Yuz aniqlash modeli yuklanmagan")
        val faces = RectVector()
        classifier.detectMultiScale(gray, faces)
        require(faces.size() == 1L) { "Kadrda aynan bitta yuz ko'rinishi kerak" }

        val rect = faces[0]
        require(rect.width() > 0 && rect.height() > 0) { "Aniqlangan yuz o'lchami yaroqsiz" }
        val face = Mat(gray, rect)
        val resized = Mat()
        resize(face, resized, targetSize)
        val vector = toNormalizedVector(resized)
        require(vector.isNotEmpty()) { "Yuz shablonini yaratib bo'lmadi" }
        return FaceFrameAnalysis(
            template = encodeTemplate(vector),
            centerX = (rect.x() + rect.width() / 2.0) / decoded.cols().toDouble(),
        )
    }

    fun templateSimilarity(firstTemplate: String, secondTemplate: String): Double {
        val first = decodeTemplate(firstTemplate)
        val second = decodeTemplate(secondTemplate)
        if (first.isEmpty() || second.isEmpty() || first.size != second.size) return 0.0
        return cosineSimilarity(first, second)
    }

    private fun encodeTemplate(values: FloatArray): String {
        val buffer = java.nio.ByteBuffer.allocate(values.size * 4)
        values.forEach(buffer::putFloat)
        return Base64.getEncoder().encodeToString(buffer.array())
    }

    private fun toNormalizedVector(mat: Mat): FloatArray {
        val fmat = Mat()
        mat.convertTo(fmat, CV_32F)
        val total = fmat.arraySize().toInt()
        val arr = FloatArray(total)
        (fmat.createBuffer() as java.nio.FloatBuffer).get(arr)
        var norm = 0.0
        for (f in arr) norm += (f * f)
        norm = Math.sqrt(norm)
        if (norm > 0) {
            for (i in arr.indices) arr[i] = (arr[i] / norm).toFloat()
        }
        return arr
    }

    private fun decodeTemplate(b64: String): FloatArray {
        return try {
            val bytes = Base64.getDecoder().decode(b64)
            val fb = java.nio.ByteBuffer.wrap(bytes).asFloatBuffer()
            val arr = FloatArray(fb.remaining())
            fb.get(arr)
            arr
        } catch (_: Exception) {
            FloatArray(0)
        }
    }

    private fun cosineSimilarity(a: FloatArray, b: FloatArray): Double {
        if (a.size != b.size) return 0.0
        val n = a.size
        var dot = 0.0
        var na = 0.0
        var nb = 0.0
        var i = 0
        while (i < n) {
            dot += (a[i] * b[i])
            na += (a[i] * a[i])
            nb += (b[i] * b[i])
            i++
        }
        if (na == 0.0 || nb == 0.0) return 0.0
        return dot / (Math.sqrt(na) * Math.sqrt(nb))
    }

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
     * Verify face match using descriptor comparison
     * 
     * Note: This accepts face descriptor from frontend (face-api.js)
     * which is already a 128-dimensional normalized vector
     */
    fun verifyFaceMatch(request: FaceVerificationRequest, userId: Long): FaceVerificationResponse {
        val user = userRepository.findById(userId)
            .orElseThrow { IllegalArgumentException("User not found: $userId") }
        val binding = biometricGovernanceService.requireActiveConsent(userId)
        biometricGovernanceService.requireActiveFaceTemplate(user, binding)

        if (user.faceDescriptor.isNullOrBlank()) {
            return FaceVerificationResponse(
                isMatch = false,
                similarity = 0.0,
                threshold = 0.6,
                message = "No face template stored for user"
            )
        }

        // Validate descriptor size (face-api.js produces 128-dimensional descriptors)
        if (request.faceDescriptor.size != 128) {
            throw IllegalArgumentException("Invalid face descriptor: expected 128 dimensions, got ${request.faceDescriptor.size}")
        }

        // Convert stored descriptor (base64 string) to float array
        val storedDescriptor = decodeTemplate(user.faceDescriptor!!)
        
        if (storedDescriptor.isEmpty()) {
            return FaceVerificationResponse(
                isMatch = false,
                similarity = 0.0,
                threshold = 0.6,
                message = "Invalid stored face template"
            )
        }

        // Convert request descriptor to float array
        val providedDescriptor = request.faceDescriptor.map { it.toFloat() }.toFloatArray()

        // Calculate cosine similarity
        val similarity = cosineSimilarity(storedDescriptor, providedDescriptor)
        val threshold = 0.6 // Standard threshold for face-api.js descriptors

        return FaceVerificationResponse(
            isMatch = similarity >= threshold,
            similarity = similarity,
            threshold = threshold,
            message = if (similarity >= threshold) "Face matched successfully" else "Face did not match"
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
