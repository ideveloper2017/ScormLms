package uz.scorm.lms.app.v1.integration

import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Primary
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.context.TestConfiguration
import org.springframework.security.test.context.support.WithMockUser
import org.springframework.test.context.ActiveProfiles
import org.springframework.context.annotation.Import
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.post
import org.springframework.transaction.support.TransactionTemplate
import uz.scorm.lms.app.v1.announcement.model.*
import uz.scorm.lms.app.v1.announcement.repository.AnnouncementDeliveryRepository
import uz.scorm.lms.app.v1.announcement.repository.AnnouncementRepository
import uz.scorm.lms.app.v1.announcement.service.AnnouncementDeliveryGateway
import uz.scorm.lms.app.v1.announcement.service.AnnouncementDispatchResult
import uz.scorm.lms.app.v1.integration.model.IntegrationEventStatus
import uz.scorm.lms.app.v1.integration.repository.IntegrationAttemptRepository
import uz.scorm.lms.app.v1.integration.repository.IntegrationOutboxRepository
import uz.scorm.lms.app.v1.integration.service.IntegrationOutboxProcessor
import uz.scorm.lms.app.v1.integration.service.IntegrationOutboxService
import uz.scorm.lms.app.v1.integration.service.IntegrationProcessingOutcome
import uz.scorm.lms.app.v1.user.model.User
import uz.scorm.lms.app.v1.user.repository.UserRepository
import java.time.Instant
import java.util.concurrent.atomic.AtomicInteger

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(IntegrationOutboxWorkflowIntegrationTest.TestConfig::class)
class IntegrationOutboxWorkflowIntegrationTest {
    @Autowired private lateinit var service: IntegrationOutboxService
    @Autowired private lateinit var processor: IntegrationOutboxProcessor
    @Autowired private lateinit var outboxRepository: IntegrationOutboxRepository
    @Autowired private lateinit var attemptRepository: IntegrationAttemptRepository
    @Autowired private lateinit var announcementRepository: AnnouncementRepository
    @Autowired private lateinit var deliveryRepository: AnnouncementDeliveryRepository
    @Autowired private lateinit var userRepository: UserRepository
    @Autowired private lateinit var transactions: TransactionTemplate
    @Autowired private lateinit var mockMvc: MockMvc
    @Autowired private lateinit var gateway: TestGateway

    @BeforeEach
    fun configureGateway() {
        gateway.externalCalls.set(0)
        gateway.alwaysFail = false
    }

    @Test
    fun `committed external delivery is retried idempotently and every attempt is immutable`() {
        val eventId = createOutboxEvent("integration-success")

        val failed = outboxRepository.findById(eventId).orElseThrow()
        assertEquals(IntegrationEventStatus.FAILED, failed.status)
        assertEquals(1, failed.attemptCount)
        assertEquals("PROVIDER_HTTP_503", failed.lastErrorCode)
        assertEquals(1, attemptRepository.findAllByEventIdAndDeletedFalseOrderBySequenceAsc(eventId).size)

        assertEquals(IntegrationProcessingOutcome.SUCCEEDED, processor.process(eventId, force = true))
        val succeeded = outboxRepository.findById(eventId).orElseThrow()
        assertEquals(IntegrationEventStatus.SUCCEEDED, succeeded.status)
        assertEquals(2, succeeded.attemptCount)
        assertEquals("provider-request-2", succeeded.providerReference)
        assertEquals(listOf("RETRY_SCHEDULED", "SUCCESS"),
            attemptRepository.findAllByEventIdAndDeletedFalseOrderBySequenceAsc(eventId).map { it.outcome.name })

        assertEquals(IntegrationProcessingOutcome.SKIPPED, processor.process(eventId, force = true))
        assertEquals(2, gateway.externalCalls.get())
        assertEquals("announcement-delivery-${succeeded.aggregateId}", succeeded.eventKey)
        assertEquals(1, outboxRepository.findAllByDeletedFalseOrderByCreatedAtDesc().count { it.eventKey == succeeded.eventKey })
    }

    @Test
    fun `dead letter may be manually requeued without losing the first five attempts`() {
        gateway.alwaysFail = true
        val eventId = createOutboxEvent("integration-dead-letter")
        repeat(4) { processor.process(eventId, force = true) }
        assertEquals(IntegrationEventStatus.DEAD_LETTER, outboxRepository.findById(eventId).orElseThrow().status)
        assertEquals(5, attemptRepository.findAllByEventIdAndDeletedFalseOrderBySequenceAsc(eventId).size)

        val actor = user("integration-retry-actor")
        service.retry(eventId, requireNotNull(actor.id))

        val retried = outboxRepository.findById(eventId).orElseThrow()
        assertEquals(IntegrationEventStatus.FAILED, retried.status)
        assertEquals(6, retried.attemptCount)
        assertEquals(6, attemptRepository.findAllByEventIdAndDeletedFalseOrderBySequenceAsc(eventId).size)
        assertEquals(6, deliveryRepository.findById(retried.aggregateId).orElseThrow().attemptCount)
    }

    private fun createOutboxEvent(key: String): Long = transactions.execute {
            val author = user("$key-author")
            val recipient = user("$key-recipient", "$key@example.uz")
            val announcement = announcementRepository.save(Announcement(
                title = "Integratsiya testi",
                body = "Outbox orqali yuboriladigan xabar",
                audience = AnnouncementAudience.INSTITUTION,
                priority = AnnouncementPriority.HIGH,
                status = AnnouncementStatus.PUBLISHED,
                channels = "EMAIL",
                author = author,
                publishedAt = Instant.now(),
                publishedBy = author,
            ))
            val delivery = deliveryRepository.save(AnnouncementDelivery(
                announcement = announcement,
                recipient = recipient,
                channel = AnnouncementChannel.EMAIL,
            ))
            requireNotNull(service.enqueueAnnouncementDelivery(delivery).id)
        }!!

    @Test
    @WithMockUser(username = "integration-http-reader", authorities = ["INTEGRATION_READ"])
    fun `integration reader sees audit but cannot run worker`() {
        user("integration-http-reader")
        mockMvc.get("/api/v1/integrations/metrics").andExpect {
            status { isOk() }
            jsonPath("$.success") { value(true) }
            jsonPath("$.data.canManage") { value(false) }
        }
        mockMvc.post("/api/v1/integrations/process-due").andExpect { status { isForbidden() } }
    }

    @Test
    @WithMockUser(username = "integration-http-writer", authorities = ["INTEGRATION_READ", "INTEGRATION_WRITE"])
    fun `integration writer may run worker`() {
        user("integration-http-writer")
        mockMvc.post("/api/v1/integrations/process-due?limit=10").andExpect {
            status { isOk() }
            jsonPath("$.success") { value(true) }
            jsonPath("$.data.selected") { isNumber() }
        }
    }

    private fun user(username: String, email: String? = null): User =
        userRepository.findByUsername(username) ?: run {
            userRepository.save(User(
                username = username,
                email = email,
                password = "test-password-hash",
                fullName = username,
            ))
        }

    @TestConfiguration
    class TestConfig {
        @Bean
        @Primary
        fun testGateway(): TestGateway = TestGateway()
    }

    class TestGateway : AnnouncementDeliveryGateway {
        val externalCalls = AtomicInteger()
        var alwaysFail: Boolean = false

        override fun dispatch(
            channel: AnnouncementChannel,
            deliveryId: Long,
            announcement: Announcement,
            recipient: User,
        ): AnnouncementDispatchResult = if (channel == AnnouncementChannel.IN_APP) {
            AnnouncementDispatchResult(true, providerReference = "persisted-inbox")
        } else if (alwaysFail || externalCalls.incrementAndGet() == 1) {
            if (alwaysFail) externalCalls.incrementAndGet()
            AnnouncementDispatchResult(false, error = "PROVIDER_HTTP_503")
        } else {
            AnnouncementDispatchResult(true, destinationMasked = "in***@example.uz", providerReference = "provider-request-2")
        }
    }
}
