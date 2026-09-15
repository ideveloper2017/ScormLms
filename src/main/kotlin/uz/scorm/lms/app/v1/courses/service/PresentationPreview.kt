package uz.scorm.lms.app.v1.courses.service

import org.apache.poi.hslf.usermodel.HSLFSlideShow
import org.apache.poi.xslf.usermodel.XMLSlideShow
import org.apache.poi.sl.usermodel.SlideShow
import org.apache.pdfbox.pdmodel.PDDocument
import org.apache.pdfbox.pdmodel.PDPage
import org.apache.pdfbox.pdmodel.PDPageContentStream
import org.apache.pdfbox.pdmodel.common.PDRectangle
import org.apache.pdfbox.pdmodel.graphics.image.JPEGFactory
import org.springframework.stereotype.Service
import java.awt.Color
import java.awt.RenderingHints
import java.awt.image.BufferedImage
import java.io.ByteArrayOutputStream
import java.util.concurrent.Semaphore
import kotlin.math.roundToInt

/** Creates a static slide preview locally. No Office/Google viewer or document upload. */
@Service
class PresentationPreview {
    private val renderSlots = Semaphore(2)

    fun render(download: CourseContentDownload): ByteArray = download.resource.inputStream.use { input ->
        require(download.mediaType in MEDIA_TYPES) { "Prezentatsiya uchun PPT yoki PPTX fayl kerak" }
        require(download.sizeBytes in 1..20L * 1024 * 1024) { "Prezentatsiya ko'rish uchun 20 MB dan oshmasligi kerak" }
        check(renderSlots.tryAcquire()) { "Prezentatsiyalar tayyorlanmoqda. Birozdan so'ng qayta urinib ko'ring." }
        try {
            val show: SlideShow<*, *> = if (download.mediaType == "application/vnd.ms-powerpoint") HSLFSlideShow(input) else XMLSlideShow(input)
            show.use { deck ->
                require(deck.slides.size in 1..50) { "Prezentatsiya 1–50 slayd bo'lishi kerak. Katta faylni bo'limlarga ajrating." }
                val size = deck.pageSize
                require(size.width in 1..10000 && size.height in 1..10000) { "Slayd o'lchami noto'g'ri" }
                val scale = 1600.0 / maxOf(size.width, size.height)
                PDDocument().use { pdf ->
                    deck.slides.forEach { slide ->
                        val image = BufferedImage(maxOf(1, (size.width * scale).roundToInt()), maxOf(1, (size.height * scale).roundToInt()), BufferedImage.TYPE_INT_RGB)
                        try {
                            val graphics = image.createGraphics()
                            try {
                                graphics.color = Color.WHITE
                                graphics.fillRect(0, 0, image.width, image.height)
                                graphics.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON)
                                graphics.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON)
                                graphics.scale(scale, scale)
                                slide.draw(graphics)
                            } finally { graphics.dispose() }
                            val page = PDPage(PDRectangle(size.width.toFloat(), size.height.toFloat()))
                            pdf.addPage(page)
                            PDPageContentStream(pdf, page).use { stream ->
                                stream.drawImage(JPEGFactory.createFromImage(pdf, image, .92f), 0f, 0f, size.width.toFloat(), size.height.toFloat())
                            }
                        } finally { image.flush() }
                    }
                    ByteArrayOutputStream().use { output -> pdf.save(output); output.toByteArray() }
                }
            }
        } catch (cause: IllegalArgumentException) {
            throw cause
        } catch (cause: Exception) {
            throw IllegalArgumentException("Prezentatsiya ochilmadi. Parolsiz PPT/PPTX yoki PDF nusxasini yuklang.", cause)
        } finally { renderSlots.release() }
    }

    companion object {
        val MEDIA_TYPES = setOf("application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation")
    }
}
