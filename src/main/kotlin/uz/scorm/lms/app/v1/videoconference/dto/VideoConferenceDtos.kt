package uz.scorm.lms.app.v1.videoconference.dto

import uz.scorm.lms.app.v1.videoconference.model.VideoConferenceMeetingStatus
import java.time.Instant

data class VideoConferenceMeetingDto(
    val id: Long,
    val sessionId: Long,
    val providerCode: String,
    val status: VideoConferenceMeetingStatus,
    val providerMeetingId: String?,
    val joinUrl: String?,
    val hostUrl: String?,
    val failureCode: String?,
    val failureMessage: String?,
    val provisionAttempts: Int,
    val lastRequestedAt: Instant,
    val readyAt: Instant?,
    val cancelledAt: Instant?,
    val requestedByName: String,
    val cancelledByName: String?,
)
