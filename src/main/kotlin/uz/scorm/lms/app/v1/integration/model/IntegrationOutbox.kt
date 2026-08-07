package uz.scorm.lms.app.v1.integration.model

import jakarta.persistence.*
import uz.scorm.lms.app.common.BaseEntity
import java.time.Instant

enum class IntegrationEventStatus { PENDING, PROCESSING, FAILED, SUCCEEDED, DEAD_LETTER }
enum class IntegrationAttemptOutcome { SUCCESS, RETRY_SCHEDULED, DEAD_LETTER }

@Entity
@Table(
    name = "integration_outbox_events",
    uniqueConstraints = [UniqueConstraint(name = "uk_integration_outbox_event_key", columnNames = ["event_key"])],
    indexes = [
        Index(name = "idx_integration_outbox_due", columnList = "event_status,next_attempt_at,priority"),
        Index(name = "idx_integration_outbox_connector", columnList = "connector,created_at"),
        Index(name = "idx_integration_outbox_aggregate", columnList = "aggregate_type,aggregate_id"),
    ],
)
class IntegrationOutboxEvent(
    @Column(name = "event_key", nullable = false, length = 180)
    var eventKey: String,

    @Column(nullable = false, length = 80)
    var connector: String,

    @Column(name = "event_type", nullable = false, length = 100)
    var eventType: String,

    @Column(name = "aggregate_type", nullable = false, length = 80)
    var aggregateType: String,

    @Column(name = "aggregate_id", nullable = false)
    var aggregateId: Long,

    @Column(nullable = false, columnDefinition = "TEXT")
    var payload: String = "{}",

    @Column(name = "payload_version", nullable = false)
    var payloadVersion: Int = 1,

    @Column(nullable = false)
    var priority: Int = 0,

    @Enumerated(EnumType.STRING)
    @Column(name = "event_status", nullable = false, length = 20)
    var status: IntegrationEventStatus = IntegrationEventStatus.PENDING,

    @Column(name = "attempt_count", nullable = false)
    var attemptCount: Int = 0,

    @Column(name = "max_attempts", nullable = false)
    var maxAttempts: Int = 5,

    @Column(name = "next_attempt_at", nullable = false)
    var nextAttemptAt: Instant = Instant.now(),

    @Column(name = "last_attempt_at")
    var lastAttemptAt: Instant? = null,

    @Column(name = "completed_at")
    var completedAt: Instant? = null,

    @Column(name = "provider_reference", length = 250)
    var providerReference: String? = null,

    @Column(name = "last_error_code", length = 100)
    var lastErrorCode: String? = null,

    @Column(name = "last_error_message", length = 1000)
    var lastErrorMessage: String? = null,
) : BaseEntity()

@Entity
@Table(
    name = "integration_attempts",
    uniqueConstraints = [UniqueConstraint(name = "uk_integration_attempt_sequence", columnNames = ["event_id", "attempt_sequence"])],
    indexes = [Index(name = "idx_integration_attempt_event", columnList = "event_id,attempt_sequence")],
)
class IntegrationAttempt(
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "event_id", nullable = false)
    var event: IntegrationOutboxEvent,

    @Column(name = "attempt_sequence", nullable = false)
    var sequence: Int,

    @Column(name = "started_at", nullable = false)
    var startedAt: Instant,

    @Column(name = "completed_at", nullable = false)
    var completedAt: Instant,

    @Column(name = "duration_ms", nullable = false)
    var durationMs: Long,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    var outcome: IntegrationAttemptOutcome,

    @Column(name = "error_code", length = 100)
    var errorCode: String? = null,

    @Column(name = "error_message", length = 1000)
    var errorMessage: String? = null,

    @Column(name = "provider_reference", length = 250)
    var providerReference: String? = null,
) : BaseEntity()
