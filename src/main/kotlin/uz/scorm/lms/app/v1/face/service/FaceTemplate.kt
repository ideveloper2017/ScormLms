package uz.scorm.lms.app.v1.face.service

import java.nio.ByteBuffer
import java.util.Base64
import kotlin.math.sqrt

/**
 * Saqlanadigan yuz shabloni formati. Joriy format — SFace modelining 128 o'lchamli belgilari:
 * `sface-v1:` + base64(128 × float32).
 *
 * Avvalgi shablon 160×160 kulrang piksellar vektori edi (prefikssiz). Piksellar kosinus o'xshashligi
 * shaxsni ajratmaydi — har qanday ikki yuz yuqori o'xshashlik berishi mumkin edi. Eski shablonlar
 * yangi model bilan solishtirilmaydi: egasi yuzini qayta ro'yxatdan o'tkazishi kerak ([isCurrent]).
 */
object FaceTemplate {
    const val PREFIX = "sface-v1:"
    const val DIMENSIONS = 128

    /** Eski formatdagi shablon egasiga ko'rsatiladigan xabar. */
    const val RE_ENROLL_MESSAGE =
        "Yuz tekshiruvi yangilandi: yuzingizni profilda qayta ro'yxatdan o'tkazing, so'ng testni boshlang"

    /** Shablon joriy formatdami (SFace). Eski piksel shablon yoki bo'sh qiymat — false. */
    fun isCurrent(template: String?): Boolean = template != null && template.startsWith(PREFIX) && decode(template) != null

    /** Eski formatdagi (qayta ro'yxatdan o'tkazish kerak bo'lgan) shablonmi. */
    fun isOutdated(template: String?): Boolean = !template.isNullOrBlank() && !isCurrent(template)

    fun encode(features: FloatArray): String {
        require(features.size == DIMENSIONS) { "Yuz belgilari $DIMENSIONS o'lchamli bo'lishi kerak" }
        val buffer = ByteBuffer.allocate(features.size * 4)
        features.forEach(buffer::putFloat)
        return PREFIX + Base64.getEncoder().encodeToString(buffer.array())
    }

    fun decode(template: String?): FloatArray? {
        if (template == null || !template.startsWith(PREFIX)) return null
        return runCatching {
            val bytes = Base64.getDecoder().decode(template.removePrefix(PREFIX))
            val floats = ByteBuffer.wrap(bytes).asFloatBuffer()
            FloatArray(floats.remaining()).also(floats::get)
        }.getOrNull()?.takeIf { it.size == DIMENSIONS }
    }

    /**
     * Ikki shablonning kosinus o'xshashligi (SFace belgilari uchun). Biri eski formatda yoki buzilgan
     * bo'lsa 0 — hech qachon "mos" deb hisoblanmaydi.
     */
    fun similarity(first: String?, second: String?): Double {
        val a = decode(first) ?: return 0.0
        val b = decode(second) ?: return 0.0
        return cosine(a, b)
    }

    fun cosine(a: FloatArray, b: FloatArray): Double {
        if (a.size != b.size || a.isEmpty()) return 0.0
        var dot = 0.0
        var na = 0.0
        var nb = 0.0
        for (i in a.indices) {
            dot += a[i] * b[i]
            na += a[i] * a[i]
            nb += b[i] * b[i]
        }
        if (na == 0.0 || nb == 0.0) return 0.0
        return dot / (sqrt(na) * sqrt(nb))
    }
}
