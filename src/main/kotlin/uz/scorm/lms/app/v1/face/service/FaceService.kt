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
import org.opencv.core.MatOfByte
import org.opencv.imgcodecs.Imgcodecs.imdecode
import uz.scorm.lms.app.v1.user.repository.UserRepository
import uz.scorm.lms.app.v1.face.dto.*
import uz.scorm.lms.app.security.CurrentUser
import uz.scorm.lms.app.security.UserDetailsImpl
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
    @Value("\${file.upload-dir:./uploads}") private val uploadDir: String
) {

    private val targetSize = Size(160, 160)
    private val cascade: CascadeClassifier? = loadCascade()

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
        val face = extractAlignedFace(imageBytes) ?: return ""
        val data = FloatArray(face.arraySize().toInt())
        face.convertTo(face, CV_32F)
        (face.createBuffer() as java.nio.FloatBuffer).get(data)
        // L2 normalize
        var norm = 0.0
        for (f in data) norm += (f * f)
        norm = Math.sqrt(norm)
        val normalized = if (norm > 0) data.map { (it / norm).toFloat() } else data.asList()
        val bb = java.nio.ByteBuffer.allocate(normalized.size * 4)
        normalized.forEach { bb.putFloat(it) }
        return Base64.getEncoder().encodeToString(bb.array())
    }

    fun matches(storedTemplate: String, imageBytes: ByteArray, cosineThreshold: Double = 0.85): Boolean {
        if (storedTemplate.isBlank()) return false
        val probe = extractAlignedFace(imageBytes) ?: return false
        val probeVec = toNormalizedVector(probe)
        val refVec = decodeTemplate(storedTemplate)
        if (refVec.isEmpty() || probeVec.isEmpty()) return false
        val sim = cosineSimilarity(refVec, probeVec)
        return sim >= cosineThreshold
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
        val n = minOf(a.size, b.size)
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

    private fun extractAlignedFace(imageBytes: ByteArray): Mat? {
//        val matOfByte = Mat(1, imageBytes.size, CV_8U)
//        matOfByte.data().put(imageBytes.get(0))

        // Rasmni dekodlash
        val img = imdecode(Mat(BytePointer(imageBytes.toString())), IMREAD_COLOR)
        val gray = Mat()
        cvtColor(img, gray, COLOR_BGR2GRAY)
        equalizeHist(gray, gray)

        val faces = org.bytedeco.opencv.opencv_core.RectVector()
        cascade?.detectMultiScale(gray, faces)

        val faceRoi = if (faces.size() > 0) {
            var maxArea = 0.0
            var maxRect: Rect? = null
            for (i in 0 until faces.size()) {
                val r = faces[i]
                val area = r.width() * r.height()
                if (area > maxArea) {
                    maxArea = area.toDouble()
                    maxRect = r
                }
            }
            maxRect
        } else null

        val faceMat = if (faceRoi != null) Mat(gray, faceRoi) else centerCrop(gray)
        val resized = Mat()
        resize(faceMat, resized, targetSize)
        return resized
    }

    private fun centerCrop(gray: Mat): Mat {
        val w = gray.cols()
        val h = gray.rows()
        val size = minOf(w, h)
        val x = (w - size) / 2
        val y = (h - size) / 2
        return Mat(gray, Rect(x, y, size, size))
    }

    /**
     * Upload face photo for user
     * Stores photo file and generates face descriptor
     */
    @Transactional
    fun uploadFacePhoto(file: MultipartFile, userId: Long): FacePhotoResponse {
        val user = userRepository.findById(userId)
            .orElseThrow { IllegalArgumentException("User not found: $userId") }

        // Create uploads directory if it doesn't exist
        val facesDir = Paths.get(uploadDir, "faces")
        Files.createDirectories(facesDir)

        // Generate unique filename
        val extension = file.originalFilename?.substringAfterLast('.', "jpg") ?: "jpg"
        val filename = "${user.id}_${System.currentTimeMillis()}.$extension"
        val filePath = facesDir.resolve(filename)

        // Save file
        Files.write(filePath, file.bytes)

        // Generate face descriptor from uploaded image
        val descriptor = generateTemplate(file.bytes)

        // Update user entity
        user.facePhotoUrl = "/uploads/faces/$filename"
        user.faceDescriptor = descriptor
        user.faceUploadedAt = LocalDateTime.now()
        userRepository.save(user)

        return FacePhotoResponse(
            photoUrl = user.facePhotoUrl!!,
            uploadedAt = user.faceUploadedAt!!
        )
    }

    /**
     * Upload face photo from base64 string
     */
    @Transactional
    fun uploadFacePhotoBase64(request: FacePhotoUploadRequest, userId: Long): FacePhotoResponse {
        val user = userRepository.findById(userId)
            .orElseThrow { IllegalArgumentException("User not found: $userId") }

        // Decode base64 image
        val imageBytes = try {
            val base64Data = request.photo.substringAfter("base64,", request.photo)
            Base64.getDecoder().decode(base64Data)
        } catch (e: Exception) {
            throw IllegalArgumentException("Invalid base64 image data: ${e.message}")
        }

        // Create uploads directory
        val facesDir = Paths.get(uploadDir, "faces")
        Files.createDirectories(facesDir)

        // Generate unique filename
        val filename = "${user.id}_${System.currentTimeMillis()}.jpg"
        val filePath = facesDir.resolve(filename)

        // Save file
        Files.write(filePath, imageBytes)

        // Generate face descriptor
        val descriptor = generateTemplate(imageBytes)

        // Update user entity
        user.facePhotoUrl = "/uploads/faces/$filename"
        user.faceDescriptor = descriptor
        user.faceUploadedAt = LocalDateTime.now()
        userRepository.save(user)

        return FacePhotoResponse(
            photoUrl = user.facePhotoUrl!!,
            uploadedAt = user.faceUploadedAt!!
        )
    }

    /**
     * Get user's face photo URL
     */
    fun getFacePhotoUrl(userId: Long): FacePhotoResponse? {
        val user = userRepository.findById(userId)
            .orElseThrow { IllegalArgumentException("User not found: $userId") }

        return if (user.facePhotoUrl != null && user.faceUploadedAt != null) {
            FacePhotoResponse(
                photoUrl = user.facePhotoUrl!!,
                uploadedAt = user.faceUploadedAt!!
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
        val user = userRepository.findById(userId)
            .orElseThrow { IllegalArgumentException("User not found: $userId") }

        // Delete photo file if it exists
        if (user.facePhotoUrl != null) {
            try {
                val photoPath = user.facePhotoUrl!!.removePrefix("/")
                val file = Paths.get(uploadDir).parent.resolve(photoPath)
                Files.deleteIfExists(file)
            } catch (e: Exception) {
                // Log error but continue with database cleanup
                println("Warning: Could not delete face photo file: ${e.message}")
            }
        }

        // Clear user face data
        user.facePhotoUrl = null
        user.faceDescriptor = null
        user.faceUploadedAt = null
        userRepository.save(user)
    }
}
