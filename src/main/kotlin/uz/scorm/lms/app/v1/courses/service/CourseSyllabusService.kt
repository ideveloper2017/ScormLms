package uz.scorm.lms.app.v1.courses.service

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.courses.dto.CourseSyllabusStatusDto
import uz.scorm.lms.app.v1.courses.dto.CourseSyllabusSyncResult
import uz.scorm.lms.app.v1.courses.dto.CourseSyllabusTopicDto
import uz.scorm.lms.app.v1.courses.model.Course
import uz.scorm.lms.app.v1.courses.model.CourseModule
import uz.scorm.lms.app.v1.courses.model.CourseStatus
import uz.scorm.lms.app.v1.courses.model.CourseUnit
import uz.scorm.lms.app.v1.courses.repository.CourseContentRepository
import uz.scorm.lms.app.v1.courses.repository.CourseUnitRepository
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
    private val unitRepository: CourseUnitRepository,
    private val unitService: CourseUnitService,
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
     * Kurs tuzilmasini dasturga moslaydi: dastur moduli — kurs moduli, dastur darsi — shu moduldagi kurs darsi,
     * dastur tartibida; o'qituvchi qo'shgan darslar o'z modulida dastur darslaridan keyin. Dasturdan o'chirilgan
     * dars yoki modulning bo'sh qolgani olib tashlanadi, material kiritilgani (o'qituvchi ishi) saqlanadi.
     * Kurs yaratilganda ham shu chaqiriladi.
     */
    fun applySync(course: Course, syllabus: SubjectSyllabus): SyncCounts {
        val courseId = requireNotNull(course.id)
        val units = syncUnits(course, syllabus)
        val modules = moduleRepository.findAllByCourseIdAndDeletedFalseOrderByPositionAsc(courseId)
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
            val unit = topic.module?.id?.let(units::get)
            linked[topic.id]?.also { module ->
                if (outdated(module, topic)) {
                    module.title = topic.title.take(255)
                    module.topicType = topic.type.name
                    module.plannedHours = topic.hours
                    changed += module
                    updated++
                }
                if (module.unit?.id != unit?.id) {
                    module.unit = unit
                    changed += module
                }
            } ?: CourseModule(
                course = course, title = topic.title.take(255), description = topic.description,
                position = 0, topicType = topic.type.name, plannedHours = topic.hours, syllabusTopicId = topic.id,
                unit = unit,
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
        removeEmptyOrphanUnits(courseId, units.values)
        // Umumiy tartib: modullar tartibida, har modul ichida dastur darslari, keyin qo'shimchalari
        unitService.normalize(courseId)
        course.syllabusRevision = syllabus.revisionNumber
        courseRepository.save(course)
        return SyncCounts(added, updated, removed)
    }

    /** Dastur moduli -> kurs moduli (nomi va tartibi dasturdan); o'qituvchi modullari ulardan keyin. */
    private fun syncUnits(course: Course, syllabus: SubjectSyllabus): Map<Long, CourseUnit> {
        val existing = unitRepository.findAllByCourseIdAndDeletedFalseOrderByPositionAsc(requireNotNull(course.id))
        val bySyllabusModule = existing.filter { it.syllabusModuleId != null }.associateBy { it.syllabusModuleId }
        val synced = syllabus.modules.sortedBy { it.sortOrder }.associate { module ->
            val title = module.name.take(255)
            val unit = bySyllabusModule[module.id]?.also {
                it.title = title
                it.description = module.description
            } ?: CourseUnit(course, title, module.description, syllabusModuleId = module.id)
            requireNotNull(module.id) to unit
        }
        val others = existing.filter { unit -> synced.values.none { it === unit } }
        (synced.values + others).forEachIndexed { index, unit ->
            unit.position = index + 1
            unitRepository.save(unit)
        }
        return synced
    }

    /** Dasturdan o'chirilgan modulning kurs moduli: darsi qolmagan bo'lsa olib tashlanadi */
    private fun removeEmptyOrphanUnits(courseId: Long, synced: Collection<CourseUnit>) {
        val lessons = moduleRepository.findAllByCourseIdAndDeletedFalseOrderByPositionAsc(courseId)
        unitRepository.findAllByCourseIdAndDeletedFalseOrderByPositionAsc(courseId)
            .filter { unit -> unit.fromSyllabus && synced.none { it.id == unit.id } && lessons.none { it.unit?.id == unit.id } }
            .forEach {
                it.deleted = true
                unitRepository.save(it)
            }
    }

    data class SyncCounts(val added: Int, val updated: Int, val removed: Int)

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
