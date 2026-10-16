package uz.scorm.lms.app.v1.quiz.service

import uz.scorm.lms.app.v1.quiz.model.QuizQuestion
import kotlin.math.floor
import kotlin.random.Random

/**
 * Savol bankidan har urinish uchun to'plam. Avval hamma talabaga AYNAN bir xil savollar tushardi (faqat
 * tartib aralashardi) — test oynasi ichida erta topshirgan talaba savollarni keyingilarga uzata olardi.
 *
 * Qiyinlik bo'yicha mutanosib tanlov: har qiyinlik guruhidan bankdagi ulushiga teng miqdor (eng katta
 * qoldiq usuli bilan butun songa keltiriladi), guruh ichida tasodifiy. Shunda har talabaning to'plami
 * murakkabligi bo'yicha teng bo'ladi.
 */
object QuizQuestionDraw {
    /** [count] null yoki bank hajmidan katta/teng bo'lsa — butun bank (avvalgi xatti-harakat). */
    fun draw(pool: List<QuizQuestion>, count: Int?, random: Random): List<QuizQuestion> {
        if (count == null || count >= pool.size) return pool
        require(count >= 1) { "Har urinishdagi savollar soni kamida 1 bo'lishi kerak" }
        val groups = pool.groupBy { it.difficulty }
        val exact = groups.mapValues { (_, questions) -> questions.size.toDouble() * count / pool.size }
        val quotas = exact.mapValues { floor(it.value).toInt() }.toMutableMap()
        var remaining = count - quotas.values.sum()
        // Qoldiq teng bo'lsa — qaysi guruh qo'shimcha savol olishini ham tasodif hal qiladi.
        exact.entries.shuffled(random).sortedByDescending { it.value - floor(it.value) }.forEach { entry ->
            if (remaining > 0) {
                quotas[entry.key] = quotas.getValue(entry.key) + 1
                remaining--
            }
        }
        val chosen = groups.flatMap { (difficulty, questions) -> questions.shuffled(random).take(quotas.getValue(difficulty)) }
            .mapNotNull { it.id }.toSet()
        // Bankdagi tartib saqlanadi; aralashtirishni chaqiruvchi (shuffleQuestions) hal qiladi.
        return pool.filter { it.id in chosen }
    }
}
