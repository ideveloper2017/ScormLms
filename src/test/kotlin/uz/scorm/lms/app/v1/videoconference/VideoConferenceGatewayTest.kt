package uz.scorm.lms.app.v1.videoconference

import tools.jackson.databind.ObjectMapper
import tools.jackson.module.kotlin.jacksonObjectMapper
import com.sun.net.httpserver.HttpServer
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import uz.scorm.lms.app.v1.videoconference.service.DefaultVideoConferenceGateway
import uz.scorm.lms.app.v1.videoconference.service.VideoConferenceProvisionCommand
import java.net.InetSocketAddress
import java.time.Instant
import java.util.concurrent.atomic.AtomicReference

class VideoConferenceGatewayTest {
    @Test
    fun `configured adapter receives neutral idempotent provision and cancel contract`() {
        val provisionBody = AtomicReference("")
        val provisionKey = AtomicReference("")
        val cancelPath = AtomicReference("")
        val authorization = AtomicReference("")
        val server = HttpServer.create(InetSocketAddress("127.0.0.1", 0), 0)
        server.createContext("/meetings") { exchange ->
            authorization.set(exchange.requestHeaders.getFirst("Authorization"))
            if (exchange.requestMethod == "POST") {
                provisionBody.set(exchange.requestBody.bufferedReader().use { it.readText() })
                provisionKey.set(exchange.requestHeaders.getFirst("Idempotency-Key"))
                val response = """{"meetingId":"provider-77","joinUrl":"https://meet.example.uz/join/77","hostUrl":"https://meet.example.uz/host/77"}""".toByteArray()
                exchange.sendResponseHeaders(201, response.size.toLong())
                exchange.responseBody.use { it.write(response) }
            } else {
                cancelPath.set(exchange.requestURI.path)
                exchange.sendResponseHeaders(204, -1)
                exchange.close()
            }
        }
        server.start()
        try {
            val gateway = DefaultVideoConferenceGateway(
                jacksonObjectMapper(), "INSTITUTION_ADAPTER",
                "http://127.0.0.1:${server.address.port}/meetings", "provider-token",
            )
            val result = gateway.provision(VideoConferenceProvisionCommand(
                sessionId = 7, title = "Jonli dars", startsAt = Instant.parse("2026-08-07T08:00:00Z"),
                endsAt = Instant.parse("2026-08-07T09:00:00Z"), idempotencyKey = "video-session-7-key",
            ))
            assertTrue(result.ready)
            assertEquals("provider-77", result.providerMeetingId)
            assertEquals("video-session-7-key", provisionKey.get())
            assertEquals("Bearer provider-token", authorization.get())
            assertTrue(provisionBody.get().contains("\"sessionId\":7"))
            assertTrue(provisionBody.get().contains("\"idempotencyKey\":\"video-session-7-key\""))

            val cancelled = gateway.cancel("provider-77", "video-session-7-key-cancel")
            assertTrue(cancelled.ready)
            assertEquals("/meetings/provider-77", cancelPath.get())
        } finally {
            server.stop(0)
        }
    }

    @Test
    fun `unconfigured adapter fails closed without synthetic meeting`() {
        val gateway = DefaultVideoConferenceGateway(ObjectMapper(), "UNCONFIGURED", "", "")
        val result = gateway.provision(VideoConferenceProvisionCommand(
            sessionId = 1, title = "Test", startsAt = Instant.now(), endsAt = Instant.now().plusSeconds(3600),
            idempotencyKey = "test-key",
        ))
        assertFalse(result.ready)
        assertEquals("PROVIDER_NOT_CONFIGURED", result.errorCode)
        assertEquals(null, result.joinUrl)
        assertEquals(null, result.hostUrl)
    }
}
