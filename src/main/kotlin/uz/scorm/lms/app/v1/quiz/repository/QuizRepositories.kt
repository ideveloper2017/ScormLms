package uz.scorm.lms.app.v1.quiz.repository

import org.springframework.data.jpa.repository.EntityGraph
import org.springframework.data.jpa.repository.JpaRepository
import uz.scorm.lms.app.v1.quiz.model.CourseQuiz
import uz.scorm.lms.app.v1.quiz.model.CourseQuizQuestion
import uz.scorm.lms.app.v1.quiz.model.QuizAnswer
import uz.scorm.lms.app.v1.quiz.model.QuizAttempt
import uz.scorm.lms.app.v1.quiz.model.QuizAttemptStatus
import uz.scorm.lms.app.v1.quiz.model.QuizQuestion
import uz.scorm.lms.app.v1.quiz.model.QuizStatus

interface QuizQuestionRepository : JpaRepository<QuizQuestion, Long> {
    @EntityGraph(attributePaths = ["course"])
    fun findAllByCourseUserIdAndDeletedFalseOrderByIdDesc(userId: Long): List<QuizQuestion>

    @EntityGraph(attributePaths = ["course"])
    fun findAllByCourseIdAndDeletedFalseOrderByIdDesc(courseId: Long): List<QuizQuestion>

    @EntityGraph(attributePaths = ["course"])
    fun findAllByDeletedFalseOrderByIdDesc(): List<QuizQuestion>

    @EntityGraph(attributePaths = ["course"])
    fun findByIdAndDeletedFalse(id: Long): QuizQuestion?
}

interface CourseQuizRepository : JpaRepository<CourseQuiz, Long> {
    @EntityGraph(attributePaths = ["course"])
    fun findAllByCourseUserIdAndDeletedFalseOrderByOpensAtDesc(userId: Long): List<CourseQuiz>

    @EntityGraph(attributePaths = ["course"])
    fun findAllByDeletedFalseOrderByOpensAtDesc(): List<CourseQuiz>

    @EntityGraph(attributePaths = ["course"])
    fun findAllByCourseIdInAndStatusInAndDeletedFalseOrderByOpensAtAsc(
        courseIds: Collection<Long>,
        statuses: Collection<QuizStatus>,
    ): List<CourseQuiz>

    @EntityGraph(attributePaths = ["course"])
    fun findByIdAndDeletedFalse(id: Long): CourseQuiz?
}

interface CourseQuizQuestionRepository : JpaRepository<CourseQuizQuestion, Long> {
    @EntityGraph(attributePaths = ["quiz", "question", "question.course"])
    fun findAllByQuizIdAndDeletedFalseOrderByPositionAsc(quizId: Long): List<CourseQuizQuestion>

    fun existsByQuestionIdAndQuizStatusInAndDeletedFalse(questionId: Long, statuses: Collection<QuizStatus>): Boolean
}

interface QuizAttemptRepository : JpaRepository<QuizAttempt, Long> {
    @EntityGraph(attributePaths = ["quiz", "quiz.course", "enrollment", "enrollment.student", "enrollment.student.user"])
    fun findAllByQuizIdAndDeletedFalseOrderByStartedAtDesc(quizId: Long): List<QuizAttempt>

    @EntityGraph(attributePaths = ["quiz", "quiz.course", "enrollment", "enrollment.student", "enrollment.student.user"])
    fun findAllByQuizIdAndEnrollmentIdAndDeletedFalseOrderByAttemptNumberDesc(
        quizId: Long,
        enrollmentId: Long,
    ): List<QuizAttempt>

    @EntityGraph(attributePaths = ["quiz", "quiz.course", "enrollment", "enrollment.student", "enrollment.student.user"])
    fun findFirstByQuizIdAndEnrollmentIdAndStatusAndDeletedFalseOrderByAttemptNumberDesc(
        quizId: Long,
        enrollmentId: Long,
        status: QuizAttemptStatus,
    ): QuizAttempt?

    @EntityGraph(attributePaths = ["quiz", "quiz.course", "enrollment", "enrollment.student", "enrollment.student.user"])
    fun findByIdAndDeletedFalse(id: Long): QuizAttempt?

    @EntityGraph(attributePaths = ["quiz", "quiz.course", "enrollment", "enrollment.student", "enrollment.student.user"])
    fun findAllByQuizCourseUserIdAndDeletedFalseOrderByStartedAtDesc(userId: Long): List<QuizAttempt>

    @EntityGraph(attributePaths = ["quiz", "quiz.course", "enrollment", "enrollment.student", "enrollment.student.user"])
    fun findAllByDeletedFalseOrderByStartedAtDesc(): List<QuizAttempt>

    fun existsByQuizIdAndDeletedFalse(quizId: Long): Boolean
}

interface QuizAnswerRepository : JpaRepository<QuizAnswer, Long> {
    @EntityGraph(attributePaths = ["attempt", "question"])
    fun findAllByAttemptIdAndDeletedFalseOrderByIdAsc(attemptId: Long): List<QuizAnswer>

    fun findByAttemptIdAndQuestionIdAndDeletedFalse(attemptId: Long, questionId: Long): QuizAnswer?
}
