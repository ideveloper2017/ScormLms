package uz.scorm.lms.app.v1.courses.service

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.courses.dto.CourseContentDto
import uz.scorm.lms.app.v1.courses.dto.CourseContentRequest
import uz.scorm.lms.app.v1.courses.model.CourseContent
import uz.scorm.lms.app.v1.courses.model.LearningItemStatus
import uz.scorm.lms.app.v1.courses.repository.CourseContentRepository
import java.net.URI
import java.time.Instant

@Service
class CourseContentService(
    private val contentRepository: CourseContentRepository,
    private val moduleService: CourseModuleService,
    private val accessService: CourseAccessService,
) {
    @Transactional(readOnly = true)
    fun list(courseId: Long, userId: Long, mayManageAll: Boolean): List<CourseContentDto> {
        val course = accessService.requireRead(courseId, userId, mayManageAll)
        val mayEdit = mayManageAll || course.userId == userId
        return contentRepository.findAllByModuleCourseIdAndDeletedFalseOrderByModulePositionAscPositionAsc(courseId)
            .filter { mayEdit || (it.status == LearningItemStatus.PUBLISHED.name && it.module.status == LearningItemStatus.PUBLISHED.name) }
            .map(::toDto)
    }

    @Transactional
    fun create(courseId: Long, moduleId: Long, request: CourseContentRequest, userId: Long, mayManageAll: Boolean): CourseContentDto {
        accessService.requireManage(courseId, userId, mayManageAll)
        val module = moduleService.ownedModule(courseId, moduleId)
        validate(request)
        val nextPosition = request.position ?: ((contentRepository
            .findFirstByModuleIdAndDeletedFalseOrderByPositionDesc(moduleId)?.position ?: 0) + 1)
        require(nextPosition > 0) { "Kontent tartibi musbat bo'lishi kerak" }
        return toDto(contentRepository.save(CourseContent(
            module = module,
            title = request.title.trim(),
            description = request.description?.trim(),
            contentType = request.contentType,
            contentUrl = request.contentUrl?.trim(),
            durationMinutes = request.durationMinutes,
            position = nextPosition,
        )))
    }

    @Transactional
    fun update(courseId: Long, contentId: Long, request: CourseContentRequest, userId: Long, mayManageAll: Boolean): CourseContentDto {
        accessService.requireManage(courseId, userId, mayManageAll)
        val content = ownedContent(courseId, contentId)
        validate(request)
        content.title = request.title.trim()
        content.description = request.description?.trim()
        content.contentType = request.contentType
        content.contentUrl = request.contentUrl?.trim()
        content.durationMinutes = request.durationMinutes
        request.position?.let { require(it > 0); content.position = it }
        return toDto(contentRepository.save(content))
    }

    @Transactional
    fun changeStatus(courseId: Long, contentId: Long, status: LearningItemStatus, userId: Long, mayManageAll: Boolean): CourseContentDto {
        accessService.requireManage(courseId, userId, mayManageAll)
        val content = ownedContent(courseId, contentId)
        require(status != LearningItemStatus.PUBLISHED || content.module.status == LearningItemStatus.PUBLISHED.name) {
            "Kontentdan oldin modulni nashr qiling"
        }
        content.status = status.name
        content.publishedAt = if (status == LearningItemStatus.PUBLISHED) content.publishedAt ?: Instant.now() else null
        return toDto(contentRepository.save(content))
    }

    @Transactional
    fun delete(courseId: Long, contentId: Long, userId: Long, mayManageAll: Boolean) {
        accessService.requireManage(courseId, userId, mayManageAll)
        val content = ownedContent(courseId, contentId)
        content.deleted = true
        contentRepository.save(content)
    }

    private fun ownedContent(courseId: Long, contentId: Long): CourseContent = contentRepository.findById(contentId)
        .filter { !it.deleted && it.module.course.id == courseId }
        .orElseThrow { NoSuchElementException("Kurs kontenti topilmadi: $contentId") }

    private fun validate(request: CourseContentRequest) {
        require(request.title.isNotBlank()) { "Kontent nomi majburiy" }
        require(request.title.length <= 255) { "Kontent nomi 255 belgidan oshmasligi kerak" }
        request.durationMinutes?.let { require(it >= 0) { "Davomiylik manfiy bo'lmaydi" } }
        request.contentUrl?.takeIf(String::isNotBlank)?.let { raw ->
            val uri = runCatching { URI(raw) }.getOrNull()
            require(uri?.scheme in setOf("http", "https")) { "Kontent URL faqat HTTP yoki HTTPS bo'lishi kerak" }
        }
    }

    private fun toDto(content: CourseContent) = CourseContentDto(
        id = requireNotNull(content.id),
        courseId = requireNotNull(content.module.course.id),
        moduleId = requireNotNull(content.module.id),
        moduleTitle = content.module.title,
        title = content.title,
        description = content.description,
        contentType = content.contentType.name.lowercase(),
        contentUrl = content.contentUrl,
        durationMinutes = content.durationMinutes,
        position = content.position,
        status = content.status.lowercase(),
        publishedAt = content.publishedAt,
    )
}
