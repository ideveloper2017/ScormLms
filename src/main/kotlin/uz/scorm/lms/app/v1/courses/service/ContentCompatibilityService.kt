package uz.scorm.lms.app.v1.courses.service

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.courses.dto.ContentCompatibilityDto
import uz.scorm.lms.app.v1.courses.dto.ContentCompatibilityIssueDto
import uz.scorm.lms.app.v1.courses.model.Course
import uz.scorm.lms.app.v1.courses.model.CourseContent
import uz.scorm.lms.app.v1.courses.model.CourseEnrollmentStatus
import uz.scorm.lms.app.v1.courses.model.LearningItemStatus
import uz.scorm.lms.app.v1.courses.repository.CourseContentRepository
import uz.scorm.lms.app.v1.courses.repository.CourseEnrollmentRepository
import uz.scorm.lms.app.v1.student.model.StudentProfile
import uz.scorm.lms.app.v1.compliance.Decision559Rules

@Service
class ContentCompatibilityService(
    private val enrollmentRepository: CourseEnrollmentRepository,
    private val contentRepository: CourseContentRepository,
) {
    @Transactional(readOnly = true)
    fun evaluate(content: CourseContent): ContentCompatibilityDto =
        evaluateAll(content.module.course, setOf(content.languageCode)).getValue(content.languageCode)

    @Transactional(readOnly = true)
    fun evaluateAll(course: Course, contentLanguages: Collection<String>): Map<String, ContentCompatibilityDto> {
        val activeStudents = requireNotNull(course.id).let { courseId ->
            enrollmentRepository.findAllByCourseIdAndDeletedFalseOrderByEnrolledAtDesc(courseId)
                .filter { it.status == CourseEnrollmentStatus.ACTIVE }
                .map { it.student }
        }
        return contentLanguages.distinct().associateWith { language -> evaluate(course, language, activeStudents) }
    }

    @Transactional(readOnly = true)
    fun requireContentCompatible(content: CourseContent) {
        requireCompatible(evaluate(content))
    }

    @Transactional(readOnly = true)
    fun requireEnrollmentCompatible(course: Course, student: StudentProfile) {
        // Legacy drafts may remain unlinked, but no content can pass review/publish until the subject is linked.
        if (course.subject == null) return
        requireCompatible(evaluate(course, course.language.orEmpty(), listOf(student)))
    }

    @Transactional(readOnly = true)
    fun requirePublishedContentsCompatible(course: Course) {
        val published = contentRepository
            .findAllByModuleCourseIdAndDeletedFalseOrderByModulePositionAscPositionAsc(requireNotNull(course.id))
            .filter { it.status == LearningItemStatus.PUBLISHED.name }
        if (published.isEmpty()) return
        val results = evaluateAll(course, published.map { it.languageCode })
        published.forEach { content -> requireCompatible(results.getValue(content.languageCode)) }
    }

    private fun evaluate(
        course: Course,
        contentLanguage: String,
        activeStudents: List<StudentProfile>,
    ): ContentCompatibilityDto {
        val subject = course.subject
        val program = subject?.program
        val issues = buildList {
            if (subject == null) add(issue("COURSE_SUBJECT_REQUIRED", "Kurs katalogdagi fanga bog'lanishi shart"))
            if (subject != null && !subject.active) add(issue("SUBJECT_INACTIVE", "Kursga biriktirilgan fan faol emas"))
            if (subject != null && program == null) add(issue("SUBJECT_PROGRAM_REQUIRED", "Fan ta'lim dasturiga bog'lanmagan"))
            if (program != null && !program.active) add(issue("PROGRAM_INACTIVE", "Fan ta'lim dasturi faol emas"))
            if (program != null && !program.distanceEnabled) add(issue(
                "PROGRAM_DISTANCE_DISABLED", "Ta'lim dasturida masofaviy ta'limga ruxsat berilmagan",
            ))
            if (program != null && !Decision559Rules.isStudyDurationCompliant(
                    program.distanceEnabled,
                    program.fullTimeDurationMonths,
                    program.distanceDurationMonths,
                )) add(issue(
                "PROGRAM_DURATION_NON_COMPLIANT",
                "Masofaviy ta'lim davomiyligi kunduzgi normativdan kam bo'lmasligi kerak",
                listOfNotNull(program.fullTimeDurationMonths?.toString(), program.distanceDurationMonths?.toString()),
            ))
            if (program != null && !Decision559Rules.isFullTimeCounterpartCompliant(
                    program.distanceEnabled,
                    program.informationTechnologyProgram,
                    program.fullTimeAvailable,
                    program.fullTimeBasisReference,
                )) add(issue(
                "PROGRAM_FULL_TIME_COUNTERPART_REQUIRED",
                "AKTdan tashqari masofaviy dastur uchun tegishli kunduzgi ta'lim shakli va uning asos rekviziti majburiy",
                listOfNotNull(program.fullTimeBasisReference),
            ))
            if (course.language.isNullOrBlank()) add(issue("COURSE_LANGUAGE_REQUIRED", "Kurs ta'lim tili ko'rsatilishi shart"))
            if (!sameLanguage(course.language, program?.educationLanguage)) add(issue(
                "COURSE_PROGRAM_LANGUAGE_MISMATCH", "Kurs tili ta'lim dasturi tiliga mos emas",
                listOfNotNull(course.language, program?.educationLanguage),
            ))
            if (!sameLanguage(contentLanguage, course.language)) add(issue(
                "CONTENT_COURSE_LANGUAGE_MISMATCH", "Kontent tili kurs tiliga mos emas",
                listOf(contentLanguage, course.language.orEmpty()).filter(String::isNotBlank),
            ))
            if (!sameLanguage(contentLanguage, program?.educationLanguage)) add(issue(
                "CONTENT_PROGRAM_LANGUAGE_MISMATCH", "Kontent tili ta'lim dasturi tiliga mos emas",
                listOf(contentLanguage, program?.educationLanguage.orEmpty()).filter(String::isNotBlank),
            ))
            val wrongPrograms = activeStudents.filter { it.programId != program?.id }.map { it.studentNumber }.sorted()
            if (wrongPrograms.isNotEmpty()) add(issue(
                "ENROLLED_STUDENT_PROGRAM_MISMATCH", "Faol talabalar boshqa ta'lim dasturiga tegishli", wrongPrograms,
            ))
            val wrongLanguages = activeStudents.filter { !sameLanguage(it.educationLanguage, contentLanguage) }
                .map { it.studentNumber }.sorted()
            if (wrongLanguages.isNotEmpty()) add(issue(
                "ENROLLED_STUDENT_LANGUAGE_MISMATCH", "Faol talabalar ta'lim tili kontent tiliga mos emas", wrongLanguages,
            ))
        }
        return ContentCompatibilityDto(
            compatible = issues.isEmpty(),
            courseLanguage = course.language,
            contentLanguage = contentLanguage,
            subjectId = subject?.id,
            subjectName = subject?.name ?: course.subjectName,
            programId = program?.id,
            programName = program?.name,
            programLanguage = program?.educationLanguage,
            issues = issues,
        )
    }

    private fun requireCompatible(result: ContentCompatibilityDto) {
        require(result.compatible) {
            "Kontent tili va ta'lim dasturi mos emas: " + result.issues.joinToString("; ") { issue ->
                issue.message + issue.details.takeIf { it.isNotEmpty() }?.joinToString(prefix = " [", postfix = "]").orEmpty()
            }
        }
    }

    private fun sameLanguage(first: String?, second: String?): Boolean =
        primaryLanguage(first) != null && primaryLanguage(first) == primaryLanguage(second)

    private fun primaryLanguage(value: String?): String? = value?.trim()?.takeIf(String::isNotBlank)
        ?.substringBefore('-')?.lowercase()

    private fun issue(code: String, message: String, details: List<String> = emptyList()) =
        ContentCompatibilityIssueDto(code, message, details)
}
