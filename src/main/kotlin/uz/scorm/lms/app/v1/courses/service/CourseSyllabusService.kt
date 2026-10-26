package uz.scorm.lms.app.v1.courses.service

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.courses.dto.CourseSyllabusStatusDto
import uz.scorm.lms.app.v1.courses.dto.CourseSyllabusSyncResult
import uz.scorm.lms.app.v1.courses.dto.CourseSyllabusTopicDto
import uz.scorm.lms.app.v1.courses.model.Course
import uz.scorm.lms.app.v1.courses.model.CourseModule
import uz.scorm.lms.app.v1.courses.model.CourseStatus
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
) {
    @Transactional(readOnly = true)
    fun status(courseId: Long, userId: Long, mayManageAll: Boolean): CourseSyllabusStatusDto {
        val course = accessService.requireManage(courseId, userId, mayManageAll)
        return status(course, requireSyllabus(course))
    }

    /**
     * Qo'shilmagan mavzular kurs oxiriga yangi bo'lim (qoralama) sifatida qo'shiladi, bog'langan bo'limlarning
     * nomi, turi va soati dasturdagiga moslanadi. Bo'limlar va ulardagi darslar o'chirilmaydi.
     */
    @Transactional
    fun sync(courseId: Long, userId: Long, mayManageAll: Boolean): CourseSyllabusSyncResult {
        val course = accessService.requireManage(courseId, userId, mayManageAll)
        val syllabus = requireSyllabus(course)
        require(syllabus.status == "APPROVED") {
            "O'quv dasturining yangi versiyasi hali tasdiqlanmagan — tasdiqlangandan keyin sinxronlang"
        }
        val (added, updated) = applySync(course, syllabus)
        return CourseSyllabusSyncResult(added, updated, status(course, syllabus))
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
                val (added, updated) = applySync(course, requireSyllabus(course))
                linked(course, added, updated)
            } else linked(course)
        }

    private fun applySync(course: Course, syllabus: SubjectSyllabus): Pair<Int, Int> {
        val modules = moduleRepository.findAllByCourseIdAndDeletedFalseOrderByPositionAsc(requireNotNull(course.id))
        val linked = modules.filter { it.syllabusTopicId != null }.associateBy { it.syllabusTopicId }
        var position = modules.maxOfOrNull { it.position } ?: 0
        var added = 0
        var updated = 0
        for (topic in ordered(syllabus)) {
            val module = linked[topic.id]
            if (module == null) {
                moduleRepository.save(CourseModule(
                    course = course, title = topic.title.take(255), description = topic.description,
                    position = ++position, topicType = topic.type.name, plannedHours = topic.hours, syllabusTopicId = topic.id,
                ))
                added++
            } else if (outdated(module, topic)) {
                module.title = topic.title.take(255)
                module.topicType = topic.type.name
                module.plannedHours = topic.hours
                moduleRepository.save(module)
                updated++
            }
        }
        course.syllabusRevision = syllabus.revisionNumber
        courseRepository.save(course)
        return added to updated
    }

    private fun linked(course: Course, added: Int = 0, updated: Int = 0) = SyllabusLinkedCourseDto(
        id = requireNotNull(course.id), title = course.title.orEmpty(), status = course.status.orEmpty().lowercase(),
        autoSync = course.status == CourseStatus.DRAFT.name, added = added, updated = updated,
    )

    private fun status(course: Course, syllabus: SubjectSyllabus): CourseSyllabusStatusDto {
        val modules = moduleRepository.findAllByCourseIdAndDeletedFalseOrderByPositionAsc(requireNotNull(course.id))
            .filter { it.syllabusTopicId != null }.associateBy { it.syllabusTopicId }
        val topics = ordered(syllabus).map { topic ->
            val module = modules[topic.id]
            CourseSyllabusTopicDto(
                topicId = requireNotNull(topic.id), type = topic.type.name, sortOrder = topic.sortOrder,
                title = topic.title, hours = topic.hours, moduleId = module?.id, moduleTitle = module?.title,
                outdated = module != null && outdated(module, topic),
            )
        }
        return CourseSyllabusStatusDto(
            syllabusId = requireNotNull(syllabus.id), syllabusName = syllabus.name, syllabusStatus = syllabus.status,
            syllabusRevision = syllabus.revisionNumber, courseSyllabusRevision = course.syllabusRevision,
            topics = topics, pendingCount = topics.count { it.moduleId == null || it.outdated },
        )
    }

    private fun requireSyllabus(course: Course) = requireNotNull(course.syllabus) { "Kurs o'quv dasturiga bog'lanmagan" }

    private fun ordered(syllabus: SubjectSyllabus) = syllabus.topics.sortedWith(compareBy({ it.type }, { it.sortOrder }))

    private fun outdated(module: CourseModule, topic: SubjectSyllabusTopic) =
        module.title != topic.title.take(255) || module.topicType != topic.type.name || module.plannedHours != topic.hours
}
