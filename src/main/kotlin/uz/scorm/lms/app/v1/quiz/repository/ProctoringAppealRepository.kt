package uz.scorm.lms.app.v1.quiz.repository

import org.springframework.data.jpa.repository.EntityGraph
import org.springframework.data.jpa.repository.JpaRepository
import uz.scorm.lms.app.v1.quiz.model.ProctoringAppeal

interface ProctoringAppealRepository : JpaRepository<ProctoringAppeal, Long> {
    fun existsByAttemptIdAndDeletedFalse(attemptId: Long): Boolean

    @EntityGraph(attributePaths = ["attempt", "attempt.quiz", "attempt.quiz.course", "attempt.enrollment", "attempt.enrollment.student", "attempt.enrollment.student.user", "student", "reviewedBy", "disputedEvents"])
    fun findByAttemptIdAndDeletedFalse(attemptId: Long): ProctoringAppeal?

    @EntityGraph(attributePaths = ["attempt", "attempt.quiz", "attempt.quiz.course", "attempt.enrollment", "attempt.enrollment.student", "attempt.enrollment.student.user", "student", "reviewedBy", "disputedEvents"])
    fun findByIdAndDeletedFalse(id: Long): ProctoringAppeal?

    @EntityGraph(attributePaths = ["attempt", "attempt.quiz", "attempt.quiz.course", "attempt.enrollment", "attempt.enrollment.student", "attempt.enrollment.student.user", "student", "reviewedBy", "disputedEvents"])
    fun findAllByStudentIdAndDeletedFalseOrderByRequestedAtDesc(studentId: Long): List<ProctoringAppeal>

    @EntityGraph(attributePaths = ["attempt", "attempt.quiz", "attempt.quiz.course", "attempt.enrollment", "attempt.enrollment.student", "attempt.enrollment.student.user", "student", "reviewedBy", "disputedEvents"])
    fun findAllByAttemptQuizIdInAndDeletedFalseOrderByRequestedAtAsc(quizIds: Collection<Long>): List<ProctoringAppeal>
}
