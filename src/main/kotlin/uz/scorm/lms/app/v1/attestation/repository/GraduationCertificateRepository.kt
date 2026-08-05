package uz.scorm.lms.app.v1.attestation.repository

import org.springframework.data.jpa.repository.EntityGraph
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import uz.scorm.lms.app.v1.attestation.model.GraduationCertificate
import java.time.LocalDate

interface GraduationCertificateRepository : JpaRepository<GraduationCertificate, Long> {
    @EntityGraph(attributePaths = ["studentDefense", "issuedBy"])
    fun findByCertificateNumberAndDeletedFalse(certificateNumber: String): GraduationCertificate?

    @EntityGraph(attributePaths = ["studentDefense", "issuedBy"])
    fun findByVerificationTokenAndDeletedFalse(token: String): GraduationCertificate?

    @EntityGraph(attributePaths = ["studentDefense", "issuedBy"])
    fun findByStudentDefenseIdAndDeletedFalse(studentDefenseId: Long): GraduationCertificate?

    @EntityGraph(attributePaths = ["studentDefense", "issuedBy"])
    fun findByIdAndDeletedFalse(id: Long): GraduationCertificate?

    @EntityGraph(attributePaths = ["studentDefense", "issuedBy"])
    fun findAllByIssuedByIdAndDeletedFalseOrderByIssueDateDesc(issuedById: Long): List<GraduationCertificate>

    @EntityGraph(attributePaths = ["studentDefense", "issuedBy"])
    fun findAllByIssueDateBetweenAndDeletedFalseOrderByIssueDateDesc(
        from: LocalDate,
        to: LocalDate,
    ): List<GraduationCertificate>

    @Query(
        """
        SELECT gc FROM GraduationCertificate gc
        WHERE gc.studentDefense.attestationSession.id = :attestationSessionId AND gc.deleted = false
        ORDER BY gc.issueDate DESC
    """
    )
    fun findAllByAttestationSessionId(@Param("attestationSessionId") attestationSessionId: Long): List<GraduationCertificate>

    fun countByIssueDateBetweenAndDeletedFalse(
        from: LocalDate,
        to: LocalDate,
    ): Long

    @Query(
        """
        SELECT COUNT(gc) FROM GraduationCertificate gc
        WHERE gc.studentDefense.attestationSession.id = :attestationSessionId AND gc.deleted = false
    """
    )
    fun countByAttestationSessionId(@Param("attestationSessionId") attestationSessionId: Long): Long

    @Query(
        """
        SELECT DISTINCT YEAR(gc.issueDate) FROM GraduationCertificate gc
        WHERE gc.deleted = false
        ORDER BY YEAR(gc.issueDate) DESC
    """
    )
    fun findDistinctYears(): List<Int>
}