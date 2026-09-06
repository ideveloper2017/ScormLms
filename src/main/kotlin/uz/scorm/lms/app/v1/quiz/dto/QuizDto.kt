package uz.scorm.lms.app.v1.quiz.dto

import uz.scorm.lms.app.v1.quiz.model.QuizDifficulty
import uz.scorm.lms.app.v1.quiz.model.QuizQuestionType
import uz.scorm.lms.app.v1.quiz.model.QuizStatus
import java.time.Instant

data class QuizQuestionRequest(
    val courseId: Long,
    val text: String,
    val type: QuizQuestionType,
    val difficulty: QuizDifficulty = QuizDifficulty.MEDIUM,
    val points: Int = 1,
    val options: List<String> = emptyList(),
    val correctAnswer: String,
    val explanation: String? = null,
)

data class QuizQuestionDto(
    val id: String,
    val courseId: String,
    val courseTitle: String,
    val text: String,
    val type: String,
    val difficulty: String,
    val points: Int,
    val options: List<String>,
    val correctAnswer: String,
    val explanation: String?,
)

data class QuizRequest(
    val courseId: Long,
    val title: String,
    val instructions: String = "",
    val opensAt: Instant,
    val closesAt: Instant,
    val durationMinutes: Int,
    val allowedAttempts: Int = 1,
    val passingPercentage: Int = 60,
    val shuffleQuestions: Boolean = true,
    val showResult: Boolean = true,
    val proctoring: Boolean = false,
    val proctorIds: Set<Long> = emptySet(),
    val questionIds: List<Long>,
    val status: QuizStatus = QuizStatus.PUBLISHED,
)

data class QuizStatusRequest(val status: QuizStatus)

data class TeacherQuizDto(
    val id: String,
    val title: String,
    val courseTitle: String,
    val courseId: String,
    val date: Instant,
    val duration: Int,
    val questions: Int,
    val totalPoints: Int,
    val allowedAttempts: Int,
    val passingPercentage: Int,
    val proctoring: Boolean,
    val proctorIds: Set<String>,
    val status: String,
    val avgScore: Int?,
    val participants: Int,
)

data class TeacherQuizAttemptDto(
    val id: String,
    val quizId: String,
    val studentName: String,
    val attemptNumber: Int,
    val status: String,
    val score: Int,
    val totalPoints: Int,
    val percentage: Double,
    val passed: Boolean,
    val startedAt: Instant,
    val submittedAt: Instant?,
    val durationSeconds: Int,
)

data class StudentQuizDetailsDto(
    val id: String,
    val title: String,
    val courseId: String,
    val courseName: String,
    val date: Instant,
    val startTime: String,
    val endTime: String,
    val duration: Int,
    val questionCount: Int,
    val totalPoints: Int,
    val proctoring: Boolean,
    val status: String,
    val score: Int?,
    val instructions: String,
    val allowedAttempts: Int,
    val attemptsUsed: Int,
    val passingScore: Int,
    val questions: List<StudentQuizQuestionDto>? = null,
)

data class StudentQuizQuestionDto(
    val id: String,
    val type: String,
    val text: String,
    val points: Int,
    val options: List<String>?,
)

data class QuizSessionDto(
    val id: String,
    val testId: String,
    val startedAt: Instant,
    val expiresAt: Instant,
    val questions: List<StudentQuizQuestionDto>,
    val answers: Map<String, String> = emptyMap(),
)

data class StartQuizResponse(val session: QuizSessionDto)

data class QuizAnswerRequest(val answer: String, val attemptId: Long? = null)

data class QuizAnswerItemRequest(val questionId: String, val answer: String)

data class SubmitQuizRequest(val answers: List<QuizAnswerItemRequest>)

data class QuizResultDto(
    val id: String,
    val testId: String,
    val score: Int,
    val totalPoints: Int,
    val percentage: Double,
    val passed: Boolean,
    val submittedAt: Instant,
    val proctoring: Boolean,
    val feedback: String? = null,
)

data class QuizHistoryDto(
    val id: String,
    val testId: String,
    val testTitle: String,
    val courseName: String,
    val score: Int,
    val totalPoints: Int,
    val percentage: Double,
    val passed: Boolean,
    val completedAt: Instant,
)
