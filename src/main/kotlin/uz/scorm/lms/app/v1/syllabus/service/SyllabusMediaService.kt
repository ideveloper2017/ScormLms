package uz.scorm.lms.app.v1.syllabus.service

import org.springframework.beans.factory.annotation.Value
import org.springframework.core.io.InputStreamResource
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.multipart.MultipartFile
import uz.scorm.lms.app.v1.syllabus.model.SubjectSyllabus
import uz.scorm.lms.app.v1.syllabus.repository.SubjectSyllabusRepository
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.StandardOpenOption
import java.util.UUID

/** cover — muqova rasmi (512x512 tavsiya), video — tanishtiruv videosi */
enum class SyllabusMediaKind { COVER, VIDEO;
    companion object {
        fun of(value: String) = entries.firstOrNull { it.name.equals(value, ignoreCase = true) }
            ?: throw IllegalArgumentException("Media turi noto'g'ri: $value (cover yoki video)")
    }
}

data class SyllabusMediaDownload(val resource: InputStreamResource, val mediaType: String, val sizeBytes: Long, val fileName: String)

/** O'quv dasturi muqova rasmi va tanishtiruv videosi: faqat qoralama dasturga yuklanadi/o'chiriladi. */
@Service
class SyllabusMediaService(
    private val syllabi: SubjectSyllabusRepository,
    @Value("\${app.course-content.storage-dir:./private/course-content}") storageDirectory: String,
) {
    private val storageRoot = Path.of(storageDirectory).toAbsolutePath().normalize().resolve("syllabus-media")

    @Transactional
    fun upload(id: Long, kind: SyllabusMediaKind, file: MultipartFile) {
        val syllabus = editable(id)
        val allowed = if (kind == SyllabusMediaKind.COVER) IMAGE_TYPES else VIDEO_TYPES
        val limit = if (kind == SyllabusMediaKind.COVER) MAX_IMAGE_BYTES else MAX_VIDEO_BYTES
        val label = if (kind == SyllabusMediaKind.COVER) "Rasm" else "Video"
        require(!file.isEmpty && file.size in 1..limit) { "$label bo'sh bo'lmasligi va ${limit / 1024 / 1024} MB dan oshmasligi kerak" }
        val extension = file.originalFilename.orEmpty().substringAfterLast('.', "").lowercase()
        val mediaType = allowed[extension]
            ?: throw IllegalArgumentException(if (kind == SyllabusMediaKind.COVER) "Rasm JPG, PNG yoki WEBP bo'lishi kerak" else "Video MP4 yoki WEBM bo'lishi kerak")
        file.contentType?.substringBefore(';')?.lowercase()?.let { claimed ->
            require(claimed == mediaType || claimed == "application/octet-stream") { "$label kengaytmasi va media turi mos emas" }
        }
        val key = "${UUID.randomUUID()}.$extension"
        val target = path(id, key)
        Files.createDirectories(target.parent)
        try {
            file.inputStream.use { input ->
                Files.newOutputStream(target, StandardOpenOption.CREATE_NEW, StandardOpenOption.WRITE).use { input.copyTo(it) }
            }
            require(Files.size(target) == file.size) { "$label to'liq saqlanmadi" }
            val old = keyOf(syllabus, kind)
            if (kind == SyllabusMediaKind.COVER) syllabus.coverImage = key
            else { syllabus.introVideo = key; syllabus.introVideoName = file.originalFilename?.take(500) }
            syllabi.save(syllabus)
            old?.let { runCatching { Files.deleteIfExists(path(id, it)) } }
        } catch (cause: Exception) {
            Files.deleteIfExists(target)
            throw cause
        }
    }

    @Transactional
    fun remove(id: Long, kind: SyllabusMediaKind) {
        val syllabus = editable(id)
        val old = keyOf(syllabus, kind) ?: return
        if (kind == SyllabusMediaKind.COVER) syllabus.coverImage = null
        else { syllabus.introVideo = null; syllabus.introVideoName = null }
        syllabi.save(syllabus)
        runCatching { Files.deleteIfExists(path(id, old)) }
    }

    @Transactional(readOnly = true)
    fun open(id: Long, kind: SyllabusMediaKind): SyllabusMediaDownload {
        val syllabus = syllabi.findByIdAndDeletedFalse(id) ?: throw NoSuchElementException("O'quv dasturi topilmadi: $id")
        val key = keyOf(syllabus, kind) ?: throw NoSuchElementException(if (kind == SyllabusMediaKind.COVER) "Muqova rasmi yuklanmagan" else "Video yuklanmagan")
        val target = path(id, key)
        require(Files.isRegularFile(target)) { "Fayl saqlash joyida topilmadi" }
        val extension = key.substringAfterLast('.')
        return SyllabusMediaDownload(
            resource = InputStreamResource(Files.newInputStream(target)),
            mediaType = (IMAGE_TYPES + VIDEO_TYPES).getValue(extension),
            sizeBytes = Files.size(target),
            fileName = if (kind == SyllabusMediaKind.VIDEO) syllabus.introVideoName ?: key else key,
        )
    }

    private fun editable(id: Long): SubjectSyllabus {
        val syllabus = syllabi.lockById(id) ?: throw NoSuchElementException("O'quv dasturi topilmadi: $id")
        require(syllabus.status == "DRAFT") { "Faqat qoralama tahrirlanadi. Avval yangi versiya oching." }
        return syllabus
    }

    private fun keyOf(syllabus: SubjectSyllabus, kind: SyllabusMediaKind) =
        (if (kind == SyllabusMediaKind.COVER) syllabus.coverImage else syllabus.introVideo)?.takeIf(KEY::matches)

    private fun path(id: Long, key: String): Path {
        require(id > 0 && KEY.matches(key)) { "Fayl manzili noto'g'ri" }
        val root = storageRoot.resolve(id.toString()).normalize()
        val target = root.resolve(key).normalize()
        require(target.startsWith(root) && root.startsWith(storageRoot)) { "Fayl manzili noto'g'ri" }
        return target
    }

    companion object {
        private const val MAX_IMAGE_BYTES = 10L * 1024 * 1024
        private const val MAX_VIDEO_BYTES = 200L * 1024 * 1024
        private val KEY = Regex("[0-9a-f-]{36}\\.(?:jpg|jpeg|png|webp|mp4|webm)")
        private val IMAGE_TYPES = mapOf("jpg" to "image/jpeg", "jpeg" to "image/jpeg", "png" to "image/png", "webp" to "image/webp")
        private val VIDEO_TYPES = mapOf("mp4" to "video/mp4", "webm" to "video/webm")
    }
}
