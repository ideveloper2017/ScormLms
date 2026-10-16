package uz.scorm.lms.app.v1.academicresult.service

import uz.scorm.lms.app.v1.courses.model.CourseEnrollment
import uz.scorm.lms.app.v1.exam.model.ExamResult
import uz.scorm.lms.app.v1.exam.model.ExamSessionStatus
import uz.scorm.lms.app.v1.quiz.model.CourseQuiz
import uz.scorm.lms.app.v1.quiz.model.QuizAttempt
import uz.scorm.lms.app.v1.quiz.model.QuizAttemptStatus
import uz.scorm.lms.app.v1.quiz.model.QuizStatus
import java.time.Instant
import kotlin.math.round

/**
 * Kurs ballini yig'ishning YAGONA qoidasi — talaba baholari/transkript, akademik reyestr va o'qituvchi
 * jurnali shu yerdan foydalanadi (avval har biri o'zicha hisoblab, bir talabaga uch xil natija chiqardi).
 *
 *  - Joriy nazorat (testlar): har test uchun BITTA ball — eng yuqori yakunlangan urinish. Avval barcha
 *    urinishlar o'rtachaga qo'shilardi: 40/60/90 olgan talaba 63 bo'lardi.
 *  - Muddati tugagan (yoki o'qituvchi yopgan) testni topshirmagan talaba — 0 ball, agar test yopilishidan
 *    oldin kursga biriktirilgan bo'lsa. Avval bunday test hisobga umuman kirmas, past ball kutilgan testni
 *    tashlab ketish o'rtachani oshirardi.
 *  - Yakuniy nazorat: faqat yakunlangan (e'lon qilingan) imtihon sessiyasi, eng oxirgi baholangani
 *    (qayta topshirish bo'lsa — keyingisi). Davom etayotgan sessiya natijasi hali hisobga kirmaydi.
 */
object CourseScorePolicy {
    val COUNTED_QUIZ_STATUSES = setOf(QuizStatus.PUBLISHED, QuizStatus.CLOSED)

    /** Har (test, biriktiruv) juftligi uchun hisobga olinadigan urinish: eng yuqori foiz, teng bo'lsa keyingisi. */
    fun bestAttempts(attempts: Collection<QuizAttempt>): List<QuizAttempt> = attempts
        .filter { !it.deleted && !it.quiz.deleted && it.status != QuizAttemptStatus.IN_PROGRESS }
        .groupBy { it.quiz.id to it.enrollment.id }
        .values.map { rows -> rows.maxWith(compareBy<QuizAttempt> { it.percentage }.thenBy { it.attemptNumber }) }

    /** Test tugaganmi: yopilish vaqti o'tgan yoki o'qituvchi uni yopgan. */
    fun isOver(quiz: CourseQuiz, now: Instant): Boolean =
        quiz.status == QuizStatus.CLOSED || !now.isBefore(quiz.closesAt)

    /**
     * Talaba topshirishi kerak bo'lgan, lekin topshirmagan testlar: kursning nashr qilingan, tugagan va
     * biriktiruvdan keyin yopilgan testlari ichidan [attemptedQuizIds] da yo'qlari.
     */
    fun missedQuizzes(
        enrollment: CourseEnrollment,
        courseQuizzes: Collection<CourseQuiz>,
        attemptedQuizIds: Set<Long>,
        now: Instant,
    ): List<CourseQuiz> = courseQuizzes.filter { quiz ->
        !quiz.deleted && quiz.status in COUNTED_QUIZ_STATUSES &&
            quiz.course.id == enrollment.course.id &&
            isOver(quiz, now) &&
            enrollment.enrolledAt.isBefore(quiz.closesAt) &&
            quiz.id?.let { it !in attemptedQuizIds } == true
    }

    /** Joriy nazorat bali (foizda): eng yaxshi urinishlar + topshirilmagan testlar uchun 0. Test bo'lmasa null. */
    fun interim(bestPercentages: Collection<Double>, missedCount: Int): Double? {
        val all = bestPercentages + List(missedCount) { 0.0 }
        return all.takeIf { it.isNotEmpty() }?.average()?.let { round(it * 100) / 100 }
    }

    /** Yakuniy imtihon natijasi: faqat yakunlangan sessiyalardan, eng oxirgi baholangani. */
    fun finalExam(results: Collection<ExamResult>): ExamResult? = results
        .filter { !it.deleted && !it.examSession.deleted && it.examSession.status == ExamSessionStatus.COMPLETED }
        .maxByOrNull { it.gradingDate }
}
