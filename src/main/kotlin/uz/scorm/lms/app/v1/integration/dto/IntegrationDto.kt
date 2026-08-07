package uz.scorm.lms.app.v1.integration.dto

import java.time.Instant

data class IntegrationMetricsDto(
    val total: Long,
    val pending: Long,
    val processing: Long,
    val failed: Long,
    val succeeded: Long,
    val deadLetter: Long,
    val dueNow: Long,
    val successRate: Double,
    val lastCompletedAt: Instant?,
    val workerEnabled: Boolean,
    val canManage: Boolean,
)

data class IntegrationEventDto(
    val id: Long,
    val eventKey: String,
    val connector: String,
    val eventType: String,
    val aggregateType: String,
    val aggregateId: Long,
    val payloadVersion: Int,
    val priority: Int,
    val status: String,
    val attemptCount: Int,
    val maxAttempts: Int,
    val nextAttemptAt: Instant,
    val lastAttemptAt: Instant?,
    val completedAt: Instant?,
    val providerReference: String?,
    val lastErrorCode: String?,
    val lastErrorMessage: String?,
    val createdAt: Instant?,
    val canRetry: Boolean,
)

data class IntegrationAttemptDto(
    val id: Long,
    val sequence: Int,
    val startedAt: Instant,
    val completedAt: Instant,
    val durationMs: Long,
    val outcome: String,
    val errorCode: String?,
    val errorMessage: String?,
    val providerReference: String?,
)

data class IntegrationEventDetailDto(
    val event: IntegrationEventDto,
    val attempts: List<IntegrationAttemptDto>,
)

data class IntegrationProcessResultDto(
    val selected: Int,
    val succeeded: Int,
    val retryScheduled: Int,
    val deadLetter: Int,
    val skipped: Int,
)
