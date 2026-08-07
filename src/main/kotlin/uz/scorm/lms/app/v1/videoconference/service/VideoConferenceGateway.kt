package uz.scorm.lms.app.v1.videoconference.service

import com.fasterxml.jackson.databind.ObjectMapper
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component
import java.net.URI
import java.net.http.HttpClient
import java.net.http.HttpRequest
import java.net.http.HttpResponse
import java.time.Duration
import java.time.Instant

data class VideoConferenceProvisionCommand(
    val sessionId: Long,
    val title: String,
    val startsAt: Instant,
    val endsAt: Instant,
    val idempotencyKey: String,
)

data class VideoConferenceGatewayResult(
    val ready: Boolean,
    val providerMeetingId: String? = null,
    val joinUrl: String? = null,
    val hostUrl: String? = null,
    val errorCode: String? = null,
    val errorMessage: String? = null,
)

interface VideoConferenceGateway {
    val providerCode: String
    fun provision(command: VideoConferenceProvisionCommand): VideoConferenceGatewayResult
    fun cancel(providerMeetingId: String, idempotencyKey: String): VideoConferenceGatewayResult
}

@Component
class DefaultVideoConferenceGateway(
    private val objectMapper: ObjectMapper,
    @param:Value("\${app.video-conference.provider-code:UNCONFIGURED}") override val providerCode: String,
    @param:Value("\${app.video-conference.provision-url:}") private val provisionUrl: String,
    @param:Value("\${app.video-conference.token:}") private val token: String,
) : VideoConferenceGateway {
    private val client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build()

    override fun provision(command: VideoConferenceProvisionCommand): VideoConferenceGatewayResult {
        if (provisionUrl.isBlank() || token.isBlank() || providerCode == "UNCONFIGURED") {
            return failure("PROVIDER_NOT_CONFIGURED", "Videokonferensiya provayderi URL, token va kodi sozlanmagan")
        }
        val payload = objectMapper.writeValueAsString(mapOf(
            "sessionId" to command.sessionId,
            "title" to command.title,
            "startsAt" to command.startsAt.toString(),
            "endsAt" to command.endsAt.toString(),
            "idempotencyKey" to command.idempotencyKey,
        ))
        return exchange(
            HttpRequest.newBuilder(URI.create(provisionUrl.trim())).timeout(Duration.ofSeconds(15))
                .header("Authorization", "Bearer $token")
                .header("Content-Type", "application/json")
                .header("Idempotency-Key", command.idempotencyKey)
                .POST(HttpRequest.BodyPublishers.ofString(payload)).build(),
        ) { responseBody ->
            val node = objectMapper.readTree(responseBody)
            val meetingId = node.path("meetingId").asText("").trim()
            val joinUrl = node.path("joinUrl").asText("").trim()
            val hostUrl = node.path("hostUrl").asText("").trim()
            if (meetingId.isBlank() || !safeUrl(joinUrl) || !safeUrl(hostUrl)) {
                failure("INVALID_PROVIDER_RESPONSE", "Provider meetingId, joinUrl yoki hostUrl qaytarmadi")
            } else VideoConferenceGatewayResult(true, meetingId, joinUrl, hostUrl)
        }
    }

    override fun cancel(providerMeetingId: String, idempotencyKey: String): VideoConferenceGatewayResult {
        if (provisionUrl.isBlank() || token.isBlank() || providerCode == "UNCONFIGURED") {
            return failure("PROVIDER_NOT_CONFIGURED", "Videokonferensiya provayderi sozlanmagan")
        }
        val target = "${provisionUrl.trim().trimEnd('/')}/${java.net.URLEncoder.encode(providerMeetingId, Charsets.UTF_8)}"
        return exchange(
            HttpRequest.newBuilder(URI.create(target)).timeout(Duration.ofSeconds(15))
                .header("Authorization", "Bearer $token")
                .header("Idempotency-Key", idempotencyKey)
                .DELETE().build(),
        ) { VideoConferenceGatewayResult(true, providerMeetingId = providerMeetingId) }
    }

    private fun exchange(request: HttpRequest, success: (String) -> VideoConferenceGatewayResult): VideoConferenceGatewayResult = try {
        val response = client.send(request, HttpResponse.BodyHandlers.ofString())
        if (response.statusCode() in 200..299) success(response.body())
        else failure("PROVIDER_HTTP_${response.statusCode()}", "Provider HTTP ${response.statusCode()} bilan rad etdi")
    } catch (exception: Exception) {
        failure("PROVIDER_UNAVAILABLE", exception.message?.take(500) ?: "Provider bilan aloqa xatosi")
    }

    private fun safeUrl(value: String): Boolean = runCatching { URI(value) }.getOrNull()?.let {
        it.scheme?.lowercase() in setOf("http", "https") && !it.host.isNullOrBlank() && it.userInfo == null
    } == true

    private fun failure(code: String, message: String) = VideoConferenceGatewayResult(false, errorCode = code, errorMessage = message)
}
