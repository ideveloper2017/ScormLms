package uz.scorm.lms.app.v1.face.service

import org.bytedeco.javacpp.BytePointer
import org.springframework.core.io.ClassPathResource
import org.springframework.stereotype.Service
import org.bytedeco.opencv.global.opencv_core.*
import org.bytedeco.opencv.global.opencv_imgcodecs.*
import org.bytedeco.opencv.global.opencv_imgproc.*
import org.bytedeco.opencv.opencv_core.*
import org.bytedeco.opencv.opencv_objdetect.CascadeClassifier
import org.opencv.core.MatOfByte
import org.opencv.imgcodecs.Imgcodecs.imdecode
import java.io.File
import java.io.FileOutputStream
import java.util.*

@Service
class FaceService {

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
}
