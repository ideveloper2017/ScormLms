package uz.scorm.lms.app.v1.attestation.repository

import org.springframework.data.jpa.repository.EntityGraph
import org.springframework.data.jpa.repository.JpaRepository
import uz.scorm.lms.app.v1.attestation.model.AttestationCommissionMember
import uz.scorm.lms.app.v1.attestation.model.CommissionRole

interface CommissionMemberRepository : JpaRepository<AttestationCommissionMember, Long> {
    @EntityGraph(attributePaths = ["session", "user", "appointedBy"])
    fun findAllBySessionIdAndDeletedFalseOrderByRoleAsc(sessionId: Long): List<AttestationCommissionMember>

    @EntityGraph(attributePaths = ["session", "user", "appointedBy"])
    fun findAllByUserIdAndDeletedFalseOrderBySessionIdDesc(userId: Long): List<AttestationCommissionMember>

    @EntityGraph(attributePaths = ["session", "user", "appointedBy"])
    fun findAllBySessionIdAndRoleAndDeletedFalse(
        sessionId: Long,
        role: CommissionRole,
    ): List<AttestationCommissionMember>

    @EntityGraph(attributePaths = ["session", "user", "appointedBy"])
    fun findBySessionIdAndUserIdAndDeletedFalse(
        sessionId: Long,
        userId: Long,
    ): AttestationCommissionMember?

    @EntityGraph(attributePaths = ["session", "user", "appointedBy"])
    fun findByIdAndDeletedFalse(id: Long): AttestationCommissionMember?

    fun countBySessionIdAndDeletedFalse(sessionId: Long): Long

    fun countBySessionIdAndRoleAndDeletedFalse(
        sessionId: Long,
        role: CommissionRole,
    ): Long

    @EntityGraph(attributePaths = ["session", "user", "appointedBy"])
    fun findAllBySessionIdAndRoleNotAndDeletedFalse(
        sessionId: Long,
        role: CommissionRole,
    ): List<AttestationCommissionMember>
}