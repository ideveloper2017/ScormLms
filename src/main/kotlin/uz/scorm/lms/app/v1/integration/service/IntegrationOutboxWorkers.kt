package uz.scorm.lms.app.v1.integration.service

import mu.KotlinLogging
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component
import org.springframework.transaction.event.TransactionPhase
import org.springframework.transaction.event.TransactionalEventListener

@Component
class IntegrationOutboxCommitListener(private val processor: IntegrationOutboxProcessor) {
    private val log = KotlinLogging.logger {}

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    fun onQueued(event: IntegrationOutboxQueued) {
        runCatching { processor.process(event.eventId) }
            .onFailure { log.error(it) { "Outbox event ${event.eventId} commitdan keyin qayta ishlanmadi" } }
    }
}

@Component
@ConditionalOnProperty(prefix = "app.integration.worker", name = ["enabled"], havingValue = "true", matchIfMissing = true)
class IntegrationOutboxScheduledWorker(private val service: IntegrationOutboxService) {
    private val log = KotlinLogging.logger {}

    @Scheduled(
        fixedDelayString = "\${app.integration.worker.fixed-delay-ms:30000}",
        initialDelayString = "\${app.integration.worker.initial-delay-ms:30000}",
    )
    fun processDue() {
        runCatching { service.processDue(100) }
            .onFailure { log.error(it) { "Integration outbox navbatini qayta ishlashda xato" } }
    }
}
