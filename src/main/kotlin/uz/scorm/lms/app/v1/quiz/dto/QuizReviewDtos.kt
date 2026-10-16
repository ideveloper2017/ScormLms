package uz.scorm.lms.app.v1.quiz.dto

import java.time.Instant

/**
 * Nashr qilingan savol kalitini tuzatish. Savol matni va turi o'zgarmaydi (talabalar shu savolga javob
 * bergan); faqat to'g'ri javob, variantlar, ball va izoh. Qisqa javobda bir nechta variant `|` bilan.
 */
data class AnswerKeyRequest(
    val correctAnswer: String,
    val options: List<String> = emptyList(),
    val points: Int? = null,
    val explanation: String? = null,
)

data class RegradeResultDto(
    val questionId: String,
    /** Avtomatik qayta baholangan javoblar. */
    val answersRegraded: Int,
    /** Qo'lda baholangani uchun o'zgartirilmagan javoblar. */
    val manualAnswersKept: Int,
    val attemptsRecalculated: Int,
    /** Natijasi (foizi) o'zgargan urinishlar. */
    val scoresChanged: Int,
)

data class ManualGradeRequest(val points: Int, val comment: String? = null)

data class QuizReviewItemDto(
    val questionId: String,
    val position: Int,
    val text: String,
    val type: String,
    val points: Int,
    val options: List<String>?,
    /** Talabaning javobi; javob berilmagan bo'lsa null. */
    val answer: String?,
    val correctAnswer: String,
    val correct: Boolean,
    val awardedPoints: Int,
    val manuallyGraded: Boolean,
    val graderComment: String?,
    val explanation: String?,
)

data class QuizAttemptReviewDto(
    val attemptId: String,
    val quizId: String,
    val quizTitle: String,
    val studentName: String,
    val attemptNumber: Int,
    val status: String,
    val score: Int,
    val totalPoints: Int,
    val percentage: Double,
    val passed: Boolean,
    val submittedAt: Instant?,
    val items: List<QuizReviewItemDto>,
)
