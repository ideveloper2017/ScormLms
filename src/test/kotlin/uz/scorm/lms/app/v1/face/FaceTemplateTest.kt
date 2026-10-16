package uz.scorm.lms.app.v1.face

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import uz.scorm.lms.app.v1.face.service.FaceTemplate
import java.nio.ByteBuffer
import java.util.Base64

class FaceTemplateTest {
    private fun features(seed: Int) = FloatArray(FaceTemplate.DIMENSIONS) { ((it * 31 + seed) % 17 - 8).toFloat() }

    /** Avvalgi format: prefikssiz base64 — 160×160 piksel vektori. */
    private fun legacyPixelTemplate(): String {
        val buffer = ByteBuffer.allocate(160 * 160 * 4)
        repeat(160 * 160) { buffer.putFloat(0.5f) }
        return Base64.getEncoder().encodeToString(buffer.array())
    }

    @Test
    fun `SFace shabloni saqlanib qayta o'qiladi va o'zi bilan to'liq mos`() {
        val template = FaceTemplate.encode(features(1))
        assertTrue(template.startsWith(FaceTemplate.PREFIX))
        assertTrue(FaceTemplate.isCurrent(template))
        assertEquals(features(1).toList(), FaceTemplate.decode(template)!!.toList())
        assertEquals(1.0, FaceTemplate.similarity(template, template), 1e-9)
    }

    @Test
    fun `eski piksel shabloni joriy hisoblanmaydi va hech qachon mos kelmaydi`() {
        val legacy = legacyPixelTemplate()
        assertFalse(FaceTemplate.isCurrent(legacy))
        assertTrue(FaceTemplate.isOutdated(legacy))
        assertNull(FaceTemplate.decode(legacy))
        assertEquals(0.0, FaceTemplate.similarity(legacy, FaceTemplate.encode(features(1))))
        assertEquals(0.0, FaceTemplate.similarity(legacy, legacy))
    }

    @Test
    fun `bo'sh yoki buzilgan shablon eskirgan deb belgilanmaydi va mos kelmaydi`() {
        assertFalse(FaceTemplate.isOutdated(null))
        assertFalse(FaceTemplate.isOutdated(""))
        assertFalse(FaceTemplate.isCurrent(FaceTemplate.PREFIX + "not-base64!"))
        assertEquals(0.0, FaceTemplate.similarity(FaceTemplate.PREFIX + "AAAA", FaceTemplate.encode(features(2))))
    }
}
