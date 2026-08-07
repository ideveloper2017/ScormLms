package uz.scorm.lms.app.v1.videoconference.service

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.audit.service.AuditService
import uz.scorm.lms.app.v1.courses.service.CourseAccessService
import uz.scorm.lms.app.v1.session.model.CourseLearningSession
import uz.scorm.lms.app.v1.session.model.LearningSessionFormat
import uz.scorm.lms.app.v1.session.model.LearningSessionStatus
import uz.scorm.lms.app.v1.session.repository.CourseLearningSessionRepository
import uz.scorm.lms.app.v1.user.repository.UserRepository
import uz.scorm.lms.app.v1.videoconference.dto.VideoConferenceMeetingDto
import uz.scorm.lms.app.v1.videoconference.model.VideoConferenceMeeting
import uz.scorm.lms.app.v1.videoconference.model.VideoConferenceMeetingStatus
import uz.scorm.lms.app.v1.videoconference.repository.VideoConferenceMeetingRepository
import java.net.URI
import java.time.Instant
import java.util.UUID

@Service
class VideoConferenceService(
    private val meetingRepository: VideoConferenceMeetingRepository,
    private val sessionRepository: CourseLearningSessionRepository,
    private val courseAccessService: CourseAccessService,
    private val userRepository: UserRepository,
    private val gateway: VideoConferenceGateway,
    private val auditService: AuditService,
) {
    @Transactional
    fun provision(sessionId: Long, actorId: Long, mayManageAll: Boolean): VideoConferenceMeetingDto {
        val session = managedSession(sessionId, actorId, mayManageAll)
        require(session.format == LearningSessionFormat.SYNCHRONOUS) { "Faqat sinxron mashg'ulot uchun meeting yaratiladi" }
        require(session.status == LearningSessionStatus.DRAFT) { "Provider meeting faqat DRAFT mashg'ulotga biriktiriladi" }
        require(session.endsAt.isAfter(Instant.now())) { "Tugagan mashg'ulot uchun meeting yaratilmaydi" }
        val actor = userRepository.findById(actorId).orElseThrow { NoSuchElementException("Foydalanuvchi topilmadi: $actorId") }
        val now = Instant.now()
        val meeting = meetingRepository.findBySessionIdAndDeletedFalse(sessionId)?.also {
            require(it.status in setOf(VideoConferenceMeetingStatus.FAILED, VideoConferenceMeetingStatus.PROVISIONING)) {
                if (it.status == VideoConferenceMeetingStatus.READY) "Mashg'ulot provider meetingiga allaqachon ega"
                else "Bekor qilingan meeting qayta ishlatilmaydi; yangi mashg'ulot yarating"
            }
            require(it.provisionAttempts < 20) { "Meeting provisioning urinishlari limiti tugagan" }
            it.providerCode = providerCode()
            it.status = VideoConferenceMeetingStatus.PROVISIONING
            it.failureCode = null
            it.failureMessage = null
            it.lastRequestedAt = now
            it.requestedByUser = actor
        } ?: VideoConferenceMeeting(
            session = session,
            providerCode = providerCode(),
            idempotencyKey = "video-session-$sessionId-${UUID.randomUUID()}",
            lastRequestedAt = now,
            requestedByUser = actor,
        )
        meeting.provisionAttempts += 1
        meetingRepository.saveAndFlush(meeting)
        val result = runCatching {
            gateway.provision(VideoConferenceProvisionCommand(
                sessionId = sessionId,
                title = session.title,
                startsAt = session.startsAt,
                endsAt = session.endsAt,
                idempotencyKey = meeting.idempotencyKey,
            ))
        }.getOrElse { VideoConferenceGatewayResult(false, errorCode = "PROVIDER_UNAVAILABLE", errorMessage = it.message ?: "Provider xatosi") }
        applyResult(meeting, result, now)
        meetingRepository.save(meeting)
        auditService.logAction(
            "VIDEO_CONFERENCE_PROVISIONED",
            actorId,
            "meeting=${meeting.id}; session=$sessionId; provider=${meeting.providerCode}; status=${meeting.status}; attempt=${meeting.provisionAttempts}; error=${meeting.failureCode ?: "none"}",
        )
        return dto(meeting)
    }

    @Transactional
    fun cancel(sessionId: Long, actorId: Long, mayManageAll: Boolean): VideoConferenceMeetingDto {
        val session = managedSession(sessionId, actorId, mayManageAll)
        require(session.status == LearningSessionStatus.DRAFT) { "PUBLISHED mashg'ulot meetingini alohida bekor qilmang; mashg'ulotni bekor qiling" }
        val meeting = requireMeeting(sessionId)
        when (meeting.status) {
            VideoConferenceMeetingStatus.READY -> cancelReady(meeting, actorId)
            VideoConferenceMeetingStatus.FAILED, VideoConferenceMeetingStatus.PROVISIONING -> markCancelled(meeting, actorId)
            VideoConferenceMeetingStatus.CANCELLED -> throw IllegalArgumentException("Meeting allaqachon bekor qilingan")
        }
        return dto(meeting)
    }

    @Transactional
    fun cancelIfReady(session: CourseLearningSession, actorId: Long) {
        val meeting = meetingRepository.findBySessionIdAndDeletedFalse(requireNotNull(session.id)) ?: return
        if (meeting.status == VideoConferenceMeetingStatus.READY) cancelReady(meeting, actorId)
        else if (meeting.status in setOf(VideoConferenceMeetingStatus.FAILED, VideoConferenceMeetingStatus.PROVISIONING)) {
            markCancelled(meeting, actorId)
        }
    }

    @Transactional(readOnly = true)
    fun get(sessionId: Long, actorId: Long, mayManageAll: Boolean): VideoConferenceMeetingDto {
        managedSession(sessionId, actorId, mayManageAll)
        return dto(requireMeeting(sessionId))
    }

    @Transactional(readOnly = true)
    fun meetingForSession(sessionId: Long): VideoConferenceMeetingDto? =
        meetingRepository.findBySessionIdAndDeletedFalse(sessionId)?.let(::dto)

    @Transactional(readOnly = true)
    fun readyJoinUrl(sessionId: Long): String? = meetingRepository.findBySessionIdAndDeletedFalse(sessionId)
        ?.takeIf { it.status == VideoConferenceMeetingStatus.READY }
        ?.joinUrl

    private fun cancelReady(meeting: VideoConferenceMeeting, actorId: Long) {
        require(meeting.status == VideoConferenceMeetingStatus.READY) { "Faqat READY meeting bekor qilinadi" }
        val providerMeetingId = requireNotNull(meeting.providerMeetingId)
        val result = runCatching { gateway.cancel(providerMeetingId, "${meeting.idempotencyKey}-cancel") }
            .getOrElse { VideoConferenceGatewayResult(false, errorCode = "PROVIDER_UNAVAILABLE", errorMessage = it.message ?: "Provider xatosi") }
        require(result.ready) { "Provider meetingni bekor qilmadi: ${result.errorCode ?: "UNKNOWN"}" }
        markCancelled(meeting, actorId)
    }

    private fun markCancelled(meeting: VideoConferenceMeeting, actorId: Long) {
        meeting.status = VideoConferenceMeetingStatus.CANCELLED
        meeting.cancelledAt = Instant.now()
        meeting.cancelledByUser = userRepository.findById(actorId).orElseThrow { NoSuchElementException("Foydalanuvchi topilmadi: $actorId") }
        meetingRepository.save(meeting)
        auditService.logAction("VIDEO_CONFERENCE_CANCELLED", actorId, "meeting=${meeting.id}; session=${meeting.session.id}; provider=${meeting.providerCode}")
    }

    private fun applyResult(meeting: VideoConferenceMeeting, result: VideoConferenceGatewayResult, now: Instant) {
        if (result.ready) {
            val providerMeetingId = result.providerMeetingId?.trim().orEmpty()
            val joinUrl = result.joinUrl?.trim().orEmpty()
            val hostUrl = result.hostUrl?.trim().orEmpty()
            require(providerMeetingId.length in 1..250 && safeUrl(joinUrl) && safeUrl(hostUrl)) { "Provider yaroqsiz meeting javobi qaytardi" }
            meeting.status = VideoConferenceMeetingStatus.READY
            meeting.providerMeetingId = providerMeetingId
            meeting.joinUrl = joinUrl
            meeting.hostUrl = hostUrl
            meeting.readyAt = now
            meeting.failureCode = null
            meeting.failureMessage = null
        } else {
            meeting.status = VideoConferenceMeetingStatus.FAILED
            meeting.failureCode = result.errorCode?.trim()?.take(100)?.takeIf(String::isNotBlank) ?: "PROVIDER_ERROR"
            meeting.failureMessage = sanitize(result.errorMessage)
            meeting.providerMeetingId = null
            meeting.joinUrl = null
            meeting.hostUrl = null
            meeting.readyAt = null
        }
    }

    private fun managedSession(sessionId: Long, actorId: Long, mayManageAll: Boolean): CourseLearningSession {
        val session = sessionRepository.findByIdAndDeletedFalse(sessionId) ?: throw NoSuchElementException("Mashg'ulot topilmadi: $sessionId")
        courseAccessService.requireManage(requireNotNull(session.course.id), actorId, mayManageAll)
        return session
    }

    private fun requireMeeting(sessionId: Long) = meetingRepository.findBySessionIdAndDeletedFalse(sessionId)
        ?: throw NoSuchElementException("Provider meeting topilmadi: session=$sessionId")

    private fun providerCode() = gateway.providerCode.trim().uppercase().also {
        require(it.length in 2..100 && it.matches(Regex("[A-Z0-9][A-Z0-9_-]*"))) { "Provider kodi noto'g'ri" }
    }

    private fun safeUrl(value: String): Boolean = runCatching { URI(value) }.getOrNull()?.let {
        it.scheme?.lowercase() in setOf("http", "https") && !it.host.isNullOrBlank() && it.userInfo == null && value.length <= 1000
    } == true

    private fun sanitize(value: String?): String = value.orEmpty()
        .replace(Regex("(?i)(bearer|token|secret|password)\\s*[:=]?\\s*[^\\s,;]+"), "$1=[REDACTED]")
        .trim().take(1000).takeIf(String::isNotBlank) ?: "Provider meeting yaratilmadi"

    private fun dto(meeting: VideoConferenceMeeting) = VideoConferenceMeetingDto(
        id = requireNotNull(meeting.id), sessionId = requireNotNull(meeting.session.id), providerCode = meeting.providerCode,
        status = meeting.status, providerMeetingId = meeting.providerMeetingId, joinUrl = meeting.joinUrl,
        hostUrl = meeting.hostUrl, failureCode = meeting.failureCode, failureMessage = meeting.failureMessage,
        provisionAttempts = meeting.provisionAttempts, lastRequestedAt = meeting.lastRequestedAt,
        readyAt = meeting.readyAt, cancelledAt = meeting.cancelledAt,
        requestedByName = meeting.requestedByUser.fullName ?: meeting.requestedByUser.username,
        cancelledByName = meeting.cancelledByUser?.fullName ?: meeting.cancelledByUser?.username,
    )
}
