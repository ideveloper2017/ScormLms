package uz.scorm.lms.app.v1.attestation.repository

import org.springframework.data.jpa.repository.EntityGraph
import org.springframework.data.jpa.repository.JpaRepository
import uz.scorm.lms.app.v1.attestation.model.DefenseDecision
import uz.scorm.lms.app.v1.attestation.model.DefenseStatus
import uz.scorm.lms.app.v1.attestation.model.StudentDefense

interface StudentDefenseRepository : JpaRepository<StudentDefense, Long> {
    @EntityGraph(attributePaths = ["attestationSession", "enrollment"])
    fun findAllByAttestationSessionIdAndDeletedFalseOrderByDefenseDateAsc(
        attestationSessionId: Long,
    ): List<StudentDefense>

    @EntityGraph(attributePaths = ["attestationSession", "enrollment"])
    fun findAllByEnrollmentIdAndDeletedFalseOrderByAttestationSessionIdDesc(
        enrollmentId: Long,
    ): List<StudentDefense>

    @EntityGraph(attributePaths = ["attestationSession", "enrollment"])
    fun findAllByAttestationSessionIdAndDefenseStatusAndDeletedFalse(
        attestationSessionId: Long,
        status: DefenseStatus,
    ): List<StudentDefense>

    @EntityGraph(attributePaths = ["attestationSession", "enrollment"])
    fun findAllByAttestationSessionIdAndCommissionDecisionAndDeletedFalse(
        attestationSessionId: Long,
        decision: DefenseDecision,
    ): List<StudentDefense>

    @EntityGraph(attributePaths = ["attestationSession", "enrollment"])
    fun findByAttestationSessionIdAndEnrollmentIdAndDeletedFalse(
        attestationSessionId: Long,
        enrollmentId: Long,
    ): StudentDefense?

    @EntityGraph(attributePaths = ["attestationSession", "enrollment"])
    fun findByIdAndDeletedFalse(id: Long): StudentDefense?

    fun countByAttestationSessionIdAndDefenseStatusAndDeletedFalse(
        attestationSessionId: Long,
        status: DefenseStatus,
    ): Long

    fun countByAttestationSessionIdAndCommissionDecisionAndDeletedFalse(
        attestationSessionId: Long,
        decision: DefenseDecision,
    ): Long

    @EntityGraph(attributePaths = ["attestationSession", "enrollment"])
    fun findAllByAttestationSessionIdAndCommissionDecisionNotAndDeletedFalse(
        attestationSessionId: Long,
        decision: DefenseDecision,
    ): List<StudentDefense>
}