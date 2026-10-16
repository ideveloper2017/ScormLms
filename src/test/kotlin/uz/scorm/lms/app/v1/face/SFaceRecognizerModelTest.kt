package uz.scorm.lms.app.v1.face

import org.bytedeco.javacpp.BytePointer
import org.bytedeco.opencv.global.opencv_core.CV_8UC1
import org.bytedeco.opencv.global.opencv_core.flip
import org.bytedeco.opencv.global.opencv_imgcodecs.IMREAD_COLOR
import org.bytedeco.opencv.global.opencv_imgcodecs.imdecode
import org.bytedeco.opencv.global.opencv_imgproc.resize
import org.bytedeco.opencv.opencv_core.Mat
import org.bytedeco.opencv.opencv_core.Size
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Assumptions.assumeTrue
import org.junit.jupiter.api.Test
import uz.scorm.lms.app.v1.face.service.FaceTemplate
import uz.scorm.lms.app.v1.face.service.SFaceRecognizer
import java.io.File

/**
 * HAQIQIY modellar bilan tekshiruv. Modellar (~39 MB) va namuna rasmlar repozitoriyada yo'q, shuning
 * uchun test faqat ular berilganda ishlaydi, aks holda o'tkazib yuboriladi:
 *
 *   FACE_MODEL_DIR=<install-face-models chiqishi>   FACE_SAMPLE_DIR=<a.jpg (A shaxs), b.jpg (B shaxs)>
 *
 * Bir shaxsning o'zgartirilgan kadri (aks, kichraytirish, yorqinlik) mos kelishi, boshqa shaxs esa
 * mos kelmasligi kerak.
 */
class SFaceRecognizerModelTest {
    private val modelDir = System.getenv("FACE_MODEL_DIR")
    private val sampleDir = System.getenv("FACE_SAMPLE_DIR")

    private fun image(name: String): Mat {
        val bytes = File(sampleDir, name).readBytes()
        val pointer = BytePointer(*bytes)
        return imdecode(Mat(1, bytes.size, CV_8UC1, pointer), IMREAD_COLOR)
    }

    @Test
    fun `bir shaxs mos keladi, boshqa shaxs SFace chegarasidan past`() {
        assumeTrue(modelDir != null && File(modelDir, SFaceRecognizer.RECOGNIZER_FILE).isFile, "FACE_MODEL_DIR berilmagan")
        assumeTrue(sampleDir != null && File(sampleDir, "a.jpg").isFile && File(sampleDir, "b.jpg").isFile, "FACE_SAMPLE_DIR berilmagan")
        val recognizer = SFaceRecognizer(modelDir)

        val personA = image("a.jpg")
        val personB = image("b.jpg")
        // A shaxsning boshqa kadri: ko'zgu aksi + kichraytirilgan + yorqinligi oshirilgan.
        val flipped = Mat().also { flip(personA, it, 1) }
        val small = Mat().also { resize(flipped, it, Size(personA.cols() * 3 / 4, personA.rows() * 3 / 4)) }
        val variantA = Mat().also { small.convertTo(it, -1, 1.1, 10.0) }

        fun features(label: String, mat: Mat) = runCatching { recognizer.analyze(mat).features }
            .getOrElse { throw AssertionError("$label (${mat.cols()}x${mat.rows()}): ${it.message}", it) }
        val a = features("a.jpg", personA)
        val a2 = features("a.jpg varianti", variantA)
        val b = features("b.jpg", personB)

        val same = FaceTemplate.cosine(a, a2)
        val different = FaceTemplate.cosine(a, b)
        println("SFace: bir shaxs=%.3f, boshqa shaxs=%.3f, chegara=%.3f".format(same, different, SFaceRecognizer.MATCH_THRESHOLD))

        assertTrue(same >= SFaceRecognizer.MATCH_THRESHOLD, "bir shaxs mos kelishi kerak: $same")
        assertTrue(different < SFaceRecognizer.MATCH_THRESHOLD, "boshqa shaxs mos kelmasligi kerak: $different")
    }
}
