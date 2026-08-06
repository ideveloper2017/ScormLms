package uz.scorm.lms.app.v1.quiz.repository

import org.springframework.data.jpa.repository.EntityGraph
import org.springframework.data.jpa.repository.JpaRepository
import uz.scorm.lms.app.v1.quiz.model.CourseQuizProctor

interface CourseQuizProctorRepository : JpaRepository<CourseQuizProctor, Long> {
    @EntityGraph(attributePaths = ["quiz", "quiz.course", "user", "user.role"])
    fun findAllByQuizIdAndDeletedFalseOrderByUserFullNameAsc(quizId: Long): List<CourseQuizProctor>

    @EntityGraph(attributePaths = ["quiz", "quiz.course"])
    fun findAllByUserIdAndDeletedFalse(userId: Long): List<CourseQuizProctor>

    fun findAllByQuizIdAndDeletedFalse(quizId: Long): List<CourseQuizProctor>
    fun findAllByQuizId(quizId: Long): List<CourseQuizProctor>
}
