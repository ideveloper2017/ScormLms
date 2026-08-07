package uz.scorm.lms.app.v1.integration.service

import com.fasterxml.jackson.databind.ObjectMapper
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.ApplicationEventPublisher
import org.springframework.data.domain.PageRequest
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.announcement.model.AnnouncementChannel
import uz.scorm.lms.app.v1.announcement.model.AnnouncementDelivery
import uz.scorm.lms.app.v1.audit.service.AuditService
import uz.scorm.lms.app.v1.integration.dto.*
import uz.scorm.lms.app.v1.integration.model.IntegrationAttempt
import uz.scorm.lms.app.v1.integration.model.IntegrationEventStatus
import uz.scorm.lms.app.v1.integration.model.IntegrationOutboxEvent
import uz.scorm.lms.app.v1.integration.repository.IntegrationAttemptRepository
import uz.scorm.lms.app.v1.integration.repository.IntegrationOutboxRepository
import java.time.Instant

data class IntegrationOutboxQueued(val eventId: Long)

@Service
class IntegrationOutboxService(
    private val outboxRepository: IntegrationOutboxRepository,
    private val attemptRepository: IntegrationAttemptRepository,
    private val processor: IntegrationOutboxProcessor,
    private val objectMapper: ObjectMapper,
    private val eventPublisher: ApplicationEventPublisher,
    private val auditService: AuditService,
    @param:Value("\${app.integration.max-attempts:5}") private val configuredMaxAttempts: Int,
    @param:Value("\${app.integration.worker.enabled:true}") private val workerEnabled: Boolean,
) {
    init {
        require(configuredMaxAttempts in 1..50) { "Integration max-attempts 1..50 oralig'ida bo'lishi kerak" }
    }

    @Transactional
    fun enqueueAnnouncementDelivery(delivery: AnnouncementDelivery): IntegrationOutboxEvent {
        require(delivery.channel != AnnouncementChannel.IN_APP) { "IN_APP persistent inbox outbox talab qilmaydi" }
        val deliveryId = requireNotNull(delivery.id)
        val key = "announcement-delivery-$deliveryId"
        outboxRepository.findByEventKeyAndDeletedFalse(key)?.let { return it }
        val saved = outboxRepository.save(IntegrationOutboxEvent(
            eventKey = key,
            connector = "ANNOUNCEMENT_${delivery.channel.name}",
            eventType = IntegrationOutboxProcessor.ANNOUNCEMENT_DELIVERY,
            aggregateType = "ANNOUNCEMENT_DELIVERY",
            aggregateId = deliveryId,
            payload = objectMapper.writeValueAsString(mapOf("deliveryId" to deliveryId)),
            priority = when (delivery.announcement.priority.name) {
                "URGENT" -> 100
                "HIGH" -> 50
                "NORMAL" -> 10
                else -> 0
            },
            maxAttempts = configuredMaxAttempts,
        ))
        eventPublisher.publishEvent(IntegrationOutboxQueued(requireNotNull(saved.id)))
        return saved
    }

    @Transactional(readOnly = true)
    fun metrics(canManage: Boolean): IntegrationMetricsDto {
        val succeeded = outboxRepository.countByStatusAndDeletedFalse(IntegrationEventStatus.SUCCEEDED)
        val deadLetter = outboxRepository.countByStatusAndDeletedFalse(IntegrationEventStatus.DEAD_LETTER)
        val terminal = succeeded + deadLetter
        return IntegrationMetricsDto(
            total = outboxRepository.countByDeletedFalse(),
            pending = outboxRepository.countByStatusAndDeletedFalse(IntegrationEventStatus.PENDING),
            processing = outboxRepository.countByStatusAndDeletedFalse(IntegrationEventStatus.PROCESSING),
            failed = outboxRepository.countByStatusAndDeletedFalse(IntegrationEventStatus.FAILED),
            succeeded = succeeded,
            deadLetter = deadLetter,
            dueNow = outboxRepository.countDue(dueStatuses, Instant.now()),
            successRate = if (terminal == 0L) 0.0 else succeeded.toDouble() * 100.0 / terminal,
            lastCompletedAt = outboxRepository.lastCompletedAt(IntegrationEventStatus.SUCCEEDED),
            workerEnabled = workerEnabled,
            canManage = canManage,
        )
    }

    @Transactional(readOnly = true)
    fun events(status: String?, connector: String?, errorOnly: Boolean, limit: Int, canManage: Boolean): List<IntegrationEventDto> {
        val statusFilter = status?.takeIf(String::isNotBlank)?.let {
            runCatching { IntegrationEventStatus.valueOf(it.trim().uppercase()) }
                .getOrElse { throw IllegalArgumentException("Integratsiya holati noto'g'ri") }
        }
        val connectorFilter = connector?.trim()?.uppercase()?.takeIf(String::isNotBlank)
        return outboxRepository.search(
            statusFilter,
            connectorFilter,
            errorOnly,
            setOf(IntegrationEventStatus.FAILED, IntegrationEventStatus.DEAD_LETTER),
            PageRequest.of(0, limit.coerceIn(1, 500)),
        ).asSequence()
            .map { dto(it, canManage) }
            .toList()
    }

    @Transactional(readOnly = true)
    fun detail(id: Long, canManage: Boolean): IntegrationEventDetailDto {
        val event = outboxRepository.findById(id).filter { !it.deleted }
            .orElseThrow { NoSuchElementException("Integratsiya eventi topilmadi") }
        return IntegrationEventDetailDto(
            event = dto(event, canManage),
            attempts = attemptRepository.findAllByEventIdAndDeletedFalseOrderBySequenceAsc(id).map(::attemptDto),
        )
    }

    fun processDue(limit: Int, actorId: Long? = null): IntegrationProcessResultDto {
        val ids = outboxRepository.dueIds(dueStatuses, Instant.now()).take(limit.coerceIn(1, 200))
        val result = summarize(ids.map { processor.process(it) })
        actorId?.let { auditService.logAction("INTEGRATION_OUTBOX_PROCESSED", it, "selected=${result.selected}; succeeded=${result.succeeded}; retry=${result.retryScheduled}; dead=${result.deadLetter}") }
        return result
    }

    @Transactional
    fun retry(id: Long, actorId: Long): IntegrationEventDto {
        val event = outboxRepository.lockById(id) ?: throw NoSuchElementException("Integratsiya eventi topilmadi")
        require(event.status != IntegrationEventStatus.SUCCEEDED) { "Muvaffaqiyatli event qayta yuborilmaydi" }
        event.status = IntegrationEventStatus.PENDING
        event.nextAttemptAt = Instant.now()
        event.completedAt = null
        event.maxAttempts = maxOf(event.maxAttempts, event.attemptCount + configuredMaxAttempts)
        val saved = outboxRepository.save(event)
        auditService.logAction("INTEGRATION_OUTBOX_REQUEUED", actorId, "event=$id; eventKey=${event.eventKey}")
        eventPublisher.publishEvent(IntegrationOutboxQueued(id))
        return dto(saved, true)
    }

    @Transactional
    fun retryAnnouncementDeliveries(deliveries: Collection<AnnouncementDelivery>, actorId: Long): Int {
        var selected = 0
        deliveries.distinctBy { it.id }.forEach { delivery ->
            val deliveryId = requireNotNull(delivery.id)
            val existing = outboxRepository.findByEventKeyAndDeletedFalse("announcement-delivery-$deliveryId")
            val event = existing ?: enqueueAnnouncementDelivery(delivery)
            if (event.status == IntegrationEventStatus.SUCCEEDED) return@forEach
            event.status = IntegrationEventStatus.PENDING
            event.nextAttemptAt = Instant.now()
            event.completedAt = null
            event.maxAttempts = maxOf(event.maxAttempts, event.attemptCount + configuredMaxAttempts)
            outboxRepository.save(event)
            if (existing != null) eventPublisher.publishEvent(IntegrationOutboxQueued(requireNotNull(event.id)))
            selected += 1
        }
        if (selected > 0) auditService.logAction("ANNOUNCEMENT_DELIVERIES_REQUEUED", actorId, "selected=$selected")
        return selected
    }

    private fun summarize(outcomes: List<IntegrationProcessingOutcome>) = IntegrationProcessResultDto(
        selected = outcomes.size,
        succeeded = outcomes.count { it == IntegrationProcessingOutcome.SUCCEEDED },
        retryScheduled = outcomes.count { it == IntegrationProcessingOutcome.RETRY_SCHEDULED },
        deadLetter = outcomes.count { it == IntegrationProcessingOutcome.DEAD_LETTER },
        skipped = outcomes.count { it == IntegrationProcessingOutcome.SKIPPED },
    )

    private fun dto(event: IntegrationOutboxEvent, canManage: Boolean) = IntegrationEventDto(
        id = requireNotNull(event.id),
        eventKey = event.eventKey,
        connector = event.connector,
        eventType = event.eventType,
        aggregateType = event.aggregateType,
        aggregateId = event.aggregateId,
        payloadVersion = event.payloadVersion,
        priority = event.priority,
        status = event.status.name,
        attemptCount = event.attemptCount,
        maxAttempts = event.maxAttempts,
        nextAttemptAt = event.nextAttemptAt,
        lastAttemptAt = event.lastAttemptAt,
        completedAt = event.completedAt,
        providerReference = event.providerReference,
        lastErrorCode = event.lastErrorCode,
        lastErrorMessage = event.lastErrorMessage,
        createdAt = event.createdAt,
        canRetry = canManage && event.status != IntegrationEventStatus.SUCCEEDED,
    )

    private fun attemptDto(attempt: IntegrationAttempt) = IntegrationAttemptDto(
        id = requireNotNull(attempt.id),
        sequence = attempt.sequence,
        startedAt = attempt.startedAt,
        completedAt = attempt.completedAt,
        durationMs = attempt.durationMs,
        outcome = attempt.outcome.name,
        errorCode = attempt.errorCode,
        errorMessage = attempt.errorMessage,
        providerReference = attempt.providerReference,
    )

    companion object {
        private val dueStatuses = setOf(IntegrationEventStatus.PENDING, IntegrationEventStatus.FAILED)
    }
}
