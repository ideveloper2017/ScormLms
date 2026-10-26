package uz.scorm.lms.app.v1.courses.service

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.courses.dto.CourseCreateRequest
import uz.scorm.lms.app.v1.courses.dto.CourseDto
import uz.scorm.lms.app.v1.syllabus.dto.SubjectSyllabusDto
import uz.scorm.lms.app.v1.syllabus.dto.SyllabusTopicRequest
import uz.scorm.lms.app.v1.syllabus.model.SyllabusLanguage
import uz.scorm.lms.app.v1.syllabus.service.SubjectModelProgramService
import uz.scorm.lms.app.v1.syllabus.service.SubjectSyllabusService

/** "Fan dasturi va kurs" oynasining kurs qismi (null — faqat dastur yaratiladi). */
data class WizardCourseRequest(
    val title: String,
    val shortDescription: String? = null,
    val level: String? = null,
    val language: String? = null,
)

/** Fan dasturi (ishchi dastur): o'quv dasturidan o'quv yili va semestr uchun, mavzular va ixtiyoriy kurs bilan. */
data class WorkProgramRequest(
    val modelProgramId: Long,
    val academicYear: String,
    val semester: Int,
    val topics: List<SyllabusTopicRequest> = emptyList(),
    val course: WizardCourseRequest? = null,
)

data class SyllabusWithCourseDto(val syllabus: SubjectSyllabusDto, val course: CourseDto?)

/** Mavzular saqlangandan keyingi holat: dastur va unga bog'langan kurslar (qoralamalari yangilangan). */
data class SyllabusTopicsWithCoursesDto(val syllabus: SubjectSyllabusDto, val courses: List<SyllabusLinkedCourseDto>)

/**
 * Fan dasturi (reja) va undan qurilgan kurs bitta birlik sifatida: dastur, mavzular va kurs birga yaratiladi,
 * mavzular o'zgarganda qoralama kurslar bo'limlari ham yangilanadi.
 * Hammasi bitta tranzaksiyada: biror qism xato bersa, hech narsa saqlanmaydi.
 */
@Service
class SyllabusCourseWizardService(
    private val syllabusService: SubjectSyllabusService,
    private val courseService: CourseService,
    private val courseSyllabusService: CourseSyllabusService,
    private val modelPrograms: SubjectModelProgramService,
) {
    @Transactional
    fun create(request: WorkProgramRequest, ownerUserId: Long): SyllabusWithCourseDto {
        val model = modelPrograms.getEntity(request.modelProgramId)
        val syllabus = syllabusService.createWorkProgram(model, request.academicYear, request.semester, request.topics)
        val course = request.course?.let { course ->
            courseService.create(
                CourseCreateRequest(
                    title = course.title,
                    shortDescription = course.shortDescription,
                    subjectId = syllabus.subjectId,
                    syllabusId = syllabus.id,
                    level = course.level,
                    language = course.language ?: courseLanguage(syllabus.language),
                ),
                ownerUserId = ownerUserId,
                allowDraftSyllabus = true,
            )
        }
        return SyllabusWithCourseDto(syllabus, course)
    }

    @Transactional(readOnly = true)
    fun linkedCourses(syllabusId: Long): List<SyllabusLinkedCourseDto> = courseSyllabusService.linkedCourses(syllabusId)

    /** Mavzularni saqlaydi va shu dasturga bog'langan qoralama kurslarning bo'limlarini moslaydi. */
    @Transactional
    fun updateTopics(syllabusId: Long, topics: List<SyllabusTopicRequest>): SyllabusTopicsWithCoursesDto {
        val syllabus = syllabusService.updateTopics(syllabusId, topics)
        return SyllabusTopicsWithCoursesDto(syllabus, courseSyllabusService.syncDraftCourses(syllabusId))
    }

    private fun courseLanguage(language: SyllabusLanguage) = when (language) {
        SyllabusLanguage.RU -> "ru"
        SyllabusLanguage.EN -> "en"
        else -> "uz"
    }
}
