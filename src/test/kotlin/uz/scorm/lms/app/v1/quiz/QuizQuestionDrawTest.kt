package uz.scorm.lms.app.v1.quiz

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import uz.scorm.lms.app.v1.courses.model.Course
import uz.scorm.lms.app.v1.quiz.model.QuizDifficulty
import uz.scorm.lms.app.v1.quiz.model.QuizQuestion
import uz.scorm.lms.app.v1.quiz.model.QuizQuestionType
import uz.scorm.lms.app.v1.quiz.service.QuizQuestionDraw
import kotlin.random.Random

class QuizQuestionDrawTest {
    private val course = Course(title = "Fizika").apply { id = 1 }
    private var nextId = 1L

    private fun questions(difficulty: QuizDifficulty, count: Int) = List(count) {
        QuizQuestion(course = course, text = "Q", type = QuizQuestionType.SHORT_ANSWER, difficulty = difficulty, correctAnswer = "x")
            .apply { id = nextId++ }
    }

    // Bank: 10 oson, 6 o'rta, 4 qiyin (50% / 30% / 20%).
    private val pool = questions(QuizDifficulty.EASY, 10) + questions(QuizDifficulty.MEDIUM, 6) + questions(QuizDifficulty.HARD, 4)

    @Test
    fun `har talabaga qiyinlik ulushi bankdagidek bo'lgan N ta takrorlanmas savol tushadi`() {
        repeat(50) { seed ->
            val drawn = QuizQuestionDraw.draw(pool, 10, Random(seed))
            assertEquals(10, drawn.size)
            assertEquals(10, drawn.map { it.id }.toSet().size)
            val byDifficulty = drawn.groupingBy { it.difficulty }.eachCount()
            assertEquals(5, byDifficulty[QuizDifficulty.EASY])
            assertEquals(3, byDifficulty[QuizDifficulty.MEDIUM])
            assertEquals(2, byDifficulty[QuizDifficulty.HARD])
        }
    }

    @Test
    fun `turli talabalar turli to'plam oladi`() {
        val sets = (0 until 30).map { QuizQuestionDraw.draw(pool, 10, Random(it)).map { q -> q.id }.toSet() }
        assertTrue(sets.toSet().size > 20, "to'plamlar xilma-xil bo'lishi kerak: ${sets.toSet().size}")
    }

    @Test
    fun `butun songa kelmaydigan ulushda ham aynan N ta savol`() {
        repeat(50) { seed -> assertEquals(7, QuizQuestionDraw.draw(pool, 7, Random(seed)).size) }
    }

    @Test
    fun `soni berilmasa yoki bankdan katta bo'lsa butun bank - avvalgi xatti-harakat`() {
        assertEquals(pool, QuizQuestionDraw.draw(pool, null, Random(1)))
        assertEquals(pool, QuizQuestionDraw.draw(pool, 99, Random(1)))
    }
}
