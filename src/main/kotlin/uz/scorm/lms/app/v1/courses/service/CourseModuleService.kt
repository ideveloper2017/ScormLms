package uz.scorm.lms.app.v1.courses.service

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.courses.dto.CourseModuleDto
import uz.scorm.lms.app.v1.courses.dto.CourseModuleRequest
import uz.scorm.lms.app.v1.courses.model.Course
import uz.scorm.lms.app.v1.courses.model.CourseModule
import uz.scorm.lms.app.v1.syllabus.model.SubjectSyllabusModule
import uz.scorm.lms.app.v1.syllabus.model.SubjectSyllabusTopic
import uz.scorm.lms.app.v1.courses.model.LearningItemStatus
import uz.scorm.lms.app.v1.courses.repository.CourseContentRepository
import uz.scorm.lms.app.v1.courses.repository.CourseModuleRepository
import java.time.Instant

@Service
class CourseModuleService(
    private val moduleRepository: CourseModuleRepository,
    private val contentRepository: CourseContentRepository,
    private val accessService: CourseAccessService,
) {
    @Transactional(readOnly = true)
    fun list(courseId: Long, userId: Long, mayManageAll: Boolean): List<CourseModuleDto> {
        val course = accessService.requireRead(courseId, userId, mayManageAll)
        val mayEdit = mayManageAll || course.userId == userId
        val groups = lessonGroups(course)
        return moduleRepository.findAllByCourseIdAndDeletedFalseOrderByPositionAsc(courseId)
            .filter { mayEdit || it.status == LearningItemStatus.PUBLISHED.name }
            .map { toDto(it, groups) }
    }

    @Transactional
    fun create(courseId: Long, request: CourseModuleRequest, userId: Long, mayManageAll: Boolean): CourseModuleDto {
        val course = accessService.requireManage(courseId, userId, mayManageAll)
        val topic = request.syllabusTopicId?.let { topicId ->
            val syllabus = requireNotNull(course.syllabus) { "Kurs o'quv dasturiga bog'lanmagan" }
            val topic = syllabus.topics.firstOrNull { it.id == topicId }
                ?: throw IllegalArgumentException("Mavzu kurs o'quv dasturiga tegishli emas: $topicId")
            require(!moduleRepository.existsByCourseIdAndSyllabusTopicIdAndDeletedFalse(courseId, topicId)) {
                "Bu mavzu kursga allaqachon bo'lim sifatida qo'shilgan"
            }
            topic
        }
        val title = validTitle(request.title.ifBlank { topic?.title?.take(255).orEmpty() })
        val nextPosition = request.position ?: topic?.let { lessonPosition(course, it) } ?: ((moduleRepository
            .findFirstByCourseIdAndDeletedFalseOrderByPositionDesc(courseId)?.position ?: 0) + 1)
        require(nextPosition > 0) { "Modul tartibi musbat bo'lishi kerak" }
        return toDto(moduleRepository.save(CourseModule(
            course = course,
            title = title,
            description = request.description?.trim(),
            position = nextPosition,
            topicType = topic?.type?.name ?: validTopicType(request.topicType),
            plannedHours = topic?.hours ?: validHours(request.plannedHours),
            syllabusTopicId = topic?.id,
        )), lessonGroups(course))
    }

    @Transactional
    fun update(courseId: Long, moduleId: Long, request: CourseModuleRequest, userId: Long, mayManageAll: Boolean): CourseModuleDto {
        accessService.requireManage(courseId, userId, mayManageAll)
        val module = ownedModule(courseId, moduleId)
        module.title = validTitle(request.title)
        module.description = request.description?.trim()
        request.position?.let { require(it > 0); module.position = it }
        request.topicType?.let { module.topicType = validTopicType(it) }
        request.plannedHours?.let { module.plannedHours = validHours(it) }
        return toDto(moduleRepository.save(module), lessonGroups(module.course))
    }

    @Transactional
    fun changeStatus(courseId: Long, moduleId: Long, status: LearningItemStatus, userId: Long, mayManageAll: Boolean): CourseModuleDto {
        accessService.requireManage(courseId, userId, mayManageAll)
        val module = ownedModule(courseId, moduleId)
        module.status = status.name
        module.publishedAt = if (status == LearningItemStatus.PUBLISHED) module.publishedAt ?: Instant.now() else null
        return toDto(moduleRepository.save(module), lessonGroups(module.course))
    }

    @Transactional
    fun delete(courseId: Long, moduleId: Long, userId: Long, mayManageAll: Boolean) {
        accessService.requireManage(courseId, userId, mayManageAll)
        val module = ownedModule(courseId, moduleId)
        contentRepository.findAllByModuleIdAndDeletedFalseOrderByPositionAsc(moduleId).forEach {
            it.deleted = true
            contentRepository.save(it)
        }
        module.deleted = true
        moduleRepository.save(module)
    }

    fun ownedModule(courseId: Long, moduleId: Long): CourseModule = moduleRepository.findById(moduleId)
        .filter { !it.deleted && it.course.id == courseId }
        .orElseThrow { NoSuchElementException("Kurs moduli topilmadi: $moduleId") }

    /**
     * Dars bo'limi dastur tartibidagi joyiga qo'yiladi: undan oldingi darslar bo'limlaridan keyin
     * (kontent sahifasida modul guruhi buzilmasin); keyingi bo'limlar bir pog'ona suriladi.
     */
    private fun lessonPosition(course: Course, topic: SubjectSyllabusTopic): Int {
        val lessons = requireNotNull(course.syllabus).orderedLessons()
        val before = lessons.takeWhile { it.id != topic.id }.mapNotNull { it.id }.toSet()
        val modules = moduleRepository.findAllByCourseIdAndDeletedFalseOrderByPositionAsc(requireNotNull(course.id))
        val position = (modules.filter { it.syllabusTopicId in before }.maxOfOrNull { it.position } ?: 0) + 1
        modules.filter { it.position >= position }.forEach {
            it.position += 1
            moduleRepository.save(it)
        }
        return position
    }

    /** Dastur darsi -> uning moduli (kurs bo'limlarini o'quv dasturi modullari bo'yicha guruhlash uchun) */
    private fun lessonGroups(course: Course): Map<Long, SubjectSyllabusModule> =
        course.syllabus?.topics.orEmpty().mapNotNull { topic -> topic.module?.let { requireNotNull(topic.id) to it } }.toMap()

    private fun toDto(module: CourseModule, groups: Map<Long, SubjectSyllabusModule>) = CourseModuleDto(
        id = requireNotNull(module.id),
        courseId = requireNotNull(module.course.id),
        title = module.title,
        description = module.description,
        position = module.position,
        status = module.status.lowercase(),
        contentCount = contentRepository.countByModuleIdAndDeletedFalse(requireNotNull(module.id)).toInt(),
        publishedAt = module.publishedAt,
        topicType = module.topicType,
        plannedHours = module.plannedHours,
        syllabusTopicId = module.syllabusTopicId,
        syllabusModuleId = module.syllabusTopicId?.let(groups::get)?.id,
        syllabusModuleName = module.syllabusTopicId?.let(groups::get)?.name,
        syllabusModuleOrder = module.syllabusTopicId?.let(groups::get)?.sortOrder,
    )

    private fun validTopicType(value: String?): String? = value?.trim()?.uppercase()?.ifBlank { null }?.also {
        require(it in TOPIC_TYPES) { "Mashg'ulot turi: ${TOPIC_TYPES.joinToString()}" }
    }

    private fun validHours(value: Int?): Int? = value?.also { require(it in 1..200) { "Modul soati 1-200 oralig'ida bo'lishi kerak" } }

    private companion object {
        val TOPIC_TYPES = uz.scorm.lms.app.v1.syllabus.model.SyllabusTopicType.entries.map { it.name }.toSet()
    }

    private fun validTitle(value: String): String = value.trim().also {
        require(it.isNotBlank()) { "Modul nomi majburiy" }
        require(it.length <= 255) { "Modul nomi 255 belgidan oshmasligi kerak" }
    }
}
