package uz.scorm.lms.app.v1.quiz.repository

import jakarta.persistence.LockModeType
import org.springframework.data.jpa.repository.EntityGraph
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Lock
import org.springframework.data.domain.Pageable
import uz.scorm.lms.app.v1.quiz.model.ProctoringSession
import uz.scorm.lms.app.v1.quiz.model.ProctoringSessionStatus

interface ProctoringSessionRepository : JpaRepository<ProctoringSession, Long> {
    @EntityGraph(attributePaths = ["quiz", "quiz.course", "enrollment", "enrollment.student", "enrollment.student.user"])
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    fun findByIdAndDeletedFalse(id: Long): ProctoringSession?

    fun findAllByQuizIdAndEnrollmentIdAndStatusAndDeletedFalse(
        quizId: Long,
        enrollmentId: Long,
        status: ProctoringSessionStatus,
    ): List<ProctoringSession>

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @EntityGraph(attributePaths = ["quiz", "enrollment"])
    fun findFirstByQuizIdAndEnrollmentIdAndStatusAndDeletedFalseOrderByVerifiedAtDesc(
        quizId: Long,
        enrollmentId: Long,
        status: ProctoringSessionStatus,
    ): ProctoringSession?

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @EntityGraph(attributePaths = ["quiz", "enrollment", "enrollment.student", "enrollment.student.user", "attempt"])
    fun findFirstByAttemptIdAndDeletedFalse(attemptId: Long): ProctoringSession?

    @EntityGraph(attributePaths = ["quiz", "quiz.course", "enrollment", "enrollment.student", "enrollment.student.user", "attempt"])
    fun findByAttemptIdAndDeletedFalse(attemptId: Long): ProctoringSession?

    @EntityGraph(attributePaths = ["quiz", "quiz.course", "enrollment", "enrollment.student", "enrollment.student.user", "attempt"])
    fun findAllByQuizIdInAndAttemptIsNotNullAndDeletedFalseOrderByConsumedAtDesc(
        quizIds: Collection<Long>,
        pageable: Pageable,
    ): List<ProctoringSession>

    @EntityGraph(attributePaths = ["quiz", "quiz.course", "enrollment", "enrollment.student", "enrollment.student.user", "attempt"])
    fun findAllByQuizIdInAndAttemptIsNotNullAndDeletedFalse(quizIds: Collection<Long>): List<ProctoringSession>
}
