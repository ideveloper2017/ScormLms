package uz.scorm.lms.app.v1.courses.service

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.courses.dto.CourseSyllabusStatusDto
import uz.scorm.lms.app.v1.courses.dto.CourseSyllabusSyncResult
import uz.scorm.lms.app.v1.courses.dto.CourseSyllabusTopicDto
import uz.scorm.lms.app.v1.courses.model.Course
import uz.scorm.lms.app.v1.courses.model.CourseModule
import uz.scorm.lms.app.v1.courses.repository.CourseModuleRepository
import uz.scorm.lms.app.v1.courses.repository.CourseRepository
import uz.scorm.lms.app.v1.syllabus.model.SubjectSyllabus
import uz.scorm.lms.app.v1.syllabus.model.SubjectSyllabusTopic

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
        val modules = moduleRepository.findAllByCourseIdAndDeletedFalseOrderByPositionAsc(courseId)
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
        return CourseSyllabusSyncResult(added, updated, status(course, syllabus))
    }

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
