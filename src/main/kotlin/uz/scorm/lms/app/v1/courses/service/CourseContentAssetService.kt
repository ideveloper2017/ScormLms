package uz.scorm.lms.app.v1.courses.service

import org.springframework.beans.factory.annotation.Value
import org.springframework.core.io.InputStreamResource
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.multipart.MultipartFile
import uz.scorm.lms.app.v1.courses.dto.CourseContentAssetDto
import uz.scorm.lms.app.v1.courses.model.ContentReviewStatus
import uz.scorm.lms.app.v1.courses.model.CourseContentAsset
import uz.scorm.lms.app.v1.courses.model.LearningItemStatus
import uz.scorm.lms.app.v1.courses.model.isEffective
import uz.scorm.lms.app.v1.courses.repository.CourseContentAssetRepository
import uz.scorm.lms.app.v1.courses.repository.CourseContentRepository
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.StandardOpenOption
import java.security.DigestInputStream
import java.security.MessageDigest
import java.util.UUID

data class CourseContentDownload(
    val resource: InputStreamResource,
    val fileName: String,
    val mediaType: String,
    val sizeBytes: Long,
)

@Service
class CourseContentAssetService(
    private val assetRepository: CourseContentAssetRepository,
    private val contentRepository: CourseContentRepository,
    private val accessService: CourseAccessService,
    private val compatibilityService: ContentCompatibilityService,
    @Value("\${app.course-content.storage-dir:./private/course-content}") storageDirectory: String,
    @Value("\${app.course-content.max-file-bytes:209715200}") private val maxFileBytes: Long,
) {
    private val storageRoot: Path = Path.of(storageDirectory).toAbsolutePath().normalize()

    @Transactional
    fun upload(courseId: Long, file: MultipartFile, userId: Long, mayManageAll: Boolean): CourseContentAssetDto {
        val course = accessService.requireManage(courseId, userId, mayManageAll)
        require(!file.isEmpty) { "Yuklanadigan fayl bo'sh" }
        require(file.size in 1..maxFileBytes) { "Fayl hajmi ${maxFileBytes / 1024 / 1024} MB dan oshmasligi kerak" }
        val originalName = safeFileName(file.originalFilename)
        val extension = originalName.substringAfterLast('.', "").lowercase()
        val mediaType = ALLOWED_EXTENSIONS[extension]
            ?: throw IllegalArgumentException("Bu fayl turi ruxsat etilmagan: .$extension")
        file.contentType?.substringBefore(';')?.lowercase()?.let { claimed ->
            require(claimed in GENERIC_MEDIA_TYPES || claimed == mediaType || compatibleOfficeMedia(extension, claimed)) {
                "Fayl kengaytmasi va media turi mos emas"
            }
        }

        val storageKey = UUID.randomUUID().toString()
        val target = storagePath(courseId, storageKey)
        Files.createDirectories(target.parent)
        val digest = MessageDigest.getInstance("SHA-256")
        try {
            file.inputStream.use { input ->
                DigestInputStream(input, digest).use { hashed ->
                    Files.newOutputStream(target, StandardOpenOption.CREATE_NEW, StandardOpenOption.WRITE).use { output ->
                        hashed.copyTo(output)
                    }
                }
            }
            require(Files.size(target) == file.size) { "Fayl to'liq saqlanmadi" }
            val saved = assetRepository.save(CourseContentAsset(
                course = course,
                storageKey = storageKey,
                originalFileName = originalName,
                mediaType = mediaType,
                sizeBytes = file.size,
                sha256 = digest.digest().joinToString("") { "%02x".format(it) },
                uploadedBy = userId,
            ))
            return toDto(saved)
        } catch (cause: Exception) {
            Files.deleteIfExists(target)
            throw cause
        }
    }

    @Transactional(readOnly = true)
    fun download(
        courseId: Long,
        contentId: Long,
        userId: Long,
        mayManageAll: Boolean,
    ): CourseContentDownload {
        val course = accessService.requireRead(courseId, userId, mayManageAll)
        val content = contentRepository.findById(contentId)
            .filter { !it.deleted && it.module.course.id == courseId }
            .orElseThrow { NoSuchElementException("Kurs kontenti topilmadi: $contentId") }
        val mayEdit = mayManageAll || course.userId == userId
        require(mayEdit || (
            content.status == LearningItemStatus.PUBLISHED.name &&
                content.reviewStatus == ContentReviewStatus.APPROVED.name &&
                content.module.status == LearningItemStatus.PUBLISHED.name &&
                content.isEffective() &&
                compatibilityService.evaluate(content).compatible
            )) { "Kontent faylini yuklab olish uchun ochiq emas" }
        val asset = content.asset ?: throw NoSuchElementException("Kontentga fayl biriktirilmagan")
        require(!asset.deleted && asset.course.id == courseId) { "Kontent fayli topilmadi" }
        val target = storagePath(courseId, asset.storageKey)
        require(Files.isRegularFile(target)) { "Kontent fayli saqlash joyida topilmadi" }
        return CourseContentDownload(
            resource = InputStreamResource(Files.newInputStream(target)),
            fileName = asset.originalFileName,
            mediaType = asset.mediaType,
            sizeBytes = asset.sizeBytes,
        )
    }

    fun toDto(asset: CourseContentAsset) = CourseContentAssetDto(
        id = requireNotNull(asset.id),
        courseId = requireNotNull(asset.course.id),
        originalFileName = asset.originalFileName,
        mediaType = asset.mediaType,
        sizeBytes = asset.sizeBytes,
        sha256 = asset.sha256,
        uploadedAt = asset.createdAt,
    )

    private fun storagePath(courseId: Long, storageKey: String): Path {
        require(STORAGE_KEY.matches(storageKey)) { "Noto'g'ri fayl kaliti" }
        val courseRoot = storageRoot.resolve(courseId.toString()).normalize()
        val target = courseRoot.resolve(storageKey).normalize()
        require(target.startsWith(courseRoot) && courseRoot.startsWith(storageRoot)) { "Noto'g'ri fayl manzili" }
        return target
    }

    private fun safeFileName(value: String?): String {
        val name = value.orEmpty().replace('\\', '/').substringAfterLast('/').trim()
        require(name.isNotBlank() && name.length <= 500) { "Fayl nomi 1 dan 500 belgigacha bo'lishi kerak" }
        require(name.none { it.code < 32 }) { "Fayl nomida boshqaruv belgisi bor" }
        return name
    }

    private fun compatibleOfficeMedia(extension: String, claimed: String): Boolean = when (extension) {
        "doc", "docx" -> claimed.contains("word") || claimed == "application/msword"
        "ppt", "pptx" -> claimed.contains("presentation") || claimed == "application/vnd.ms-powerpoint"
        "xls", "xlsx" -> claimed.contains("sheet") || claimed == "application/vnd.ms-excel"
        else -> false
    }

    companion object {
        private val STORAGE_KEY = Regex("[0-9a-f-]{36}")
        private val GENERIC_MEDIA_TYPES = setOf("application/octet-stream", "binary/octet-stream")
        private val ALLOWED_EXTENSIONS = mapOf(
            "mp4" to "video/mp4",
            "webm" to "video/webm",
            "pdf" to "application/pdf",
            "txt" to "text/plain",
            "csv" to "text/csv",
            "doc" to "application/msword",
            "docx" to "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "ppt" to "application/vnd.ms-powerpoint",
            "pptx" to "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "xls" to "application/vnd.ms-excel",
            "xlsx" to "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "zip" to "application/zip",
            "jpg" to "image/jpeg",
            "jpeg" to "image/jpeg",
            "png" to "image/png",
        )
    }
}
