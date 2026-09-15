package uz.scorm.lms.app.v1.courses.service

import org.apache.poi.hwpf.extractor.WordExtractor
import org.springframework.stereotype.Service

/** Legacy Word is read locally; documents are never sent to an external viewer. */
@Service
class LegacyWordPreview {
    fun extract(download: CourseContentDownload): String = download.resource.inputStream.use { input ->
        require(download.mediaType == "application/msword") { "Matnli ko'rish faqat DOC fayllari uchun" }
        require(download.sizeBytes <= 20L * 1024 * 1024) { "DOC ko'rish uchun fayl 20 MB dan oshmasligi kerak" }
        try {
            WordExtractor(input).use { it.text.take(1_000_000) }
        } catch (cause: Exception) {
            throw IllegalArgumentException("DOC hujjatini o'qib bo'lmadi. Parolsiz DOCX yoki PDF fayl yuklang.", cause)
        }
    }
}
