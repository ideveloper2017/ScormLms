package uz.scorm.lms.app.v1.scorm.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.FetchType
import jakarta.persistence.Index
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import jakarta.persistence.UniqueConstraint
import uz.scorm.lms.app.common.BaseEntity
import java.time.Instant

enum class ScormAttemptStatus { NOT_STARTED, IN_PROGRESS, COMPLETED, PASSED, FAILED }

@Entity
@Table(
    name = "scorm_attempts",
    indexes = [
        Index(name = "idx_scorm_attempt_user", columnList = "user_id"),
        Index(name = "idx_scorm_attempt_package", columnList = "package_id"),
        Index(name = "idx_scorm_launch_token", columnList = "launch_token_hash"),
    ],
    uniqueConstraints = [UniqueConstraint(
        name = "uk_scorm_attempt_package_user",
        columnNames = ["package_id", "user_id"],
    )],
)
class ScormAttempt(
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "package_id", nullable = false)
    var scormPackage: ScormPackage,

    @Column(name = "user_id", nullable = false)
    var userId: Long,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    var status: ScormAttemptStatus = ScormAttemptStatus.NOT_STARTED,

    @Column(name = "score_raw")
    var scoreRaw: Double? = null,

    @Column(name = "progress_measure")
    var progressMeasure: Double? = null,

    @Column(name = "total_time_seconds", nullable = false)
    var totalTimeSeconds: Long = 0,

    @Column(name = "runtime_data", nullable = false, columnDefinition = "TEXT")
    var runtimeData: String = "{}",

    @Column(name = "launch_token_hash", unique = true, length = 64)
    var launchTokenHash: String? = null,

    @Column(name = "launch_expires_at")
    var launchExpiresAt: Instant? = null,

    @Column(name = "started_at")
    var startedAt: Instant? = null,

    @Column(name = "completed_at")
    var completedAt: Instant? = null,

    @Column(name = "last_accessed_at")
    var lastAccessedAt: Instant? = null,
) : BaseEntity()
