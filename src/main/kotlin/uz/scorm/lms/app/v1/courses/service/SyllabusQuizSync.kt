package uz.scorm.lms.app.v1.courses.service

import org.springframework.stereotype.Component
import tools.jackson.core.type.TypeReference
import tools.jackson.databind.ObjectMapper
import uz.scorm.lms.app.v1.courses.model.Course
import uz.scorm.lms.app.v1.courses.model.CourseModule
import uz.scorm.lms.app.v1.quiz.model.CourseQuiz
import uz.scorm.lms.app.v1.quiz.model.CourseQuizQuestion
import uz.scorm.lms.app.v1.quiz.model.QuizQuestion
import uz.scorm.lms.app.v1.quiz.model.QuizQuestionType
import uz.scorm.lms.app.v1.quiz.model.QuizStatus
import uz.scorm.lms.app.v1.quiz.repository.CourseQuizQuestionRepository
import uz.scorm.lms.app.v1.quiz.repository.CourseQuizRepository
import uz.scorm.lms.app.v1.quiz.repository.QuizAttemptRepository
import uz.scorm.lms.app.v1.quiz.repository.QuizQuestionRepository
import uz.scorm.lms.app.v1.syllabus.model.SyllabusLessonQuiz
import uz.scorm.lms.app.v1.syllabus.model.SyllabusQuizKind
import uz.scorm.lms.app.v1.syllabus.repository.SyllabusLessonQuizRepository
import java.time.Duration
import java.time.Instant
import java.time.ZoneId

/** Dars testi yoki Savol/Javob savoli (o'quv dasturida JSON sifatida saqlanadi) */
data class SyllabusQuizQuestion(
    val text: String,
    val type: QuizQuestionType,
    val options: List<String> = emptyList(),
    val correctAnswer: String,
    val explanation: String? = null,
    val points: Int = 1,
)

/**
 * O'quv dasturi darsining Test va Savol/Javob resurslarini kurs testlariga aylantiradi: kurs darsiga bog'langan
 * qoralama test sifatida yaratiladi, dasturda o'zgargani (urinish bo'lmasa) yangilanadi, dasturdan olib tashlangani
 * o'chiriladi — urinish bo'lsa natijalar saqlanishi uchun faqat yopiladi.
 */
@Component
class SyllabusQuizSync(
    private val lessonQuizzes: SyllabusLessonQuizRepository,
    private val quizzes: CourseQuizRepository,
    private val questions: QuizQuestionRepository,
    private val links: CourseQuizQuestionRepository,
    private val attempts: QuizAttemptRepository,
    private val mapper: ObjectMapper,
) {
    private val listType = object : TypeReference<List<SyllabusQuizQuestion>>() {}

    fun questionsOf(source: SyllabusLessonQuiz): List<SyllabusQuizQuestion> = mapper.readValue(source.questionsJson, listType)

    fun toJson(items: List<SyllabusQuizQuestion>): String = mapper.writeValueAsString(items)

    /** Qaytgan son — yaratilgan, yangilangan yoki olib tashlangan kurs testlari */
    fun sync(course: Course, lessons: List<CourseModule>, lessonIds: Set<Long>): Int {
        val desired = if (lessonIds.isEmpty()) emptyList() else lessonQuizzes.findAllByTopicIdInAndDeletedFalseOrderByPositionAscIdAsc(lessonIds)
        val lessonByTopic = lessons.filter { it.syllabusTopicId in lessonIds }.associateBy { it.syllabusTopicId }
        val existing = quizzes.findAllByCourseIdAndSyllabusQuizIdIsNotNullAndDeletedFalse(requireNotNull(course.id))
            .associateBy { it.syllabusQuizId }
        var changed = 0
        desired.forEach { source ->
            val lesson = lessonByTopic[source.topic.id] ?: return@forEach
            val quiz = existing[source.id]
            if (quiz == null) {
                create(course, lesson, source)
                changed++
                return@forEach
            }
            var touched = false
            if (quiz.module?.id != lesson.id) {
                quiz.module = lesson
                touched = true
            }
            // Urinish boshlangan testga tegilmaydi — natijalar eski savollar bo'yicha qoladi
            if (quiz.syllabusQuizVersion != source.version && !attempts.existsByQuizIdAndDeletedFalse(requireNotNull(quiz.id))) {
                applyFields(quiz, source)
                replaceQuestions(quiz, source)
                touched = true
            }
            if (touched) {
                quizzes.save(quiz)
                changed++
            }
        }
        existing.values.filter { quiz -> desired.none { it.id == quiz.syllabusQuizId } }.forEach { quiz ->
            if (attempts.existsByQuizIdAndDeletedFalse(requireNotNull(quiz.id))) {
                if (quiz.status == QuizStatus.CLOSED) return@forEach
                quiz.status = QuizStatus.CLOSED
            } else quiz.deleted = true
            quizzes.save(quiz)
            changed++
        }
        return changed
    }

    private fun create(course: Course, lesson: CourseModule, source: SyllabusLessonQuiz) {
        val opensAt = course.startDate?.atStartOfDay(ZONE)?.toInstant() ?: Instant.now()
        val closesAt = course.endDate?.plusDays(1)?.atStartOfDay(ZONE)?.toInstant()?.takeIf { it.isAfter(opensAt) }
            ?: opensAt.plus(Duration.ofDays(365))
        val quiz = CourseQuiz(
            course = course, title = source.title, opensAt = opensAt, closesAt = closesAt,
            durationMinutes = source.durationMinutes, status = QuizStatus.DRAFT,
        ).apply {
            module = lesson
            syllabusQuizId = source.id
        }
        applyFields(quiz, source)
        replaceQuestions(quizzes.save(quiz), source)
    }

    private fun applyFields(quiz: CourseQuiz, source: SyllabusLessonQuiz) {
        quiz.title = source.title
        quiz.instructions = source.instructions.orEmpty()
        quiz.durationMinutes = source.durationMinutes
        quiz.allowedAttempts = source.allowedAttempts
        quiz.passingPercentage = source.passingPercentage
        quiz.shuffleQuestions = source.kind == SyllabusQuizKind.TEST
        quiz.showResult = true
        quiz.syllabusQuizVersion = source.version
    }

    /** Kurs savollar bankidagi shu testning savollari dasturdagilar bilan almashtiriladi */
    private fun replaceQuestions(quiz: CourseQuiz, source: SyllabusLessonQuiz) {
        links.findAllByQuizIdAndDeletedFalseOrderByPositionAsc(requireNotNull(quiz.id)).forEach { link ->
            link.deleted = true
            link.question.deleted = true
            questions.save(link.question)
            links.save(link)
        }
        questionsOf(source).forEachIndexed { index, item ->
            val question = questions.save(QuizQuestion(
                course = quiz.course, text = item.text, type = item.type, points = item.points,
                optionsJson = when (item.type) {
                    QuizQuestionType.SINGLE_CHOICE -> mapper.writeValueAsString(item.options)
                    QuizQuestionType.TRUE_FALSE -> mapper.writeValueAsString(listOf("true", "false"))
                    QuizQuestionType.SHORT_ANSWER -> null
                },
                correctAnswer = item.correctAnswer, explanation = item.explanation,
            ))
            links.save(CourseQuizQuestion(quiz, question, index + 1))
        }
    }

    private companion object {
        val ZONE: ZoneId = ZoneId.of("Asia/Tashkent")
    }
}
