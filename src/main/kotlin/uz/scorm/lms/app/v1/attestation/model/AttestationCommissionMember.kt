package uz.scorm.lms.app.v1.attestation.model

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
import uz.scorm.lms.app.v1.user.model.User
import java.time.Instant

@Entity
@Table(
    name = "attestation_commission_members",
    indexes = [
        Index(name = "idx_commission_member_session", columnList = "session_id,role"),
        Index(name = "idx_commission_member_user", columnList = "user_id"),
    ],
    uniqueConstraints = [
        UniqueConstraint(name = "uk_commission_member", columnNames = ["session_id", "user_id"]),
    ],
)
class AttestationCommissionMember(
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "session_id", nullable = false)
    var session: StateAttestationSession,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    var user: User,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    var role: CommissionRole = CommissionRole.MEMBER,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "appointed_by", nullable = false)
    var appointedBy: User,

    @Column(name = "appointed_at", nullable = false)
    var appointedAt: Instant,
) : BaseEntity()

enum class CommissionRole {
    CHAIR,      // Komissiya raisboshi
    MEMBER,     // Odatiy azosi
    SECRETARY,  // Katib (qaydlar uchun)
}