package uz.scorm.lms.app.v1.integration.repository

import jakarta.persistence.LockModeType
import org.springframework.data.jpa.repository.EntityGraph
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Lock
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.data.domain.Pageable
import uz.scorm.lms.app.v1.integration.model.IntegrationAttempt
import uz.scorm.lms.app.v1.integration.model.IntegrationEventStatus
import uz.scorm.lms.app.v1.integration.model.IntegrationOutboxEvent
import java.time.Instant

interface IntegrationOutboxRepository : JpaRepository<IntegrationOutboxEvent, Long> {
    fun countByDeletedFalse(): Long
    fun findByEventKeyAndDeletedFalse(eventKey: String): IntegrationOutboxEvent?

    @Query("""
        SELECT e.id FROM IntegrationOutboxEvent e
        WHERE e.deleted = false AND e.status IN :statuses AND e.nextAttemptAt <= :now
        ORDER BY e.priority DESC, e.nextAttemptAt ASC, e.id ASC
    """)
    fun dueIds(
        @Param("statuses") statuses: Collection<IntegrationEventStatus>,
        @Param("now") now: Instant,
    ): List<Long>

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT e FROM IntegrationOutboxEvent e WHERE e.id = :id AND e.deleted = false")
    fun lockById(@Param("id") id: Long): IntegrationOutboxEvent?

    fun findAllByDeletedFalseOrderByCreatedAtDesc(): List<IntegrationOutboxEvent>

    fun countByStatusAndDeletedFalse(status: IntegrationEventStatus): Long

    @Query("""
        SELECT COUNT(e) FROM IntegrationOutboxEvent e
        WHERE e.deleted = false AND e.status IN :statuses AND e.nextAttemptAt <= :now
    """)
    fun countDue(
        @Param("statuses") statuses: Collection<IntegrationEventStatus>,
        @Param("now") now: Instant,
    ): Long

    @Query("""
        SELECT e FROM IntegrationOutboxEvent e
        WHERE e.deleted = false
          AND (:status IS NULL OR e.status = :status)
          AND (:connector IS NULL OR e.connector = :connector)
          AND (:errorOnly = false OR e.status IN :errorStatuses)
        ORDER BY e.createdAt DESC, e.id DESC
    """)
    fun search(
        @Param("status") status: IntegrationEventStatus?,
        @Param("connector") connector: String?,
        @Param("errorOnly") errorOnly: Boolean,
        @Param("errorStatuses") errorStatuses: Collection<IntegrationEventStatus>,
        pageable: Pageable,
    ): List<IntegrationOutboxEvent>

    @Query("SELECT MAX(e.completedAt) FROM IntegrationOutboxEvent e WHERE e.deleted = false AND e.status = :status")
    fun lastCompletedAt(@Param("status") status: IntegrationEventStatus): Instant?
}

interface IntegrationAttemptRepository : JpaRepository<IntegrationAttempt, Long> {
    @EntityGraph(attributePaths = ["event"])
    fun findAllByEventIdAndDeletedFalseOrderBySequenceAsc(eventId: Long): List<IntegrationAttempt>
}
