package uz.scorm.lms.app.v1.courses.service

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.multipart.MultipartFile
import uz.scorm.lms.app.v1.courses.dto.CourseContentAssetDto
import uz.scorm.lms.app.v1.courses.dto.SubjectMaterialDto
import uz.scorm.lms.app.v1.courses.dto.SubjectMaterialRequest
import uz.scorm.lms.app.v1.courses.dto.SubjectMaterialSubjectDto
import uz.scorm.lms.app.v1.courses.model.CourseContentType
import uz.scorm.lms.app.v1.courses.model.SubjectMaterial
import uz.scorm.lms.app.v1.courses.repository.CourseContentAssetRepository
import uz.scorm.lms.app.v1.courses.repository.SubjectMaterialRepository
import uz.scorm.lms.app.v1.subject.repository.SubjectRepository
import uz.scorm.lms.app.v1.subjectgroup.repository.AcademicSubjectGroupTeacherAssignmentRepository
import uz.scorm.lms.app.v1.teacher.repository.TeacherRepository
import uz.scorm.lms.app.v1.user.repository.UserRepository
import java.net.URI

@Service
class SubjectMaterialService(
    private val materials: SubjectMaterialRepository,
    private val assets: CourseContentAssetRepository,
    private val subjects: SubjectRepository,
    private val users: UserRepository,
    private val teachers: TeacherRepository,
    private val assignments: AcademicSubjectGroupTeacherAssignmentRepository,
    private val assetService: CourseContentAssetService,
) {
    @Transactional(readOnly = true)
    fun list(userId: Long, mayManageAll: Boolean): List<SubjectMaterialDto> {
        val items = if (mayManageAll) {
            materials.findAllByActiveTrueAndDeletedFalseOrderByUpdatedAtDesc()
        } else {
            val subjectIds = assignedSubjectIds(userId)
            if (subjectIds.isEmpty()) emptyList()
            else materials.findAllBySubjectIdInAndActiveTrueAndDeletedFalseOrderByUpdatedAtDesc(subjectIds)
        }
        return items.map(::toDto)
    }

    @Transactional(readOnly = true)
    fun subjects(userId: Long, mayManageAll: Boolean): List<SubjectMaterialSubjectDto> {
        val allowedIds = if (mayManageAll) null else assignedSubjectIds(userId)
        return subjects.findAll()
            .asSequence()
            .filter { !it.deleted && it.active }
            .filter { allowedIds == null || it.id in allowedIds }
            .sortedBy { it.name.lowercase() }
            .map { SubjectMaterialSubjectDto(requireNotNull(it.id), it.name) }
            .toList()
    }

    @Transactional
    fun upload(subjectId: Long, file: MultipartFile, userId: Long, mayManageAll: Boolean): CourseContentAssetDto {
        val subject = subject(subjectId)
        requireSubjectAccess(subjectId, userId, mayManageAll)
        return assetService.uploadForSubject(subject, file, userId)
    }

    @Transactional
    fun create(request: SubjectMaterialRequest, userId: Long, mayManageAll: Boolean): SubjectMaterialDto {
        val subject = subject(request.subjectId)
        requireSubjectAccess(request.subjectId, userId, mayManageAll)
        val user = users.findById(userId).orElseThrow { NoSuchElementException("Foydalanuvchi topilmadi") }
        val url = request.contentUrl.clean()
        val body = request.contentBody.clean()
        val asset = request.assetId?.let { assets.findByIdAndSubjectIdAndDeletedFalse(it, request.subjectId) }
        validate(request, url, body, asset != null)
        val saved = materials.save(SubjectMaterial(
            subject = subject,
            asset = asset,
            ownerUserId = userId,
            title = request.title.trim(),
            description = request.description.clean(),
            contentType = request.contentType,
            contentUrl = url,
            contentBody = body,
            languageCode = request.languageCode.trim().ifBlank { "uz" },
            authorName = user.fullName?.trim()?.takeIf { it.isNotBlank() } ?: user.username,
            contentVersion = request.contentVersion.trim().ifBlank { "1.0" },
            sourceName = request.sourceName.clean() ?: subject.name,
            sourceUrl = request.sourceUrl.clean(),
        ))
        return toDto(saved)
    }

    @Transactional
    fun delete(id: Long, userId: Long, mayManageAll: Boolean) {
        val material = requireMaterial(id)
        require(mayManageAll || material.ownerUserId == userId) { "Materialni o'chirish ruxsati yo'q" }
        material.active = false
        material.deleted = true
        materials.save(material)
    }

    @Transactional(readOnly = true)
    fun requireMaterial(id: Long): SubjectMaterial = materials.findByIdAndActiveTrueAndDeletedFalse(id)
        ?: throw NoSuchElementException("Fan materiali topilmadi: $id")

    private fun validate(request: SubjectMaterialRequest, url: String?, body: String?, hasAsset: Boolean) {
        require(request.title.trim().length in 2..255) { "Material nomi 2-255 belgi bo'lishi kerak" }
        validateUrl(request.sourceUrl, "Manba URL")
        when (request.contentType) {
            CourseContentType.TEXT -> require(!body.isNullOrBlank() && url == null && !hasAsset) {
                "Matnli material uchun faqat dars matnini kiriting"
            }
            CourseContentType.LINK -> {
                validateUrl(url, "Material URL")
                require(url != null && body == null && !hasAsset) { "Havola materiali uchun URL majburiy" }
            }
            else -> {
                validateUrl(url, "Material URL")
                require((url != null) xor hasAsset) { "Bitta fayl yoki bitta URL tanlang" }
                require(body == null) { "Faylli materialga matn kiritilmaydi" }
            }
        }
    }

    private fun requireSubjectAccess(subjectId: Long, userId: Long, mayManageAll: Boolean) {
        require(mayManageAll || subjectId in assignedSubjectIds(userId)) {
            "O'qituvchiga ushbu fan biriktirilmagan"
        }
    }

    private fun assignedSubjectIds(userId: Long): Set<Long> {
        val directIds = teachers.findByUserId(userId)
            ?.takeIf { it.active && !it.deleted }
            ?.subjects
            ?.asSequence()
            ?.filter { it.active && !it.deleted }
            ?.mapNotNull { it.id }
            ?.toSet()
            .orEmpty()
        return directIds + assignments.findAssignedSubjectIds(userId)
    }

    private fun subject(id: Long) = subjects.findById(id)
        .filter { !it.deleted && it.active }
        .orElseThrow { NoSuchElementException("Fan topilmadi: $id") }

    private fun toDto(material: SubjectMaterial) = SubjectMaterialDto(
        id = requireNotNull(material.id),
        subjectId = requireNotNull(material.subject.id),
        subjectName = material.subject.name,
        title = material.title,
        description = material.description,
        contentType = material.contentType.name.lowercase(),
        contentUrl = material.contentUrl,
        contentBody = material.contentBody,
        asset = material.asset?.let(assetService::toDto),
        languageCode = material.languageCode,
        authorName = material.authorName,
        contentVersion = material.contentVersion,
        sourceName = material.sourceName,
        sourceUrl = material.sourceUrl,
        createdAt = material.createdAt,
        updatedAt = material.updatedAt,
    )

    private fun validateUrl(value: String?, label: String) {
        value.clean()?.let { raw ->
            val uri = runCatching { URI(raw) }.getOrNull()
            require(raw.length <= 2000 && uri?.scheme?.lowercase() in setOf("http", "https") && !uri?.host.isNullOrBlank()) {
                "$label to'liq HTTP yoki HTTPS manzil bo'lishi kerak"
            }
        }
    }

    private fun String?.clean(): String? = this?.trim()?.takeIf(String::isNotBlank)
}
