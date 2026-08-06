package uz.scorm.lms.app.v1.quiz.dto

data class QuizProctorCandidateDto(
    val id: String,
    val username: String,
    val fullName: String,
)

data class QuizProctorAssignmentRequest(
    val userIds: Set<Long>,
)

data class QuizProctorAssignmentDto(
    val quizId: String,
    val proctors: List<QuizProctorCandidateDto>,
)
