package uz.scorm.lms.app.v1.courses.service

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.courses.dto.CourseSyllabusStatusDto
import uz.scorm.lms.app.v1.courses.dto.CourseSyllabusSyncResult
import uz.scorm.lms.app.v1.courses.dto.CourseSyllabusTopicDto
import uz.scorm.lms.app.v1.courses.model.Course
import uz.scorm.lms.app.v1.courses.model.CourseModule
import uz.scorm.lms.app.v1.courses.model.CourseStatus
import uz.scorm.lms.app.v1.courses.repository.CourseContentRepository
import uz.scorm.lms.app.v1.courses.repository.CourseModuleRepository
import uz.scorm.lms.app.v1.courses.repository.CourseRepository
import uz.scorm.lms.app.v1.syllabus.model.SubjectSyllabus
import uz.scorm.lms.app.v1.syllabus.model.SubjectSyllabusTopic

/** Dasturga bog'langan kurs va mavzular bilan moslash natijasi. */
data class SyllabusLinkedCourseDto(
    val id: Long,
    val title: String,
    val status: String,
    /** Qoralama kurs mavzular o'zgarganda avtomatik yangilanadi; nashr qilingani — kurs sahifasida sinxronlanadi */
    val autoSync: Boolean,
    val added: Int = 0,
    val updated: Int = 0,
    /** Dasturdan o'chirilgan darslarning bo'sh bo'limlari olib tashlandi */
    val removed: Int = 0,
)

/**
 * Kurs bo'limlarini u asos qilingan o'quv dasturi mavzulari bilan moslash:
 * qaysi mavzu kursga qo'shilgan/qo'shilmaganini ko'rsatish va dastur bilan sinxronlash.
 */
@Service
class CourseSyllabusService(
    private val accessService: CourseAccessService,
    private val courseRepository: CourseRepository,
    private val moduleRepository: CourseModuleRepository,
    private val contentRepository: CourseContentRepository,
) {
    @Transactional(readOnly = true)
    fun status(courseId: Long, userId: Long, mayManageAll: Boolean): CourseSyllabusStatusDto {
        val course = accessService.requireManage(courseId, userId, mayManageAll)
        return status(course, requireSyllabus(course))
    }

    /**
     * Qo'shilmagan darslar yangi bo'lim (qoralama) sifatida dastur tartibida qo'shiladi, bog'langan bo'limlarning
     * nomi, turi va soati dasturdagiga moslanadi. Kontent kiritilgan bo'lim hech qachon o'chirilmaydi.
     */
    @Transactional
    fun sync(courseId: Long, userId: Long, mayManageAll: Boolean): CourseSyllabusSyncResult {
        val course = accessService.requireManage(courseId, userId, mayManageAll)
        val syllabus = requireSyllabus(course)
        require(syllabus.status == "APPROVED") {
            "O'quv dasturining yangi versiyasi hali tasdiqlanmagan — tasdiqlangandan keyin sinxronlang"
        }
        val counts = applySync(course, syllabus)
        return CourseSyllabusSyncResult(counts.added, counts.updated, status(course, syllabus), counts.removed)
    }

    /** Dasturga bog'langan kurslar (dastur mavzulari oynasida ko'rsatiladi). */
    @Transactional(readOnly = true)
    fun linkedCourses(syllabusId: Long): List<SyllabusLinkedCourseDto> =
        courseRepository.findAllBySyllabusIdAndDeletedFalseOrderByCreatedAtDesc(syllabusId).map { linked(it) }

    /**
     * Mavzular o'zgargandan keyin: hali nashr qilinmagan (qoralama) kurslar bo'limlari avtomatik moslanadi.
     * Nashr qilingan kurslarda talabalar o'qiyotgani uchun ularga jimgina tegilmaydi.
     */
    @Transactional
    fun syncDraftCourses(syllabusId: Long): List<SyllabusLinkedCourseDto> =
        courseRepository.findAllBySyllabusIdAndDeletedFalseOrderByCreatedAtDesc(syllabusId).map { course ->
            if (course.status == CourseStatus.DRAFT.name) {
                val counts = applySync(course, requireSyllabus(course))
                linked(course, counts.added, counts.updated, counts.removed)
            } else linked(course)
        }

    /**
     * Kurs bo'limlarini dastur tuzilmasiga moslaydi: har dars — bitta bo'lim, dastur modullari va darslari tartibida;
     * o'qituvchi qo'lda qo'shgan bo'limlar ulardan keyin. Dasturdan o'chirilgan darsning bo'sh bo'limi olib
     * tashlanadi, kontent kiritilgan bo'lim (o'qituvchi ishi) saqlanadi.
     */
    private fun applySync(course: Course, syllabus: SubjectSyllabus): SyncCounts {
        val modules = moduleRepository.findAllByCourseIdAndDeletedFalseOrderByPositionAsc(requireNotNull(course.id))
        val lessons = syllabus.orderedLessons()
        val lessonIds = lessons.mapNotNull { it.id }.toSet()
        var removed = 0
        val kept = modules.filter { module ->
            val orphan = module.fromSyllabus && (module.syllabusTopicId == null || module.syllabusTopicId !in lessonIds)
            if (orphan && contentRepository.countByModuleIdAndDeletedFalse(requireNotNull(module.id)) == 0L) {
                module.deleted = true
                moduleRepository.save(module)
                removed++
                false
            } else true
        }
        val linked = kept.filter { it.syllabusTopicId != null }.associateBy { it.syllabusTopicId }
        var added = 0
        var updated = 0
        val changed = mutableSetOf<CourseModule>()
        val lessonSections = lessons.map { topic ->
            linked[topic.id]?.also { module ->
                if (outdated(module, topic)) {
                    module.title = topic.title.take(255)
                    module.topicType = topic.type.name
                    module.plannedHours = topic.hours
                    changed += module
                    updated++
                }
            } ?: CourseModule(
                course = course, title = topic.title.take(255), description = topic.description,
                position = 0, topicType = topic.type.name, plannedHours = topic.hours, syllabusTopicId = topic.id,
            ).also { changed += it; added++ }
        }
        val others = kept.filter { module -> lessonSections.none { it === module } }
        (lessonSections + others).forEachIndexed { index, module ->
            if (module.position != index + 1) {
                module.position = index + 1
                changed += module
            }
        }
        changed.forEach(moduleRepository::save)
        course.syllabusRevision = syllabus.revisionNumber
        courseRepository.save(course)
        return SyncCounts(added, updated, removed)
    }

    private data class SyncCounts(val added: Int, val updated: Int, val removed: Int)

    private fun linked(course: Course, added: Int = 0, updated: Int = 0, removed: Int = 0) = SyllabusLinkedCourseDto(
        id = requireNotNull(course.id), title = course.title.orEmpty(), status = course.status.orEmpty().lowercase(),
        autoSync = course.status == CourseStatus.DRAFT.name, added = added, updated = updated, removed = removed,
    )

    private fun status(course: Course, syllabus: SubjectSyllabus): CourseSyllabusStatusDto {
        val modules = moduleRepository.findAllByCourseIdAndDeletedFalseOrderByPositionAsc(requireNotNull(course.id))
            .filter { it.syllabusTopicId != null }.associateBy { it.syllabusTopicId }
        val topics = syllabus.orderedLessons().map { topic ->
            val module = modules[topic.id]
            CourseSyllabusTopicDto(
                topicId = requireNotNull(topic.id), type = topic.type.name, sortOrder = topic.sortOrder,
                title = topic.title, hours = topic.hours, moduleId = module?.id, moduleTitle = module?.title,
                outdated = module != null && outdated(module, topic), syllabusModuleName = topic.module?.name,
            )
        }
        return CourseSyllabusStatusDto(
            syllabusId = requireNotNull(syllabus.id), syllabusName = syllabus.name, syllabusStatus = syllabus.status,
            syllabusRevision = syllabus.revisionNumber, courseSyllabusRevision = course.syllabusRevision,
            topics = topics, pendingCount = topics.count { it.moduleId == null || it.outdated },
        )
    }

    private fun requireSyllabus(course: Course) = requireNotNull(course.syllabus) { "Kurs o'quv dasturiga bog'lanmagan" }

    private fun outdated(module: CourseModule, topic: SubjectSyllabusTopic) =
        module.title != topic.title.take(255) || module.topicType != topic.type.name || module.plannedHours != topic.hours
}
