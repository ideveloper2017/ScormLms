package uz.scorm.lms.app.v1.courses.service

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.courses.dto.CourseCreateRequest
import uz.scorm.lms.app.v1.courses.dto.CourseDto
import uz.scorm.lms.app.v1.syllabus.dto.SubjectSyllabusDto
import uz.scorm.lms.app.v1.syllabus.dto.SubjectSyllabusRequest
import uz.scorm.lms.app.v1.syllabus.model.SyllabusLanguage
import uz.scorm.lms.app.v1.syllabus.service.SubjectSyllabusService

/** "Fan dasturi va kurs" oynasining kurs qismi (null — faqat dastur yaratiladi). */
data class WizardCourseRequest(
    val title: String,
    val shortDescription: String? = null,
    val level: String? = null,
    val language: String? = null,
)

data class SyllabusWithCourseRequest(
    val syllabus: SubjectSyllabusRequest,
    val course: WizardCourseRequest? = null,
)

data class SyllabusWithCourseDto(val syllabus: SubjectSyllabusDto, val course: CourseDto?)

/**
 * Fan dasturi, uning nazariy/amaliy mavzulari va shu dastur asosidagi kursni bitta qadamda yaratadi.
 * Hammasi bitta tranzaksiyada: biror qism xato bersa, hech narsa saqlanmaydi.
 */
@Service
class SyllabusCourseWizardService(
    private val syllabusService: SubjectSyllabusService,
    private val courseService: CourseService,
) {
    @Transactional
    fun create(request: SyllabusWithCourseRequest, ownerUserId: Long): SyllabusWithCourseDto {
        val syllabus = syllabusService.create(request.syllabus.copy(topics = request.syllabus.topics ?: emptyList()))
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

    private fun courseLanguage(language: SyllabusLanguage) = when (language) {
        SyllabusLanguage.RU -> "ru"
        SyllabusLanguage.EN -> "en"
        else -> "uz"
    }
}
