package uz.scorm.lms.app.v1.attestation.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.Index
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import uz.scorm.lms.app.common.BaseEntity
import uz.scorm.lms.app.v1.user.model.User
import java.time.Instant
import java.time.LocalDate

@Entity
@Table(
    name = "attestation_protocols",
    indexes = [
        Index(name = "idx_attestation_protocol_number", columnList = "protocol_number"),
        Index(name = "idx_attestation_protocol_date", columnList = "protocol_date"),
        Index(name = "idx_attestation_protocol_approver", columnList = "approver_id,approved_at"),
    ],
)
class AttestationProtocol(
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "attestation_session_id", nullable = false, unique = true)
    var attestationSession: StateAttestationSession,

    @Column(name = "protocol_number", nullable = false, unique = true, length = 50)
    var protocolNumber: String,

    @Column(name = "protocol_date", nullable = false)
    var protocolDate: LocalDate,

    @Column(name = "total_students", nullable = false)
    var totalStudents: Int = 0,

    @Column(name = "passed_count", nullable = false)
    var passedCount: Int = 0,

    @Column(name = "failed_count", nullable = false)
    var failedCount: Int = 0,

    @Column(name = "retake_count", nullable = false)
    var retakeCount: Int = 0,

    @Column(name = "protocol_file_url", length = 500)
    var protocolFileUrl: String? = null,

    @Column(name = "protocol_file_name", length = 255)
    var protocolFileName: String? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approver_id")
    var approver: User? = null,

    @Column(name = "approved_at")
    var approvedAt: Instant? = null,
) : BaseEntity()