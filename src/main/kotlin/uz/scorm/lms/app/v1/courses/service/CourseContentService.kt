package uz.scorm.lms.app.v1.courses.service

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.courses.dto.CourseContentDto
import uz.scorm.lms.app.v1.courses.dto.CourseContentAssetDto
import uz.scorm.lms.app.v1.courses.dto.CourseContentRequest
import uz.scorm.lms.app.v1.courses.dto.CourseContentRevisionDto
import uz.scorm.lms.app.v1.courses.dto.ContentCompatibilityDto
import uz.scorm.lms.app.v1.courses.model.CourseContent
import uz.scorm.lms.app.v1.courses.model.CourseContentAsset
import uz.scorm.lms.app.v1.courses.model.CourseContentRevision
import uz.scorm.lms.app.v1.courses.model.CourseContentType
import uz.scorm.lms.app.v1.courses.model.ContentReviewStatus
import uz.scorm.lms.app.v1.courses.model.LearningItemStatus
import uz.scorm.lms.app.v1.courses.model.isEffective
import uz.scorm.lms.app.v1.courses.repository.CourseContentRepository
import uz.scorm.lms.app.v1.courses.repository.CourseContentAssetRepository
import uz.scorm.lms.app.v1.courses.repository.CourseContentRevisionRepository
import uz.scorm.lms.app.v1.contentstandard.service.ContentStandardService
import java.net.URI
import java.time.Instant
import java.time.LocalDate
import java.util.Locale

@Service
class CourseContentService(
    private val contentRepository: CourseContentRepository,
    private val assetRepository: CourseContentAssetRepository,
    private val revisionRepository: CourseContentRevisionRepository,
    private val moduleService: CourseModuleService,
    private val accessService: CourseAccessService,
    private val compatibilityService: ContentCompatibilityService,
    private val contentStandardService: ContentStandardService,
) {
    @Transactional(readOnly = true)
    fun list(courseId: Long, userId: Long, mayManageAll: Boolean): List<CourseContentDto> {
        val course = accessService.requireRead(courseId, userId, mayManageAll)
        val mayEdit = mayManageAll || course.userId == userId
        val contents = contentRepository.findAllByModuleCourseIdAndDeletedFalseOrderByModulePositionAscPositionAsc(courseId)
        val compatibility = compatibilityService.evaluateAll(course, contents.map { it.languageCode })
        return contents
            .filter { mayEdit || (
                it.status == LearningItemStatus.PUBLISHED.name &&
                    it.reviewStatus == ContentReviewStatus.APPROVED.name &&
                    it.module.status == LearningItemStatus.PUBLISHED.name &&
                    it.isEffective() &&
                    compatibility.getValue(it.languageCode).compatible
                ) }
            .map { toDto(it, compatibility.getValue(it.languageCode)) }
    }

    @Transactional
    fun create(courseId: Long, moduleId: Long, request: CourseContentRequest, userId: Long, mayManageAll: Boolean): CourseContentDto {
        accessService.requireManage(courseId, userId, mayManageAll)
        val module = moduleService.ownedModule(courseId, moduleId)
        val asset = validateAndResolveAsset(courseId, request)
        val nextPosition = request.position ?: ((contentRepository
            .findFirstByModuleIdAndDeletedFalseOrderByPositionDesc(moduleId)?.position ?: 0) + 1)
        require(nextPosition > 0) { "Kontent tartibi musbat bo'lishi kerak" }
        val now = Instant.now()
        val saved = contentRepository.save(CourseContent(
            module = module,
            title = request.title.trim(),
            description = request.description?.trim()?.takeIf(String::isNotBlank),
            contentType = request.contentType,
            contentUrl = request.contentUrl.clean(),
            contentBody = request.contentBody.clean(),
            asset = asset,
            durationMinutes = request.durationMinutes,
            position = nextPosition,
            languageCode = language(request.languageCode),
            authorName = request.authorName.trim(),
            contentVersion = request.contentVersion.trim(),
            sourceName = request.sourceName.trim(),
            sourceUrl = request.sourceUrl.clean(),
            validFrom = request.validFrom,
            validUntil = request.validUntil,
            metadataUpdatedAt = now,
        ))
        saveRevision(saved, 1, userId, now)
        return toDto(saved)
    }

    @Transactional
    fun update(courseId: Long, contentId: Long, request: CourseContentRequest, userId: Long, mayManageAll: Boolean): CourseContentDto {
        accessService.requireManage(courseId, userId, mayManageAll)
        val content = ownedContent(courseId, contentId)
        require(content.reviewStatus != ContentReviewStatus.IN_REVIEW.name) {
            "Ekspertizadagi kontent qaror chiqmaguncha tahrirlanmaydi"
        }
        val asset = validateAndResolveAsset(courseId, request)
        require(request.contentVersion.trim() != content.contentVersion) { "Yangilashda yangi kontent versiyasi majburiy" }
        require(!revisionRepository.existsByContentIdAndContentVersionAndDeletedFalse(contentId, request.contentVersion.trim())) {
            "Bu kontent versiyasi tarixda mavjud"
        }
        content.title = request.title.trim()
        content.description = request.description?.trim()?.takeIf(String::isNotBlank)
        content.contentType = request.contentType
        content.contentUrl = request.contentUrl.clean()
        content.contentBody = request.contentBody.clean()
        content.asset = asset
        content.durationMinutes = request.durationMinutes
        content.languageCode = language(request.languageCode)
        content.authorName = request.authorName.trim()
        content.contentVersion = request.contentVersion.trim()
        content.sourceName = request.sourceName.trim()
        content.sourceUrl = request.sourceUrl.clean()
        content.validFrom = request.validFrom
        content.validUntil = request.validUntil
        content.metadataUpdatedAt = Instant.now()
        content.status = LearningItemStatus.DRAFT.name
        content.publishedAt = null
        content.reviewStatus = ContentReviewStatus.DRAFT.name
        content.approvedRevisionNumber = null
        request.position?.let { require(it > 0); content.position = it }
        val saved = contentRepository.save(content)
        val nextRevision = (revisionRepository.findFirstByContentIdAndDeletedFalseOrderByRevisionNumberDesc(contentId)
            ?.revisionNumber ?: 0) + 1
        saveRevision(saved, nextRevision, userId, content.metadataUpdatedAt)
        return toDto(saved)
    }

    @Transactional
    fun changeStatus(courseId: Long, contentId: Long, status: LearningItemStatus, userId: Long, mayManageAll: Boolean): CourseContentDto {
        accessService.requireManage(courseId, userId, mayManageAll)
        val content = ownedContent(courseId, contentId)
        require(status != LearningItemStatus.PUBLISHED || content.module.status == LearningItemStatus.PUBLISHED.name) {
            "Kontentdan oldin modulni nashr qiling"
        }
        require(status != LearningItemStatus.PUBLISHED || content.reviewStatus == ContentReviewStatus.APPROVED.name) {
            "Kontent ekspert tomonidan tasdiqlanmasdan nashr qilinmaydi"
        }
        val latestRevision = revisionRepository.findFirstByContentIdAndDeletedFalseOrderByRevisionNumberDesc(contentId)
        require(status != LearningItemStatus.PUBLISHED || content.approvedRevisionNumber == latestRevision?.revisionNumber) {
            "Faqat ekspert tasdiqlagan joriy kontent versiyasi nashr qilinadi"
        }
        if (status == LearningItemStatus.PUBLISHED) {
            contentStandardService.requirePassingAssessmentIfConfigured(requireNotNull(latestRevision?.id))
        }
        require(status != LearningItemStatus.PUBLISHED || content.validUntil == null || !content.validUntil!!.isBefore(LocalDate.now())) {
            "Amal qilish muddati tugagan kontent nashr qilinmaydi"
        }
        if (status == LearningItemStatus.PUBLISHED) compatibilityService.requireContentCompatible(content)
        content.status = status.name
        content.publishedAt = if (status == LearningItemStatus.PUBLISHED) content.publishedAt ?: Instant.now() else null
        return toDto(contentRepository.save(content))
    }

    @Transactional
    fun delete(courseId: Long, contentId: Long, userId: Long, mayManageAll: Boolean) {
        accessService.requireManage(courseId, userId, mayManageAll)
        val content = ownedContent(courseId, contentId)
        require(content.reviewStatus != ContentReviewStatus.IN_REVIEW.name) {
            "Ekspertizadagi kontent qaror chiqmaguncha o'chirilmaydi"
        }
        content.deleted = true
        contentRepository.save(content)
    }

    @Transactional(readOnly = true)
    fun revisions(
        courseId: Long,
        contentId: Long,
        userId: Long,
        mayManageAll: Boolean,
    ): List<CourseContentRevisionDto> {
        val course = accessService.requireRead(courseId, userId, mayManageAll)
        val content = ownedContent(courseId, contentId)
        val mayEdit = mayManageAll || course.userId == userId
        require(mayEdit || (
            content.status == LearningItemStatus.PUBLISHED.name &&
                content.reviewStatus == ContentReviewStatus.APPROVED.name &&
                content.module.status == LearningItemStatus.PUBLISHED.name &&
                content.isEffective() &&
                compatibilityService.evaluate(content).compatible
            )) { "Kontent versiyalari ko'rish uchun ochiq emas" }
        return revisionRepository.findAllByContentIdAndDeletedFalseOrderByRevisionNumberDesc(contentId).map(::revisionDto)
    }

    private fun ownedContent(courseId: Long, contentId: Long): CourseContent = contentRepository.findById(contentId)
        .filter { !it.deleted && it.module.course.id == courseId }
        .orElseThrow { NoSuchElementException("Kurs kontenti topilmadi: $contentId") }

    private fun validateAndResolveAsset(courseId: Long, request: CourseContentRequest): CourseContentAsset? {
        require(request.title.isNotBlank()) { "Kontent nomi majburiy" }
        require(request.title.length <= 255) { "Kontent nomi 255 belgidan oshmasligi kerak" }
        request.durationMinutes?.let { require(it >= 0) { "Davomiylik manfiy bo'lmaydi" } }
        require(request.authorName.trim().length in 2..255) { "Muallif nomi 2 dan 255 belgigacha bo'lishi kerak" }
        require(VERSION.matches(request.contentVersion.trim())) { "Versiya 1-64 belgili harf, raqam, nuqta, chiziq yoki underscore bo'lishi kerak" }
        require(request.sourceName.trim().length in 2..500) { "Manba nomi 2 dan 500 belgigacha bo'lishi kerak" }
        require(!request.validUntil.orMax().isBefore(request.validFrom)) { "Amal qilish tugashi boshlanishidan oldin bo'lmaydi" }
        language(request.languageCode)
        validateUrl(request.contentUrl, "Kontent URL")
        validateUrl(request.sourceUrl, "Manba URL")
        val url = request.contentUrl.clean()
        val body = request.contentBody.clean()
        val asset = request.assetId?.let { assetId ->
            assetRepository.findByIdAndCourseIdAndDeletedFalse(assetId, courseId)
                ?: throw NoSuchElementException("Kurs fayli topilmadi: $assetId")
        }
        when (request.contentType) {
            CourseContentType.TEXT -> {
                require(!body.isNullOrBlank()) { "Matnli dars mazmuni majburiy" }
                require(body.length <= MAX_TEXT_LENGTH) { "Matnli dars $MAX_TEXT_LENGTH belgidan oshmasligi kerak" }
                require(url == null && asset == null) { "Matnli darsga URL yoki fayl biriktirilmaydi" }
            }
            CourseContentType.LINK -> {
                require(url != null) { "Havola kontenti uchun URL majburiy" }
                require(body == null && asset == null) { "Havola kontentiga matn yoki fayl biriktirilmaydi" }
            }
            CourseContentType.VIDEO, CourseContentType.DOCUMENT, CourseContentType.FILE -> {
                require((url != null) xor (asset != null)) { "Kontent uchun bitta URL yoki bitta yuklangan fayl tanlang" }
                require(body == null) { "Faylli kontentga alohida matn mazmuni biriktirilmaydi" }
                if (asset != null) requireAssetMatchesType(asset, request.contentType)
            }
        }
        return asset
    }

    private fun toDto(
        content: CourseContent,
        compatibility: ContentCompatibilityDto = compatibilityService.evaluate(content),
    ) = CourseContentDto(
        id = requireNotNull(content.id),
        courseId = requireNotNull(content.module.course.id),
        moduleId = requireNotNull(content.module.id),
        moduleTitle = content.module.title,
        title = content.title,
        description = content.description,
        contentType = content.contentType.name.lowercase(),
        contentUrl = content.contentUrl,
        contentBody = content.contentBody,
        asset = content.asset?.let(::assetDto),
        durationMinutes = content.durationMinutes,
        position = content.position,
        status = content.status.lowercase(),
        publishedAt = content.publishedAt,
        languageCode = content.languageCode,
        authorName = content.authorName,
        contentVersion = content.contentVersion,
        sourceName = content.sourceName,
        sourceUrl = content.sourceUrl,
        validFrom = content.validFrom,
        validUntil = content.validUntil,
        effective = content.isEffective(),
        metadataUpdatedAt = content.metadataUpdatedAt,
        reviewStatus = content.reviewStatus.lowercase(),
        approvedRevisionNumber = content.approvedRevisionNumber,
        compatibility = compatibility,
    )

    private fun saveRevision(content: CourseContent, number: Int, userId: Long, changedAt: Instant) {
        revisionRepository.save(CourseContentRevision(
            content = content,
            revisionNumber = number,
            title = content.title,
            description = content.description,
            contentType = content.contentType,
            contentUrl = content.contentUrl,
            contentBody = content.contentBody,
            asset = content.asset,
            durationMinutes = content.durationMinutes,
            languageCode = content.languageCode,
            authorName = content.authorName,
            contentVersion = content.contentVersion,
            sourceName = content.sourceName,
            sourceUrl = content.sourceUrl,
            validFrom = content.validFrom,
            validUntil = content.validUntil,
            changedAt = changedAt,
            changedBy = userId,
        ))
    }

    private fun revisionDto(revision: CourseContentRevision) = CourseContentRevisionDto(
        id = requireNotNull(revision.id),
        contentId = requireNotNull(revision.content.id),
        revisionNumber = revision.revisionNumber,
        title = revision.title,
        description = revision.description,
        contentType = revision.contentType.name.lowercase(),
        contentUrl = revision.contentUrl,
        contentBody = revision.contentBody,
        asset = revision.asset?.let(::assetDto),
        durationMinutes = revision.durationMinutes,
        languageCode = revision.languageCode,
        authorName = revision.authorName,
        contentVersion = revision.contentVersion,
        sourceName = revision.sourceName,
        sourceUrl = revision.sourceUrl,
        validFrom = revision.validFrom,
        validUntil = revision.validUntil,
        changedAt = revision.changedAt,
        changedBy = revision.changedBy,
    )

    private fun language(value: String): String {
        val raw = value.trim()
        require(LANGUAGE_TAG.matches(raw)) { "Kontent tili BCP 47 formatida bo'lishi kerak, masalan uz yoki uz-Latn" }
        val normalized = Locale.forLanguageTag(raw).toLanguageTag()
        require(normalized != "und") { "Kontent tili aniqlangan bo'lishi kerak" }
        return normalized
    }

    private fun validateUrl(value: String?, label: String) {
        value?.takeIf(String::isNotBlank)?.let { raw ->
            require(raw.length <= 2000) { "$label 2000 belgidan oshmasligi kerak" }
            val uri = runCatching { URI(raw) }.getOrNull()
            require(uri?.scheme?.lowercase() in setOf("http", "https") && !uri?.host.isNullOrBlank()) {
                "$label faqat to'liq HTTP yoki HTTPS manzil bo'lishi kerak"
            }
        }
    }

    private fun String?.clean(): String? = this?.trim()?.takeIf(String::isNotBlank)
    private fun LocalDate?.orMax(): LocalDate = this ?: LocalDate.MAX

    private fun requireAssetMatchesType(asset: CourseContentAsset, type: CourseContentType) {
        when (type) {
            CourseContentType.VIDEO -> require(asset.mediaType in VIDEO_MEDIA_TYPES) {
                "Video kontenti uchun MP4 yoki WebM fayl yuklang"
            }
            CourseContentType.DOCUMENT -> require(asset.mediaType in DOCUMENT_MEDIA_TYPES) {
                "Hujjat kontenti uchun PDF, Office yoki matn fayli yuklang"
            }
            else -> Unit
        }
    }

    private fun assetDto(asset: CourseContentAsset) = CourseContentAssetDto(
        id = requireNotNull(asset.id),
        courseId = requireNotNull(asset.course.id),
        originalFileName = asset.originalFileName,
        mediaType = asset.mediaType,
        sizeBytes = asset.sizeBytes,
        sha256 = asset.sha256,
        uploadedAt = asset.createdAt,
    )

    companion object {
        private val VERSION = Regex("[A-Za-z0-9][A-Za-z0-9._-]{0,63}")
        private val LANGUAGE_TAG = Regex("[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*")
        private const val MAX_TEXT_LENGTH = 1_000_000
        private val VIDEO_MEDIA_TYPES = setOf("video/mp4", "video/webm")
        private val DOCUMENT_MEDIA_TYPES = setOf(
            "application/pdf",
            "text/plain",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-powerpoint",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
    }
}
