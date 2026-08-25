package uz.scorm.lms.app.v1.integration.service

import tools.jackson.databind.ObjectMapper
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Propagation
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.announcement.model.AnnouncementDeliveryStatus
import uz.scorm.lms.app.v1.announcement.repository.AnnouncementDeliveryRepository
import uz.scorm.lms.app.v1.announcement.service.AnnouncementDeliveryGateway
import uz.scorm.lms.app.v1.announcement.service.AnnouncementDispatchResult
import uz.scorm.lms.app.v1.integration.model.IntegrationAttempt
import uz.scorm.lms.app.v1.integration.model.IntegrationAttemptOutcome
import uz.scorm.lms.app.v1.integration.model.IntegrationEventStatus
import uz.scorm.lms.app.v1.integration.repository.IntegrationAttemptRepository
import uz.scorm.lms.app.v1.integration.repository.IntegrationOutboxRepository
import java.time.Duration
import java.time.Instant
import kotlin.math.min

enum class IntegrationProcessingOutcome { SUCCEEDED, RETRY_SCHEDULED, DEAD_LETTER, SKIPPED }

@Service
class IntegrationOutboxProcessor(
    private val outboxRepository: IntegrationOutboxRepository,
    private val attemptRepository: IntegrationAttemptRepository,
    private val deliveryRepository: AnnouncementDeliveryRepository,
    private val deliveryGateway: AnnouncementDeliveryGateway,
    private val objectMapper: ObjectMapper,
    @param:Value("\${app.integration.retry-base-seconds:30}") private val retryBaseSeconds: Long,
    @param:Value("\${app.integration.retry-max-seconds:3600}") private val retryMaxSeconds: Long,
) {
    init {
        require(retryBaseSeconds > 0) { "Integration retry base musbat bo'lishi kerak" }
        require(retryMaxSeconds >= retryBaseSeconds) { "Integration retry max base qiymatdan kichik bo'lmasligi kerak" }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    fun process(eventId: Long, force: Boolean = false): IntegrationProcessingOutcome {
        val event = outboxRepository.lockById(eventId) ?: return IntegrationProcessingOutcome.SKIPPED
        val now = Instant.now()
        if (event.status == IntegrationEventStatus.SUCCEEDED) return IntegrationProcessingOutcome.SKIPPED
        if (!force && (event.status == IntegrationEventStatus.DEAD_LETTER || event.nextAttemptAt.isAfter(now))) {
            return IntegrationProcessingOutcome.SKIPPED
        }
        if (force && event.attemptCount >= event.maxAttempts) event.maxAttempts = event.attemptCount + 1

        event.status = IntegrationEventStatus.PROCESSING
        event.lastAttemptAt = now
        val started = Instant.now()
        val result = runCatching { dispatch(event.eventType, event.payload) }
            .getOrElse { AnnouncementDispatchResult(false, error = "PROCESSOR_ERROR:${it.javaClass.simpleName}") }
        val completed = Instant.now()

        event.attemptCount += 1
        event.providerReference = result.providerReference?.take(250)
        event.lastErrorCode = result.error?.substringBefore(':')?.take(100)
        event.lastErrorMessage = result.error?.take(1000)

        val outcome = when {
            result.delivered -> {
                event.status = IntegrationEventStatus.SUCCEEDED
                event.completedAt = completed
                event.lastErrorCode = null
                event.lastErrorMessage = null
                IntegrationProcessingOutcome.SUCCEEDED
            }
            result.skipped || event.attemptCount >= event.maxAttempts -> {
                event.status = IntegrationEventStatus.DEAD_LETTER
                event.completedAt = completed
                IntegrationProcessingOutcome.DEAD_LETTER
            }
            else -> {
                event.status = IntegrationEventStatus.FAILED
                event.nextAttemptAt = completed.plusSeconds(backoffSeconds(event.attemptCount))
                event.completedAt = null
                IntegrationProcessingOutcome.RETRY_SCHEDULED
            }
        }
        outboxRepository.save(event)
        attemptRepository.save(IntegrationAttempt(
            event = event,
            sequence = event.attemptCount,
            startedAt = started,
            completedAt = completed,
            durationMs = Duration.between(started, completed).toMillis().coerceAtLeast(0),
            outcome = when (outcome) {
                IntegrationProcessingOutcome.SUCCEEDED -> IntegrationAttemptOutcome.SUCCESS
                IntegrationProcessingOutcome.RETRY_SCHEDULED -> IntegrationAttemptOutcome.RETRY_SCHEDULED
                else -> IntegrationAttemptOutcome.DEAD_LETTER
            },
            errorCode = event.lastErrorCode,
            errorMessage = event.lastErrorMessage,
            providerReference = event.providerReference,
        ))
        return outcome
    }

    private fun dispatch(eventType: String, payload: String): AnnouncementDispatchResult {
        require(eventType == ANNOUNCEMENT_DELIVERY) { "UNSUPPORTED_EVENT_TYPE:$eventType" }
        val deliveryId = objectMapper.readTree(payload).path("deliveryId").asLong(0)
        require(deliveryId > 0) { "INVALID_PAYLOAD" }
        val delivery = deliveryRepository.lockByIdAndDeletedFalse(deliveryId)
            ?: return AnnouncementDispatchResult(false, skipped = true, error = "DELIVERY_NOT_FOUND")
        if (delivery.status in setOf(AnnouncementDeliveryStatus.DELIVERED, AnnouncementDeliveryStatus.READ)) {
            return AnnouncementDispatchResult(true, providerReference = delivery.providerReference ?: "already-delivered")
        }
        delivery.attemptCount += 1
        delivery.lastAttemptAt = Instant.now()
        val result = deliveryGateway.dispatch(
            delivery.channel,
            requireNotNull(delivery.id),
            delivery.announcement,
            delivery.recipient,
        )
        delivery.destinationMasked = result.destinationMasked
        delivery.providerReference = result.providerReference
        delivery.lastError = result.error?.take(1000)
        delivery.status = when {
            result.delivered -> AnnouncementDeliveryStatus.DELIVERED
            result.skipped -> AnnouncementDeliveryStatus.SKIPPED
            else -> AnnouncementDeliveryStatus.FAILED
        }
        delivery.deliveredAt = if (result.delivered) Instant.now() else null
        deliveryRepository.save(delivery)
        return result
    }

    private fun backoffSeconds(attempt: Int): Long {
        val multiplier = 1L shl min((attempt - 1).coerceAtLeast(0), 20)
        return min(retryBaseSeconds * multiplier, retryMaxSeconds)
    }

    companion object {
        const val ANNOUNCEMENT_DELIVERY = "ANNOUNCEMENT_DELIVERY"
    }
}
