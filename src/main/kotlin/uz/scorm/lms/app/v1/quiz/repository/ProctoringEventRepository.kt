package uz.scorm.lms.app.v1.quiz.repository

import org.springframework.data.jpa.repository.EntityGraph
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.data.domain.Pageable
import uz.scorm.lms.app.v1.quiz.model.ProctoringEvent
import uz.scorm.lms.app.v1.quiz.model.ProctoringEventSeverity
import uz.scorm.lms.app.v1.quiz.model.ProctoringEventType
import java.time.Instant

interface ProctoringEventRepository : JpaRepository<ProctoringEvent, Long> {
    fun existsBySessionIdAndEventKeyAndDeletedFalse(sessionId: Long, eventKey: String): Boolean

    fun countByAttemptIdAndDeletedFalse(attemptId: Long): Long

    fun existsByAttemptIdAndTypeAndDeletedFalse(attemptId: Long, type: ProctoringEventType): Boolean

    @EntityGraph(attributePaths = ["session", "attempt", "attempt.quiz", "attempt.enrollment", "attempt.enrollment.student", "attempt.enrollment.student.user"])
    fun findAllByAttemptIdAndDeletedFalseOrderByOccurredAtAsc(attemptId: Long): List<ProctoringEvent>

    @EntityGraph(attributePaths = ["session", "attempt", "attempt.quiz", "attempt.quiz.course", "attempt.enrollment", "attempt.enrollment.student", "attempt.enrollment.student.user"])
    fun findAllByAttemptQuizIdInAndSeverityInAndDeletedFalseOrderByOccurredAtDesc(
        quizIds: Collection<Long>,
        severities: Collection<ProctoringEventSeverity>,
        pageable: Pageable,
    ): List<ProctoringEvent>

    @EntityGraph(attributePaths = ["session", "attempt", "attempt.quiz", "attempt.quiz.course", "attempt.enrollment", "attempt.enrollment.student", "attempt.enrollment.student.user"])
    fun findAllByAttemptIdAndDeletedFalseOrderByOccurredAtDesc(
        attemptId: Long,
        pageable: Pageable,
    ): List<ProctoringEvent>

    @Query(
        """
        select e.attempt.id as attemptId,
               sum(case when e.severity in :riskSeverities then 1 else 0 end) as riskEvents,
               max(e.occurredAt) as lastEventAt,
               max(case when e.type = :heartbeatType then e.occurredAt else null end) as lastHeartbeatAt
          from ProctoringEvent e
         where e.attempt.id in :attemptIds and e.deleted = false
         group by e.attempt.id
        """
    )
    fun summarizeAttempts(
        @Param("attemptIds") attemptIds: Collection<Long>,
        @Param("riskSeverities") riskSeverities: Collection<ProctoringEventSeverity>,
        @Param("heartbeatType") heartbeatType: ProctoringEventType,
    ): List<ProctorAttemptEventSummary>
}

interface ProctorAttemptEventSummary {
    fun getAttemptId(): Long
    fun getRiskEvents(): Long
    fun getLastEventAt(): Instant?
    fun getLastHeartbeatAt(): Instant?
}
