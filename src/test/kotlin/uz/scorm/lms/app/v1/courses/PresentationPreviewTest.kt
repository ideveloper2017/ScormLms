package uz.scorm.lms.app.v1.courses

import org.apache.poi.hslf.usermodel.HSLFSlideShow
import org.apache.poi.hslf.usermodel.HSLFTextBox
import org.apache.poi.hslf.usermodel.HSLFAutoShape
import org.apache.poi.sl.usermodel.ShapeType
import org.apache.poi.xslf.usermodel.XMLSlideShow
import org.apache.pdfbox.Loader
import org.apache.pdfbox.rendering.PDFRenderer
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test
import org.mockito.Mockito
import org.springframework.core.io.InputStreamResource
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.authority.SimpleGrantedAuthority
import uz.scorm.lms.app.v1.courses.controller.PresentationPreviewController
import uz.scorm.lms.app.v1.courses.service.*
import uz.scorm.lms.app.v1.user.model.User
import java.awt.Color
import java.awt.Dimension
import java.awt.geom.Rectangle2D
import java.io.ByteArrayOutputStream
import java.nio.file.Files
import java.nio.file.Path

class PresentationPreviewTest {
    private val preview = PresentationPreview()
    private fun fixture(extension: String, count: Int = 2): ByteArray {
        val output = ByteArrayOutputStream()
        if (extension == "pptx") XMLSlideShow().use { deck ->
            deck.pageSize = Dimension(960, 540)
            repeat(count) { index ->
                val slide = deck.createSlide()
                slide.createAutoShape().apply {
                    shapeType = ShapeType.RECT
                    anchor = Rectangle2D.Double(0.0, 0.0, 960.0, 540.0)
                    fillColor = if (index == 0) Color.BLUE else Color.ORANGE
                }
                slide.createTextBox().apply {
                    anchor = Rectangle2D.Double(50.0, 50.0, 800.0, 100.0)
                    text = "Java slayd ${index + 1}"
                }
            }
            deck.write(output)
        } else HSLFSlideShow().use { deck ->
            deck.pageSize = Dimension(960, 540)
            repeat(count) { index ->
                val slide = deck.createSlide()
                slide.addShape(HSLFAutoShape(ShapeType.RECT).apply {
                    anchor = Rectangle2D.Double(0.0, 0.0, 960.0, 540.0)
                    fillColor = if (index == 0) Color.BLUE else Color.ORANGE
                })
                slide.addShape(HSLFTextBox().apply {
                    anchor = Rectangle2D.Double(50.0, 50.0, 800.0, 100.0)
                    text = "Java slayd ${index + 1}"
                })
            }
            deck.write(output)
        }
        return output.toByteArray()
    }
    private fun download(bytes: ByteArray, extension: String = "pptx", size: Long = bytes.size.toLong()) = CourseContentDownload(
        InputStreamResource(bytes.inputStream()), "sample.$extension",
        if (extension == "ppt") "application/vnd.ms-powerpoint" else "application/vnd.openxmlformats-officedocument.presentationml.presentation", size,
    )

    @Test
    fun `renders PPT and PPTX as ordered slide images with original aspect ratio`() {
        for (extension in listOf("ppt", "pptx")) {
            val bytes = fixture(extension)
            val pdf = preview.render(download(bytes, extension))
            val dir = Files.createDirectories(Path.of("build/test-presentation-preview"))
            Files.write(dir.resolve("sample.$extension"), bytes)
            Files.write(dir.resolve("$extension.pdf"), pdf)
            Loader.loadPDF(pdf).use { document ->
                assertEquals(2, document.numberOfPages)
                assertEquals(960f, document.getPage(0).mediaBox.width)
                assertEquals(540f, document.getPage(0).mediaBox.height)
                val first = PDFRenderer(document).renderImage(0)
                val second = PDFRenderer(document).renderImage(1)
                assertNotEquals(first.getRGB(400, 400), second.getRGB(400, 400))
            }
        }
    }

    @Test
    fun `rejects broken oversized and excessive slide files`() {
        assertThrows(IllegalArgumentException::class.java) { preview.render(download("broken".toByteArray())) }
        assertThrows(IllegalArgumentException::class.java) { preview.render(download(byteArrayOf(1), size = 21L * 1024 * 1024)) }
        assertThrows(IllegalArgumentException::class.java) { preview.render(download(fixture("pptx", 51))) }
    }

    @Test
    fun `endpoint checks course asset access before rendering and supports existing staff permissions`() {
        val assets = Mockito.mock(CourseContentAssetService::class.java)
        val renderer = Mockito.mock(PresentationPreview::class.java)
        val controller = PresentationPreviewController(assets, renderer)
        val user = User(username = "reader", password = "unused").apply { id = 9 }
        val studentAuth = UsernamePasswordAuthenticationToken("reader", null, emptyList())
        Mockito.`when`(assets.download(5, 10, 9, false)).thenThrow(IllegalArgumentException("Not enrolled"))
        assertThrows(IllegalArgumentException::class.java) { controller.show(5, 10, user, studentAuth) }
        Mockito.verifyNoInteractions(renderer)
        val file = download(byteArrayOf(1))
        Mockito.`when`(assets.download(5, 10, 9, true)).thenReturn(file)
        Mockito.`when`(renderer.render(file)).thenReturn("%PDF-test".toByteArray())
        val response = controller.show(5, 10, user, UsernamePasswordAuthenticationToken("staff", null, listOf(SimpleGrantedAuthority("ACADEMIC_WRITE"))))
        assertEquals("application/pdf", response.headers.contentType.toString())
        assertEquals("no-store", response.headers.cacheControl)
        assertEquals("%PDF-test", response.body!!.toString(Charsets.UTF_8))
    }
}
