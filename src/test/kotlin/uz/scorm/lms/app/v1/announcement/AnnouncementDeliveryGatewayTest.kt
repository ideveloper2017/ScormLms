package uz.scorm.lms.app.v1.announcement

import com.fasterxml.jackson.databind.ObjectMapper
import com.sun.net.httpserver.HttpServer
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import org.mockito.Mockito.mock
import org.springframework.messaging.simp.SimpMessagingTemplate
import uz.scorm.lms.app.v1.announcement.model.Announcement
import uz.scorm.lms.app.v1.announcement.model.AnnouncementAudience
import uz.scorm.lms.app.v1.announcement.model.AnnouncementChannel
import uz.scorm.lms.app.v1.announcement.service.DefaultAnnouncementDeliveryGateway
import uz.scorm.lms.app.v1.user.model.User
import java.net.InetSocketAddress
import java.util.concurrent.atomic.AtomicReference

class AnnouncementDeliveryGatewayTest {
    @Test
    fun `configured email webhook receives idempotent payload`() {
        val body = AtomicReference("")
        val idempotency = AtomicReference("")
        val authorization = AtomicReference("")
        val server = HttpServer.create(InetSocketAddress("127.0.0.1", 0), 0)
        server.createContext("/email") { exchange ->
            body.set(exchange.requestBody.bufferedReader().use { it.readText() })
            idempotency.set(exchange.requestHeaders.getFirst("Idempotency-Key"))
            authorization.set(exchange.requestHeaders.getFirst("Authorization"))
            exchange.responseHeaders.add("X-Request-Id", "provider-request-42")
            exchange.sendResponseHeaders(202, -1)
            exchange.close()
        }
        server.start()
        try {
            val user = User(username = "recipient", email = "recipient@example.uz", password = "hash").also { it.id = 7 }
            val announcement = Announcement(
                title = "Muhim e'lon",
                body = "E'lon matni",
                audience = AnnouncementAudience.INSTITUTION,
                author = user,
            ).also { it.id = 3 }
            val gateway = DefaultAnnouncementDeliveryGateway(
                mock(SimpMessagingTemplate::class.java),
                ObjectMapper().findAndRegisterModules(),
                "http://127.0.0.1:${server.address.port}/email",
                "secret-token",
                "",
                "",
            )

            val result = gateway.dispatch(AnnouncementChannel.EMAIL, 42, announcement, user)

            assertTrue(result.delivered)
            assertEquals("provider-request-42", result.providerReference)
            assertEquals("announcement-delivery-42", idempotency.get())
            assertEquals("Bearer secret-token", authorization.get())
            assertTrue(body.get().contains("recipient@example.uz"))
            assertTrue(body.get().contains("\"idempotencyKey\":\"announcement-delivery-42\""))
        } finally {
            server.stop(0)
        }
    }
}
