package uz.scorm.lms.app.v1.quiz.service

import org.springframework.security.access.AccessDeniedException
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.quiz.model.CourseQuiz
import uz.scorm.lms.app.v1.quiz.repository.CourseQuizProctorRepository
import uz.scorm.lms.app.v1.quiz.repository.CourseQuizRepository

@Service
class ProctorScopeService(
    private val quizRepository: CourseQuizRepository,
    private val assignmentRepository: CourseQuizProctorRepository,
) {
    @Transactional(readOnly = true)
    fun quizzes(userId: Long, mayManageAll: Boolean): List<CourseQuiz> {
        val quizzes = if (mayManageAll) {
            quizRepository.findAllByDeletedFalseOrderByOpensAtDesc()
        } else {
            val owned = quizRepository.findAllByCourseUserIdAndDeletedFalseOrderByOpensAtDesc(userId)
            val assigned = assignmentRepository.findAllByUserIdAndDeletedFalse(userId).map { it.quiz }
            owned + assigned
        }
        return quizzes.filter { it.proctoring }.distinctBy { it.id }
    }

    @Transactional(readOnly = true)
    fun requireQuiz(quizId: Long, userId: Long, mayManageAll: Boolean): CourseQuiz =
        quizzes(userId, mayManageAll).firstOrNull { it.id == quizId }
            ?: throw AccessDeniedException("Bu test proktoring ma'lumotlarini ko'rish vakolati yo'q")
}
