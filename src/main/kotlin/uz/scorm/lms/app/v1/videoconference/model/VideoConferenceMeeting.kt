package uz.scorm.lms.app.v1.videoconference.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.FetchType
import jakarta.persistence.Index
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.OneToOne
import jakarta.persistence.Table
import uz.scorm.lms.app.common.BaseEntity
import uz.scorm.lms.app.v1.session.model.CourseLearningSession
import uz.scorm.lms.app.v1.user.model.User
import java.time.Instant

enum class VideoConferenceMeetingStatus { PROVISIONING, READY, FAILED, CANCELLED }

@Entity
@Table(
    name = "video_conference_meetings",
    indexes = [
        Index(name = "idx_video_conference_status_requested", columnList = "status,last_requested_at"),
        Index(name = "idx_video_conference_provider_meeting", columnList = "provider_code,provider_meeting_id"),
    ],
)
class VideoConferenceMeeting(
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "session_id", nullable = false, unique = true)
    var session: CourseLearningSession,

    @Column(name = "provider_code", nullable = false, length = 100)
    var providerCode: String,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    var status: VideoConferenceMeetingStatus = VideoConferenceMeetingStatus.PROVISIONING,

    @Column(name = "idempotency_key", nullable = false, unique = true, length = 100)
    var idempotencyKey: String,

    @Column(name = "provider_meeting_id", length = 250)
    var providerMeetingId: String? = null,

    @Column(name = "join_url", length = 1000)
    var joinUrl: String? = null,

    @Column(name = "host_url", length = 1000)
    var hostUrl: String? = null,

    @Column(name = "failure_code", length = 100)
    var failureCode: String? = null,

    @Column(name = "failure_message", length = 1000)
    var failureMessage: String? = null,

    @Column(name = "provision_attempts", nullable = false)
    var provisionAttempts: Int = 0,

    @Column(name = "last_requested_at", nullable = false)
    var lastRequestedAt: Instant,

    @Column(name = "ready_at")
    var readyAt: Instant? = null,

    @Column(name = "cancelled_at")
    var cancelledAt: Instant? = null,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "requested_by_user_id", nullable = false)
    var requestedByUser: User,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cancelled_by_user_id")
    var cancelledByUser: User? = null,
) : BaseEntity()
