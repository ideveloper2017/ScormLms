package uz.scorm.lms.app.v1.announcement.service

import tools.jackson.databind.ObjectMapper
import mu.KotlinLogging
import org.springframework.beans.factory.annotation.Value
import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.stereotype.Component
import uz.scorm.lms.app.v1.announcement.model.Announcement
import uz.scorm.lms.app.v1.announcement.model.AnnouncementChannel
import uz.scorm.lms.app.v1.user.model.User
import java.net.URI
import java.net.http.HttpClient
import java.net.http.HttpRequest
import java.net.http.HttpResponse
import java.time.Duration

data class AnnouncementDispatchResult(
    val delivered: Boolean,
    val skipped: Boolean = false,
    val destinationMasked: String? = null,
    val providerReference: String? = null,
    val error: String? = null,
)

interface AnnouncementDeliveryGateway {
    fun dispatch(channel: AnnouncementChannel, deliveryId: Long, announcement: Announcement, recipient: User): AnnouncementDispatchResult
}

@Component
class DefaultAnnouncementDeliveryGateway(
    private val messagingTemplate: SimpMessagingTemplate,
    private val objectMapper: ObjectMapper,
    @param:Value("\${app.announcement.email-webhook-url:}") private val emailWebhookUrl: String,
    @param:Value("\${app.announcement.email-webhook-token:}") private val emailWebhookToken: String,
    @param:Value("\${app.announcement.push-webhook-url:}") private val pushWebhookUrl: String,
    @param:Value("\${app.announcement.push-webhook-token:}") private val pushWebhookToken: String,
) : AnnouncementDeliveryGateway {
    private val log = KotlinLogging.logger {}
    // Some Windows/JDK combinations cannot initialize the NIO selector during
    // application startup.  Webhook delivery is optional, so create the client
    // only when an EMAIL/PUSH provider is actually configured and invoked.
    private val httpClient: HttpClient by lazy(LazyThreadSafetyMode.SYNCHRONIZED) {
        HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build()
    }

    override fun dispatch(
        channel: AnnouncementChannel,
        deliveryId: Long,
        announcement: Announcement,
        recipient: User,
    ): AnnouncementDispatchResult = when (channel) {
        AnnouncementChannel.IN_APP -> inApp(deliveryId, announcement, recipient)
        AnnouncementChannel.EMAIL -> webhook(
            emailWebhookUrl,
            emailWebhookToken,
            recipient.email,
            recipient.email?.let(::maskEmail),
            channel,
            deliveryId,
            announcement,
        )
        AnnouncementChannel.PUSH -> webhook(
            pushWebhookUrl,
            pushWebhookToken,
            recipient.id?.toString(),
            recipient.id?.let { "user:$it" },
            channel,
            deliveryId,
            announcement,
        )
    }

    private fun inApp(deliveryId: Long, announcement: Announcement, recipient: User): AnnouncementDispatchResult {
        try {
            messagingTemplate.convertAndSendToUser(recipient.username, "/queue/announcements", mapOf(
                "deliveryId" to deliveryId,
                "announcementId" to announcement.id,
                "title" to announcement.title,
                "message" to announcement.body,
                "priority" to announcement.priority.name.lowercase(),
                "actionUrl" to announcement.actionUrl,
            ))
        } catch (e: Exception) {
            // Persisted inbox is the authoritative delivery; WebSocket is only a best-effort accelerator.
            log.warn { "Announcement WebSocket push failed for ${recipient.username}: ${e.message}" }
        }
        return AnnouncementDispatchResult(true, destinationMasked = recipient.username, providerReference = "persisted-inbox")
    }

    private fun webhook(
        endpoint: String,
        token: String,
        destination: String?,
        maskedDestination: String?,
        channel: AnnouncementChannel,
        deliveryId: Long,
        announcement: Announcement,
    ): AnnouncementDispatchResult {
        if (destination.isNullOrBlank()) {
            return AnnouncementDispatchResult(false, skipped = true, error = "RECIPIENT_DESTINATION_MISSING")
        }
        if (endpoint.isBlank()) {
            return AnnouncementDispatchResult(false, destinationMasked = maskedDestination, error = "PROVIDER_NOT_CONFIGURED")
        }
        val uri = runCatching { URI.create(endpoint) }.getOrNull()
            ?: return AnnouncementDispatchResult(false, destinationMasked = maskedDestination, error = "PROVIDER_URL_INVALID")
        if (uri.scheme !in setOf("http", "https")) {
            return AnnouncementDispatchResult(false, destinationMasked = maskedDestination, error = "PROVIDER_URL_INVALID")
        }
        return try {
            val json = objectMapper.writeValueAsString(mapOf(
                "idempotencyKey" to "announcement-delivery-$deliveryId",
                "channel" to channel.name,
                "destination" to destination,
                "title" to announcement.title,
                "body" to announcement.body,
                "actionUrl" to announcement.actionUrl,
                "priority" to announcement.priority.name,
            ))
            val builder = HttpRequest.newBuilder(uri)
                .timeout(Duration.ofSeconds(10))
                .header("Content-Type", "application/json")
                .header("Idempotency-Key", "announcement-delivery-$deliveryId")
                .POST(HttpRequest.BodyPublishers.ofString(json))
            if (token.isNotBlank()) builder.header("Authorization", "Bearer $token")
            val response = httpClient.send(builder.build(), HttpResponse.BodyHandlers.discarding())
            if (response.statusCode() in 200..299) {
                AnnouncementDispatchResult(
                    delivered = true,
                    destinationMasked = maskedDestination,
                    providerReference = response.headers().firstValue("X-Request-Id").orElse("http-${response.statusCode()}"),
                )
            } else AnnouncementDispatchResult(false, destinationMasked = maskedDestination, error = "PROVIDER_HTTP_${response.statusCode()}")
        } catch (e: Exception) {
            AnnouncementDispatchResult(false, destinationMasked = maskedDestination, error = "PROVIDER_ERROR:${e.javaClass.simpleName}")
        }
    }

    private fun maskEmail(email: String): String =
        email.substringBefore('@').take(2) + "***@" + email.substringAfter('@', "unknown")
}
