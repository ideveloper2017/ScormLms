package uz.scorm.lms.app.v1.face.service

import org.bytedeco.javacpp.indexer.FloatIndexer
import org.bytedeco.opencv.global.opencv_imgproc.INTER_AREA
import org.bytedeco.opencv.global.opencv_imgproc.resize
import org.bytedeco.opencv.opencv_core.Mat
import org.bytedeco.opencv.opencv_core.Size
import org.bytedeco.opencv.opencv_objdetect.FaceDetectorYN
import org.bytedeco.opencv.opencv_objdetect.FaceRecognizerSF
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.Paths
import java.security.MessageDigest

/**
 * Serverda yuz tanish: YuNet yuzni topadi, SFace tekislangan yuzdan 128 o'lchamli belgilar hosil qiladi.
 * Ikkalasi OpenCV Zoo'ning ochiq modellari (ONNX), mavjud OpenCV 4.9 kutubxonasi orqali ishlaydi.
 *
 * Modellar repozitoriyada saqlanmaydi (SFace ~37 MB): `app.face.model-dir` (FACE_MODEL_DIR) dan o'qiladi
 * va SHA-256 bilan tekshiriladi. Model yo'q yoki o'zgargan bo'lsa — FAIL-CLOSED: yuz ro'yxatdan o'tmaydi va
 * proktoring tekshiruvi o'tmaydi; hech qachon zaif usulga qaytib ketilmaydi.
 *
 * OpenCV DNN obyektlari parallel chaqiruvga xavfsiz emas — murojaatlar [lock] bilan ketma-ket.
 */
@Component
class SFaceRecognizer(
    @Value("\${app.face.model-dir:./private/face-models}") modelDir: String,
) {
    companion object {
        const val DETECTOR_FILE = "face_detection_yunet_2023mar.onnx"
        const val RECOGNIZER_FILE = "face_recognition_sface_2021dec.onnx"

        /** opencv_zoo (models/face_detection_yunet, models/face_recognition_sface) fayllarining SHA-256 qiymati. */
        val MODEL_SHA256 = mapOf(
            DETECTOR_FILE to "8f2383e4dd3cfbb4553ea8718107fc0423210dc964f9f4280604804ed2552fa4",
            RECOGNIZER_FILE to "0ba9fbfa01b5270c96627c4ef784da859931e02f04419c829e83484087c34e79",
        )

        /** Bir shaxs deb hisoblash uchun kosinus chegarasi — OpenCV SFace hujjatida tavsiya etilgan qiymat. */
        const val MATCH_THRESHOLD = 0.363

        private const val DETECTION_SCORE = 0.9f
        private const val NMS_THRESHOLD = 0.3f
        private const val TOP_K = 50

        /** Katta rasm (5 MB gacha) aniqlashni sekinlashtirmasin — uzun tomoni shu qiymatgacha kichraytiriladi. */
        private const val MAX_SIDE = 1280
    }

    data class Detection(val features: FloatArray, val centerX: Double)

    private val dir: Path = Paths.get(modelDir).toAbsolutePath().normalize()
    private val lock = Any()
    @Volatile private var models: Pair<FaceDetectorYN, FaceRecognizerSF>? = null

    /** Modellar ishga tayyormi; tayyor bo'lmasa sababi (monitoring/diagnostika uchun). */
    fun unavailableReason(): String? = runCatching { loadModels(); null }.getOrElse { it.message ?: "Yuz tanish modeli yuklanmadi" }

    /**
     * Rasmda (BGR) aynan bitta yuz bo'lishi shart. Yuzni tekislab SFace belgilarini va yuz markazining
     * gorizontal holatini (0..1) qaytaradi. Rasm hech qayerga yozilmaydi.
     */
    fun analyze(image: Mat): Detection = synchronized(lock) {
        val (detector, recognizer) = loadModels()
        val frame = downscaled(image)
        val faces = Mat()
        try {
            detector.setInputSize(Size(frame.cols(), frame.rows()))
            detector.detect(frame, faces)
            val count = if (faces.empty()) 0 else faces.rows()
            require(count > 0) { "Kadrda yuz topilmadi — yuzingiz to'liq va yorug' ko'rinsin" }
            require(count == 1) { "Kadrda aynan bitta yuz ko'rinishi kerak" }

            val box = faces.createIndexer<FloatIndexer>().use { idx -> FloatArray(4) { idx.get(0L, it.toLong()) } }
            require(box[2] > 0 && box[3] > 0) { "Aniqlangan yuz o'lchami yaroqsiz" }

            val aligned = Mat()
            val feature = Mat()
            try {
                recognizer.alignCrop(frame, faces.row(0), aligned)
                recognizer.feature(aligned, feature)
                val features = feature.createIndexer<FloatIndexer>().use { idx ->
                    FloatArray(FaceTemplate.DIMENSIONS) { idx.get(0L, it.toLong()) }
                }
                Detection(features, centerX = ((box[0] + box[2] / 2.0) / frame.cols()).coerceIn(0.0, 1.0))
            } finally {
                aligned.close()
                feature.close()
            }
        } finally {
            faces.close()
            if (frame !== image) frame.close()
        }
    }

    private fun downscaled(image: Mat): Mat {
        val longest = maxOf(image.cols(), image.rows())
        if (longest <= MAX_SIDE) return image
        val scale = MAX_SIDE.toDouble() / longest
        val out = Mat()
        resize(image, out, Size((image.cols() * scale).toInt(), (image.rows() * scale).toInt()), 0.0, 0.0, INTER_AREA)
        return out
    }

    private fun loadModels(): Pair<FaceDetectorYN, FaceRecognizerSF> {
        models?.let { return it }
        synchronized(lock) {
            models?.let { return it }
            val detectorPath = verified(DETECTOR_FILE)
            val recognizerPath = verified(RECOGNIZER_FILE)
            val detector = FaceDetectorYN.create(
                detectorPath.toString(), "", Size(320, 320), DETECTION_SCORE, NMS_THRESHOLD, TOP_K, 0, 0,
            )
            val recognizer = FaceRecognizerSF.create(recognizerPath.toString(), "")
            check(detector != null && !detector.isNull && recognizer != null && !recognizer.isNull) {
                "Yuz tanish modelini OpenCV yuklay olmadi"
            }
            return (detector to recognizer).also { models = it }
        }
    }

    private fun verified(name: String): Path {
        val path = dir.resolve(name)
        check(Files.isRegularFile(path)) {
            "Yuz tanish modeli topilmadi: $path — ops/face-models/install-face-models skriptini ishga tushiring (FACE_MODEL_DIR)"
        }
        val actual = MessageDigest.getInstance("SHA-256").let { digest ->
            Files.newInputStream(path).use { input ->
                val buffer = ByteArray(1 shl 16)
                while (true) {
                    val read = input.read(buffer)
                    if (read < 0) break
                    digest.update(buffer, 0, read)
                }
            }
            digest.digest().joinToString("") { "%02x".format(it) }
        }
        check(actual == MODEL_SHA256.getValue(name)) { "Yuz tanish modeli o'zgargan yoki buzilgan (SHA-256 mos emas): $path" }
        return path
    }
}
