package uz.scorm.lms.app.v1.courses

import io.mockk.every
import io.mockk.mockk
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import tools.jackson.module.kotlin.jacksonObjectMapper
import uz.scorm.lms.app.v1.courses.model.Course
import uz.scorm.lms.app.v1.courses.model.CourseModule
import uz.scorm.lms.app.v1.courses.service.CourseSyllabusService
import uz.scorm.lms.app.v1.courses.service.SyllabusLessonQuizRequest
import uz.scorm.lms.app.v1.courses.service.SyllabusLessonQuizService
import uz.scorm.lms.app.v1.courses.service.SyllabusQuizQuestion
import uz.scorm.lms.app.v1.courses.service.SyllabusQuizSync
import uz.scorm.lms.app.v1.quiz.model.CourseQuiz
import uz.scorm.lms.app.v1.quiz.model.CourseQuizQuestion
import uz.scorm.lms.app.v1.quiz.model.QuizQuestion
import uz.scorm.lms.app.v1.quiz.model.QuizQuestionType
import uz.scorm.lms.app.v1.quiz.model.QuizStatus
import uz.scorm.lms.app.v1.quiz.repository.CourseQuizQuestionRepository
import uz.scorm.lms.app.v1.quiz.repository.CourseQuizRepository
import uz.scorm.lms.app.v1.quiz.repository.QuizAttemptRepository
import uz.scorm.lms.app.v1.quiz.repository.QuizQuestionRepository
import uz.scorm.lms.app.v1.quiz.service.QuizService
import uz.scorm.lms.app.v1.subject.model.Subject
import uz.scorm.lms.app.v1.syllabus.model.SubjectSyllabus
import uz.scorm.lms.app.v1.syllabus.model.SubjectSyllabusTopic
import uz.scorm.lms.app.v1.syllabus.model.SyllabusLanguage
import uz.scorm.lms.app.v1.syllabus.model.SyllabusLessonQuiz
import uz.scorm.lms.app.v1.syllabus.model.SyllabusQuizKind
import uz.scorm.lms.app.v1.syllabus.model.SyllabusTopicType.THEORETICAL
import uz.scorm.lms.app.v1.syllabus.repository.SubjectSyllabusRepository
import uz.scorm.lms.app.v1.syllabus.repository.SyllabusLessonQuizRepository
import java.time.LocalDate
import java.time.ZoneId

class SyllabusQuizSyncTest {
    private val lessonQuizzes = mockk<SyllabusLessonQuizRepository>()
    private val quizzes = mockk<CourseQuizRepository>()
    private val questions = mockk<QuizQuestionRepository>()
    private val links = mockk<CourseQuizQuestionRepository>()
    private val attempts = mockk<QuizAttemptRepository>()
    private val sync = SyllabusQuizSync(lessonQuizzes, quizzes, questions, links, attempts, jacksonObjectMapper())

    private val sources = mutableListOf<SyllabusLessonQuiz>()
    private val courseQuizzes = mutableListOf<CourseQuiz>()
    private val linkList = mutableListOf<CourseQuizQuestion>()
    private val attempted = mutableSetOf<Long>()

    private val syllabus = SubjectSyllabus(Subject(name = "Fizika", code = "FIZ").apply { id = 3 }, "Fizika dasturi",
        SyllabusLanguage.UZ, "Qisqa", null, "To'liq").apply {
        id = 31
        topics += SubjectSyllabusTopic(this, THEORETICAL, 1, "Kinematika").apply { id = 11 }
    }
    private val course = Course(title = "Fizika 2026", userId = 1, syllabus = syllabus,
        startDate = LocalDate.of(2026, 9, 1), endDate = LocalDate.of(2027, 1, 20)).apply { id = 9 }
    private val lesson = CourseModule(course, "Kinematika", position = 1, syllabusTopicId = 11).apply { id = 101 }

    init {
        every { lessonQuizzes.findAllByTopicIdInAndDeletedFalseOrderByPositionAscIdAsc(any()) } answers {
            sources.filter { !it.deleted && it.topic.id in firstArg<Collection<Long>>() }
        }
        every { quizzes.findAllByCourseIdAndSyllabusQuizIdIsNotNullAndDeletedFalse(9) } answers {
            courseQuizzes.filter { !it.deleted && it.syllabusQuizId != null }
        }
        every { quizzes.save(any<CourseQuiz>()) } answers {
            firstArg<CourseQuiz>().also { if (it.id == null) { it.id = 700L + courseQuizzes.size; courseQuizzes += it } }
        }
        var questionId = 800L
        every { questions.save(any<QuizQuestion>()) } answers { firstArg<QuizQuestion>().also { if (it.id == null) it.id = questionId++ } }
        every { links.save(any<CourseQuizQuestion>()) } answers { firstArg<CourseQuizQuestion>().also { if (it !in linkList) linkList += it } }
        every { links.findAllByQuizIdAndDeletedFalseOrderByPositionAsc(any()) } answers {
            linkList.filter { !it.deleted && it.quiz.id == firstArg<Long>() }.sortedBy { it.position }
        }
        every { attempts.existsByQuizIdAndDeletedFalse(any()) } answers { firstArg<Long>() in attempted }
    }

    @Test
    fun `dars testi kurs darsiga qoralama test bolib tushadi, ozgargani yangilanadi`() {
        val test = source(1, SyllabusQuizKind.TEST, "Kinematika testi", listOf(
            SyllabusQuizQuestion("Tezlik birligi?", QuizQuestionType.SINGLE_CHOICE, listOf("m/s", "kg"), "m/s", "SI birligi"),
            SyllabusQuizQuestion("Tezlanish vektor kattalik", QuizQuestionType.TRUE_FALSE, correctAnswer = "true"),
        ))

        assertEquals(1, sync.sync(course, listOf(lesson), setOf(11)))

        val quiz = courseQuizzes.single()
        assertEquals("Kinematika testi", quiz.title)
        assertEquals(QuizStatus.DRAFT, quiz.status)
        assertEquals(101L, quiz.module?.id)
        assertEquals(1L, quiz.syllabusQuizId)
        assertEquals(LocalDate.of(2026, 9, 1).atStartOfDay(ZoneId.of("Asia/Tashkent")).toInstant(), quiz.opensAt)
        val linked = linkList.filter { !it.deleted }
        assertEquals(listOf("Tezlik birligi?", "Tezlanish vektor kattalik"), linked.map { it.question.text })
        assertEquals("""["m/s","kg"]""", linked.first().question.optionsJson)
        assertEquals(9L, linked.first().question.course.id)

        // Qayta sinxronlash — o'zgarish yo'q
        assertEquals(0, sync.sync(course, listOf(lesson), setOf(11)))

        test.title = "Kinematika: yakuniy test"
        test.questionsJson = sync.toJson(listOf(SyllabusQuizQuestion("Yo'l formulasi?", QuizQuestionType.SHORT_ANSWER, correctAnswer = "s=vt")))
        test.version = 2
        assertEquals(1, sync.sync(course, listOf(lesson), setOf(11)))
        assertEquals("Kinematika: yakuniy test", quiz.title)
        assertEquals(listOf("Yo'l formulasi?"), linkList.filter { !it.deleted }.map { it.question.text })
        assertTrue(linked.all { it.deleted && it.question.deleted })
    }

    @Test
    fun `urinish boshlangan test ozgartirilmaydi, dasturdan olib tashlansa yopiladi`() {
        val test = source(1, SyllabusQuizKind.TEST, "Test", listOf(SyllabusQuizQuestion("2+2?", QuizQuestionType.SHORT_ANSWER, correctAnswer = "4")))
        val question = source(2, SyllabusQuizKind.QUESTION, "Savol", listOf(SyllabusQuizQuestion("3+3?", QuizQuestionType.SHORT_ANSWER, correctAnswer = "6")))
        sync.sync(course, listOf(lesson), setOf(11))
        val (testQuiz, questionQuiz) = courseQuizzes
        attempted += requireNotNull(testQuiz.id)

        test.version = 2
        test.title = "Yangi nom"
        assertEquals(0, sync.sync(course, listOf(lesson), setOf(11)))
        assertEquals("Test", testQuiz.title)

        test.deleted = true
        question.deleted = true
        assertEquals(2, sync.sync(course, listOf(lesson), setOf(11)))
        assertEquals(QuizStatus.CLOSED, testQuiz.status)
        assertTrue(!testQuiz.deleted)
        assertTrue(questionQuiz.deleted)
    }

    @Test
    fun `dars resurslari tekshiriladi - test darsga bitta, savol-javobda bitta savol`() {
        val syllabi = mockk<SubjectSyllabusRepository>()
        every { syllabi.lockById(31) } returns syllabus
        every { lessonQuizzes.save(any<SyllabusLessonQuiz>()) } answers { firstArg<SyllabusLessonQuiz>().also { it.id = 50L + sources.size; sources += it } }
        every { lessonQuizzes.flush() } returns Unit
        val courseSync = mockk<CourseSyllabusService>()
        every { courseSync.syncDraftCourses(31) } returns emptyList()
        val quizService = QuizService(mockk(), mockk(), mockk(), mockk(), mockk(), mockk(), mockk(), mockk(), jacksonObjectMapper(), mockk(), mockk(), mockk())
        val service = SyllabusLessonQuizService(syllabi, lessonQuizzes, sync, quizService, courseSync)
        val q = SyllabusQuizQuestion(" Tezlik birligi? ", QuizQuestionType.SINGLE_CHOICE, listOf(" m/s ", "kg", ""), "m/s")

        val created = service.create(31, 11, SyllabusLessonQuizRequest(SyllabusQuizKind.TEST, "Test", durationMinutes = 20,
            passingPercentage = 60, questions = listOf(q)))
        assertEquals(listOf("m/s", "kg"), created.quizzes.single().questions.single().options)
        assertEquals("Tezlik birligi?", created.quizzes.single().questions.single().text)

        val again = assertThrows<IllegalArgumentException> {
            service.create(31, 11, SyllabusLessonQuizRequest(SyllabusQuizKind.TEST, "Ikkinchi", durationMinutes = 20, passingPercentage = 60, questions = listOf(q)))
        }
        assertEquals("Darsga test faqat bir marta qo'shiladi", again.message)
        assertThrows<IllegalArgumentException> {
            service.create(31, 11, SyllabusLessonQuizRequest(SyllabusQuizKind.QUESTION, "Savol", questions = listOf(q, q)))
        }
        val wrongKey = assertThrows<IllegalArgumentException> {
            service.create(31, 11, SyllabusLessonQuizRequest(SyllabusQuizKind.QUESTION, "Savol",
                questions = listOf(q.copy(correctAnswer = "km"))))
        }
        assertEquals("1-savol: To'g'ri javob variantlardan biri bo'lishi kerak", wrongKey.message)

        val question = service.create(31, 11, SyllabusLessonQuizRequest(SyllabusQuizKind.QUESTION, "Savol", allowedAttempts = 3, questions = listOf(q)))
        val saved = question.quizzes.last()
        assertEquals(SyllabusQuizKind.QUESTION, saved.kind)
        assertEquals(100, saved.passingPercentage)
        assertEquals(3, saved.allowedAttempts)
    }

    private fun source(id: Long, kind: SyllabusQuizKind, title: String, items: List<SyllabusQuizQuestion>) = SyllabusLessonQuiz(
        syllabus.topics.single(), kind, title, null, 20, 1, 60, sync.toJson(items),
    ).apply { this.id = id }.also { sources += it }
}
