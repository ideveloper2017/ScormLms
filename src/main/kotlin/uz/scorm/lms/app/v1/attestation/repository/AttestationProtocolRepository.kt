package uz.scorm.lms.app.v1.attestation.repository

import org.springframework.data.jpa.repository.EntityGraph
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import uz.scorm.lms.app.v1.attestation.model.AttestationProtocol
import java.time.LocalDate

interface AttestationProtocolRepository : JpaRepository<AttestationProtocol, Long> {
    @EntityGraph(attributePaths = ["attestationSession", "approver"])
    fun findByProtocolNumberAndDeletedFalse(protocolNumber: String): AttestationProtocol?

    @EntityGraph(attributePaths = ["attestationSession", "approver"])
    fun findByAttestationSessionIdAndDeletedFalse(attestationSessionId: Long): AttestationProtocol?

    @EntityGraph(attributePaths = ["attestationSession", "approver"])
    fun findByIdAndDeletedFalse(id: Long): AttestationProtocol?

    @EntityGraph(attributePaths = ["attestationSession", "approver"])
    fun findAllByApproverIdAndDeletedFalseOrderByProtocolDateDesc(approverId: Long): List<AttestationProtocol>

    @EntityGraph(attributePaths = ["attestationSession", "approver"])
    fun findAllByProtocolDateBetweenAndDeletedFalseOrderByProtocolDateDesc(
        from: LocalDate,
        to: LocalDate,
    ): List<AttestationProtocol>

    @EntityGraph(attributePaths = ["attestationSession", "approver"])
    fun findAllByApproverIdIsNullAndDeletedFalseOrderByProtocolDateDesc(): List<AttestationProtocol>

    fun countByApproverIdIsNullAndDeletedFalse(): Long

    @Query(
        """
        SELECT ap FROM AttestationProtocol ap
        WHERE ap.attestationSession.course.id = :courseId AND ap.deleted = false
        ORDER BY ap.protocolDate DESC
    """
    )
    fun findAllByCourseId(@Param("courseId") courseId: Long): List<AttestationProtocol>

    @Query(
        """
        SELECT SUM(ap.passedCount) FROM AttestationProtocol ap
        WHERE ap.attestationSession.course.id = :courseId
        AND ap.approver IS NOT NULL AND ap.deleted = false
    """
    )
    fun sumPassedCountByCourseId(@Param("courseId") courseId: Long): Long?

    @Query(
        """
        SELECT SUM(ap.failedCount) FROM AttestationProtocol ap
        WHERE ap.attestationSession.course.id = :courseId
        AND ap.approver IS NOT NULL AND ap.deleted = false
    """
    )
    fun sumFailedCountByCourseId(@Param("courseId") courseId: Long): Long?

    @Query(
        """
        SELECT SUM(ap.totalStudents) FROM AttestationProtocol ap
        WHERE ap.attestationSession.course.id = :courseId
        AND ap.approver IS NOT NULL AND ap.deleted = false
    """
    )
    fun sumTotalStudentsByCourseId(@Param("courseId") courseId: Long): Long?

    fun countByProtocolDateBetweenAndDeletedFalse(
        from: LocalDate,
        to: LocalDate,
    ): Long

    @Query(
        """
        SELECT COUNT(ap) FROM AttestationProtocol ap
        WHERE ap.attestationSession.id IN (
            SELECT ast.id FROM StateAttestationSession ast
            WHERE ast.course.id = :courseId AND ast.deleted = false
        ) AND ap.deleted = false
    """
    )
    fun countProtocolsByCourseId(@Param("courseId") courseId: Long): Long
}