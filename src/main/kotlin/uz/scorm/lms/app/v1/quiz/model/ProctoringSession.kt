package uz.scorm.lms.app.v1.quiz.model

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
import uz.scorm.lms.app.v1.biometric.model.BiometricConsentEvent
import uz.scorm.lms.app.v1.biometric.model.BiometricPolicy
import uz.scorm.lms.app.v1.courses.model.CourseEnrollment
import java.time.Instant

@Entity
@Table(
    name = "proctoring_sessions",
    indexes = [
        Index(name = "idx_proctoring_owner", columnList = "quiz_id,enrollment_id,status"),
        Index(name = "idx_proctoring_expiry", columnList = "expires_at,status"),
    ],
)
class ProctoringSession(
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "quiz_id", nullable = false)
    var quiz: CourseQuiz,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "enrollment_id", nullable = false)
    var enrollment: CourseEnrollment,

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "attempt_id", unique = true)
    var attempt: QuizAttempt? = null,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24)
    var status: ProctoringSessionStatus = ProctoringSessionStatus.CHALLENGE_ISSUED,

    @Enumerated(EnumType.STRING)
    @Column(name = "challenge_direction", nullable = false, length = 10)
    var challengeDirection: ProctoringChallengeDirection,

    @Column(name = "nonce_hash", nullable = false, length = 64)
    var nonceHash: String,

    @Column(name = "expires_at", nullable = false)
    var expiresAt: Instant,

    @Column(name = "verified_at")
    var verifiedAt: Instant? = null,

    @Column(name = "consumed_at")
    var consumedAt: Instant? = null,

    @Column(name = "center_frame_hash", length = 64)
    var centerFrameHash: String? = null,

    @Column(name = "challenge_frame_hash", length = 64)
    var challengeFrameHash: String? = null,

    @Column(name = "identity_similarity")
    var identitySimilarity: Double? = null,

    @Column(name = "movement_delta")
    var movementDelta: Double? = null,

    @Column(name = "failure_reason", length = 500)
    var failureReason: String? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "biometric_policy_id")
    var biometricPolicy: BiometricPolicy? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "biometric_consent_event_id")
    var biometricConsentEvent: BiometricConsentEvent? = null,

    @Column(name = "biometric_retention_until")
    var biometricRetentionUntil: Instant? = null,

    @Column(name = "biometric_purged_at")
    var biometricPurgedAt: Instant? = null,
) : BaseEntity()

enum class ProctoringSessionStatus { CHALLENGE_ISSUED, VERIFIED, FAILED, EXPIRED, CONSUMED, COMPLETED }

enum class ProctoringChallengeDirection { LEFT, RIGHT }
