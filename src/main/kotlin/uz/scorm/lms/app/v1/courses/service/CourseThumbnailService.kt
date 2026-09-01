package uz.scorm.lms.app.v1.courses.service

import org.springframework.beans.factory.annotation.Value
import org.springframework.core.io.InputStreamResource
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.multipart.MultipartFile
import uz.scorm.lms.app.v1.courses.dto.CourseThumbnailDto
import uz.scorm.lms.app.v1.courses.repository.CourseRepository
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.StandardOpenOption
import java.util.UUID

data class CourseThumbnailDownload(
    val resource: InputStreamResource,
    val mediaType: String,
    val sizeBytes: Long,
)

@Service
class CourseThumbnailService(
    private val courses: CourseRepository,
    private val accessService: CourseAccessService,
    @Value("\${app.course-content.storage-dir:./private/course-content}") storageDirectory: String,
) {
    private val storageRoot = Path.of(storageDirectory).toAbsolutePath().normalize().resolve("course-thumbnails")

    @Transactional
    fun upload(
        courseId: Long,
        file: MultipartFile,
        userId: Long,
        mayManageAll: Boolean,
    ): CourseThumbnailDto {
        val course = accessService.requireManage(courseId, userId, mayManageAll)
        require(!file.isEmpty && file.size in 1..MAX_FILE_BYTES) {
            "Kurs rasmi bo'sh bo'lmasligi va 10 MB dan oshmasligi kerak"
        }
        val extension = file.originalFilename.orEmpty().substringAfterLast('.', "").lowercase()
        val mediaType = ALLOWED_EXTENSIONS[extension]
            ?: throw IllegalArgumentException("Kurs rasmi JPG, PNG yoki WEBP bo'lishi kerak")
        file.contentType?.substringBefore(';')?.lowercase()?.let { claimed ->
            require(claimed == mediaType || claimed == "application/octet-stream") {
                "Kurs rasmi kengaytmasi va media turi mos emas"
            }
        }

        val key = "${UUID.randomUUID()}.$extension"
        val target = path(courseId, key)
        Files.createDirectories(target.parent)
        try {
            file.inputStream.use { input ->
                Files.newOutputStream(target, StandardOpenOption.CREATE_NEW, StandardOpenOption.WRITE).use { output ->
                    input.copyTo(output)
                }
            }
            require(Files.size(target) == file.size) { "Kurs rasmi to'liq saqlanmadi" }
            val oldKey = course.thumbnail
            course.thumbnail = key
            courses.save(course)
            oldKey?.takeIf(KEY::matches)?.let { oldThumbnail ->
                runCatching { Files.deleteIfExists(path(courseId, oldThumbnail)) }
            }
            return CourseThumbnailDto("/api/v1/courses/$courseId/thumbnail")
        } catch (cause: Exception) {
            Files.deleteIfExists(target)
            throw cause
        }
    }

    @Transactional(readOnly = true)
    fun download(courseId: Long, userId: Long, mayManageAll: Boolean): CourseThumbnailDownload {
        val course = accessService.requireRead(courseId, userId, mayManageAll)
        val key = course.thumbnail?.takeIf(KEY::matches)
            ?: throw NoSuchElementException("Kurs rasmi topilmadi")
        val target = path(courseId, key)
        require(Files.isRegularFile(target)) { "Kurs rasmi saqlash joyida topilmadi" }
        val mediaType = ALLOWED_EXTENSIONS.getValue(key.substringAfterLast('.'))
        return CourseThumbnailDownload(
            resource = InputStreamResource(Files.newInputStream(target)),
            mediaType = mediaType,
            sizeBytes = Files.size(target),
        )
    }

    private fun path(courseId: Long, key: String): Path {
        require(courseId > 0 && KEY.matches(key)) { "Kurs rasmi manzili noto'g'ri" }
        val courseRoot = storageRoot.resolve(courseId.toString()).normalize()
        val target = courseRoot.resolve(key).normalize()
        require(target.startsWith(courseRoot) && courseRoot.startsWith(storageRoot)) { "Kurs rasmi manzili noto'g'ri" }
        return target
    }

    companion object {
        private const val MAX_FILE_BYTES = 10L * 1024 * 1024
        private val KEY = Regex("[0-9a-f-]{36}\\.(?:jpg|jpeg|png|webp)")
        private val ALLOWED_EXTENSIONS = mapOf(
            "jpg" to "image/jpeg",
            "jpeg" to "image/jpeg",
            "png" to "image/png",
            "webp" to "image/webp",
        )
    }
}
