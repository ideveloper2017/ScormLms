package uz.scorm.lms.app.v1.courses.service

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.quiz.dto.QuizQuestionRequest
import uz.scorm.lms.app.v1.quiz.model.QuizQuestionType
import uz.scorm.lms.app.v1.quiz.service.QuizService
import uz.scorm.lms.app.v1.syllabus.model.SubjectSyllabus
import uz.scorm.lms.app.v1.syllabus.model.SyllabusLessonQuiz
import uz.scorm.lms.app.v1.syllabus.model.SyllabusQuizKind
import uz.scorm.lms.app.v1.syllabus.repository.SubjectSyllabusRepository
import uz.scorm.lms.app.v1.syllabus.repository.SyllabusLessonQuizRepository

/**
 * Darsga Test yoki Savol/Javob: Test — vaqtli, bir nechta savol (darsga bittadan ortiq emas);
 * Savol/Javob — bitta savol, urinishlar soni bilan (o'tish uchun to'g'ri javob kerak).
 */
data class SyllabusLessonQuizRequest(
    val kind: SyllabusQuizKind,
    val title: String,
    val instructions: String? = null,
    val durationMinutes: Int? = null,
    val allowedAttempts: Int = 1,
    val passingPercentage: Int? = null,
    val questions: List<SyllabusQuizQuestion>,
)

data class SyllabusLessonQuizDto(
    val id: Long,
    val kind: SyllabusQuizKind,
    val title: String,
    val instructions: String?,
    val durationMinutes: Int,
    val allowedAttempts: Int,
    val passingPercentage: Int,
    val questions: List<SyllabusQuizQuestion>,
    val version: Int,
)

data class SyllabusLessonQuizzesDto(val quizzes: List<SyllabusLessonQuizDto>, val courses: List<SyllabusLinkedCourseDto>)

/** O'quv dasturi darsining Test va Savol/Javob resurslari; o'zgarishdan keyin qoralama kurslar moslanadi. */
@Service
class SyllabusLessonQuizService(
    private val syllabi: SubjectSyllabusRepository,
    private val quizzes: SyllabusLessonQuizRepository,
    private val quizSync: SyllabusQuizSync,
    private val quizService: QuizService,
    private val courseSyllabusService: CourseSyllabusService,
) {
    @Transactional(readOnly = true)
    fun list(syllabusId: Long, topicId: Long): List<SyllabusLessonQuizDto> {
        val syllabus = syllabi.findByIdAndDeletedFalse(syllabusId) ?: throw NoSuchElementException("O'quv dasturi topilmadi: $syllabusId")
        topic(syllabus, topicId)
        return lessonQuizzes(topicId).map(::dto)
    }

    @Transactional
    fun create(syllabusId: Long, topicId: Long, request: SyllabusLessonQuizRequest): SyllabusLessonQuizzesDto {
        val topic = topic(draft(syllabusId), topicId)
        val current = lessonQuizzes(topicId)
        val questions = validate(request, current, null)
        quizzes.save(SyllabusLessonQuiz(
            topic = topic, kind = request.kind, title = request.title.trim(), instructions = request.instructions.clean(),
            durationMinutes = duration(request), allowedAttempts = request.allowedAttempts, passingPercentage = passing(request),
            questionsJson = quizSync.toJson(questions), position = (current.maxOfOrNull { it.position } ?: 0) + 1,
        ))
        return changed(syllabusId, topicId)
    }

    @Transactional
    fun update(syllabusId: Long, topicId: Long, quizId: Long, request: SyllabusLessonQuizRequest): SyllabusLessonQuizzesDto {
        topic(draft(syllabusId), topicId)
        val current = lessonQuizzes(topicId)
        val quiz = current.firstOrNull { it.id == quizId } ?: throw NoSuchElementException("Test ushbu darsga tegishli emas: $quizId")
        val questions = validate(request, current, quizId)
        quiz.kind = request.kind
        quiz.title = request.title.trim()
        quiz.instructions = request.instructions.clean()
        quiz.durationMinutes = duration(request)
        quiz.allowedAttempts = request.allowedAttempts
        quiz.passingPercentage = passing(request)
        quiz.questionsJson = quizSync.toJson(questions)
        quiz.version += 1
        return changed(syllabusId, topicId)
    }

    @Transactional
    fun delete(syllabusId: Long, topicId: Long, quizId: Long): SyllabusLessonQuizzesDto {
        topic(draft(syllabusId), topicId)
        val quiz = lessonQuizzes(topicId).firstOrNull { it.id == quizId } ?: throw NoSuchElementException("Test ushbu darsga tegishli emas: $quizId")
        quiz.deleted = true
        return changed(syllabusId, topicId)
    }

    /** Savollar test tizimidagi qoidalar bilan tekshiriladi; qaytgan ro'yxat tozalangan ko'rinishda */
    private fun validate(request: SyllabusLessonQuizRequest, current: List<SyllabusLessonQuiz>, selfId: Long?): List<SyllabusQuizQuestion> {
        val title = request.title.trim()
        require(title.length in 2..255) { "Test nomi 2-255 belgi bo'lishi kerak" }
        require(request.allowedAttempts in 1..20) { "Urinishlar soni 1-20 oralig'ida bo'lishi kerak" }
        when (request.kind) {
            SyllabusQuizKind.TEST -> {
                require(current.none { it.kind == SyllabusQuizKind.TEST && it.id != selfId }) { "Darsga test faqat bir marta qo'shiladi" }
                require(request.questions.isNotEmpty()) { "Testga kamida bitta savol kiriting" }
                require(request.questions.size <= MAX_QUESTIONS) { "Testda savollar $MAX_QUESTIONS tadan oshmasligi kerak" }
                require((request.durationMinutes ?: 0) in 1..1440) { "Test davomiyligi 1-1440 daqiqa bo'lishi kerak" }
                require((request.passingPercentage ?: 0) in 0..100) { "O'tish foizi 0-100 oralig'ida bo'lishi kerak" }
            }
            SyllabusQuizKind.QUESTION -> require(request.questions.size == 1) { "Savol/Javob resursida bitta savol bo'ladi" }
        }
        return request.questions.mapIndexed { index, item ->
            val clean = SyllabusQuizQuestion(
                text = item.text.trim(), type = item.type,
                options = if (item.type == QuizQuestionType.SINGLE_CHOICE) item.options.map(String::trim).filter(String::isNotEmpty).distinct() else emptyList(),
                correctAnswer = item.correctAnswer.trim(), explanation = item.explanation.clean(), points = item.points,
            )
            runCatching {
                quizService.validateKey(QuizQuestionRequest(0, clean.text, clean.type, points = clean.points, options = clean.options,
                    correctAnswer = clean.correctAnswer, explanation = clean.explanation))
            }.onFailure { throw IllegalArgumentException("${index + 1}-savol: ${it.message}") }
            clean
        }
    }

    private fun duration(request: SyllabusLessonQuizRequest) =
        if (request.kind == SyllabusQuizKind.QUESTION) QUESTION_MINUTES else requireNotNull(request.durationMinutes)

    private fun passing(request: SyllabusLessonQuizRequest) =
        if (request.kind == SyllabusQuizKind.QUESTION) 100 else requireNotNull(request.passingPercentage)

    private fun changed(syllabusId: Long, topicId: Long): SyllabusLessonQuizzesDto {
        quizzes.flush()
        return SyllabusLessonQuizzesDto(lessonQuizzes(topicId).map(::dto), courseSyllabusService.syncDraftCourses(syllabusId))
    }

    private fun lessonQuizzes(topicId: Long) = quizzes.findAllByTopicIdInAndDeletedFalseOrderByPositionAscIdAsc(listOf(topicId))

    private fun draft(syllabusId: Long): SubjectSyllabus {
        val syllabus = syllabi.lockById(syllabusId) ?: throw NoSuchElementException("O'quv dasturi topilmadi: $syllabusId")
        require(syllabus.status == "DRAFT") { "Dars kontenti faqat qoralama dasturda tahrirlanadi. Avval yangi versiya oching." }
        return syllabus
    }

    private fun topic(syllabus: SubjectSyllabus, topicId: Long) =
        syllabus.topics.firstOrNull { it.id == topicId } ?: throw NoSuchElementException("Dars ushbu dasturga tegishli emas: $topicId")

    private fun dto(quiz: SyllabusLessonQuiz) = SyllabusLessonQuizDto(
        id = requireNotNull(quiz.id), kind = quiz.kind, title = quiz.title, instructions = quiz.instructions,
        durationMinutes = quiz.durationMinutes, allowedAttempts = quiz.allowedAttempts, passingPercentage = quiz.passingPercentage,
        questions = quizSync.questionsOf(quiz), version = quiz.version,
    )

    private fun String?.clean(): String? = this?.trim()?.takeIf(String::isNotEmpty)

    private companion object {
        const val MAX_QUESTIONS = 200
        /** Savol/Javob vaqt bilan cheklanmaydi; test tizimi talab qilgani uchun bitta savolga yetarli vaqt */
        const val QUESTION_MINUTES = 30
    }
}
