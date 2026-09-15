package uz.scorm.lms.app.v1.courses

import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test
import org.springframework.core.io.InputStreamResource
import uz.scorm.lms.app.v1.courses.service.CourseContentDownload
import uz.scorm.lms.app.v1.courses.service.LegacyWordPreview
import uz.scorm.lms.app.v1.courses.controller.CourseController
import uz.scorm.lms.app.v1.courses.service.CourseContentAssetService
import uz.scorm.lms.app.v1.user.model.User
import org.mockito.Mockito
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken

class LegacyWordPreviewTest {
    private val preview = LegacyWordPreview()
    private inline fun <reified T> mock(): T = Mockito.mock(T::class.java)

    @Test
    fun `document endpoint returns text in data and uses authenticated asset access`() {
        val assets = mock<CourseContentAssetService>()
        val bytes = javaClass.getResourceAsStream("/content-preview/simple.doc")!!.use { it.readAllBytes() }
        Mockito.`when`(assets.download(5, 9, 6, false)).thenReturn(
            CourseContentDownload(InputStreamResource(bytes.inputStream()), "simple.doc", "application/msword", bytes.size.toLong()),
        )
        val controller = CourseController(mock(), mock(), mock(), mock(), assets, mock(), mock(), mock(), mock(), preview)
        val owner = User(username = "owner", password = "unused").apply { id = 6 }
        val result = controller.previewLegacyWord(5, 9, owner, UsernamePasswordAuthenticationToken("owner", null, emptyList()))
        assertTrue(result.body!!.data!!.contains("simple", ignoreCase = true))
        assertEquals("no-store", result.headers.cacheControl)
        Mockito.verify(assets).download(5, 9, 6, false)
        Mockito.`when`(assets.download(5, 9, 6, false)).thenThrow(IllegalArgumentException("No enrollment"))
        assertThrows(IllegalArgumentException::class.java) {
            controller.previewLegacyWord(5, 9, owner, UsernamePasswordAuthenticationToken("owner", null, emptyList()))
        }
    }

    @Test
    fun `reads actual legacy Word locally`() {
        val bytes = javaClass.getResourceAsStream("/content-preview/simple.doc")!!.use { it.readAllBytes() }
        val download = CourseContentDownload(InputStreamResource(bytes.inputStream()), "simple.doc", "application/msword", bytes.size.toLong())
        val text = preview.extract(download)
        assertTrue(text.isNotBlank())
        assertTrue(text.contains("simple", ignoreCase = true), text)
    }

    @Test
    fun `rejects malformed wrong-type and oversized documents`() {
        fun file(media: String = "application/msword", size: Long = 4) =
            CourseContentDownload(InputStreamResource("oops".byteInputStream()), "broken.doc", media, size)
        assertThrows(IllegalArgumentException::class.java) { preview.extract(file()) }
        assertThrows(IllegalArgumentException::class.java) { preview.extract(file("text/html")) }
        assertThrows(IllegalArgumentException::class.java) { preview.extract(file(size = 21L * 1024 * 1024)) }
    }
}
