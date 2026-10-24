package uz.scorm.lms.app.v1.face

import org.bytedeco.javacpp.Loader
import org.bytedeco.opencv.global.opencv_imgproc.INTER_AREA
import org.bytedeco.opencv.global.opencv_imgproc.resize
import org.bytedeco.opencv.opencv_core.Mat
import org.bytedeco.opencv.opencv_core.Size
import org.bytedeco.opencv.opencv_objdetect.FaceRecognizerSF
import kotlin.test.Test
import kotlin.test.assertEquals

/**
 * build.gradle OpenCV natives'ni faqat deploy platformasi (va lokal host) uchun qo'shadi.
 * CI linux-x86_64 da ishlaydi, shuning uchun bu test WAR'ga kiradigan natives
 * yuklanishini va yuz tanish ishlatadigan modullar mavjudligini tasdiqlaydi.
 */
class OpenCvNativeLibrariesTest {

    @Test
    fun `opencv natives for the current platform load`() {
        Loader.load(FaceRecognizerSF::class.java)

        Mat(Size(64, 64), org.bytedeco.opencv.global.opencv_core.CV_8UC3).use { source ->
            Mat().use { target ->
                resize(source, target, Size(32, 32), 0.0, 0.0, INTER_AREA)
                assertEquals(32, target.cols())
                assertEquals(32, target.rows())
            }
        }
    }
}
