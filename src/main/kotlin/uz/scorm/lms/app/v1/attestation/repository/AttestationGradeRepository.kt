package uz.scorm.lms.app.v1.attestation.repository

import org.springframework.data.jpa.repository.EntityGraph
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import uz.scorm.lms.app.v1.attestation.model.AttestationGrade
import java.math.BigDecimal

interface AttestationGradeRepository : JpaRepository<AttestationGrade, Long> {
    @EntityGraph(attributePaths = ["studentDefense", "gradedBy"])
    fun findAllByStudentDefenseIdAndDeletedFalseOrderByGradingDateDesc(
        studentDefenseId: Long,
    ): List<AttestationGrade>

    @EntityGraph(attributePaths = ["studentDefense", "gradedBy"])
    fun findAllByGradedByIdAndDeletedFalseOrderByGradingDateDesc(
        gradedById: Long,
    ): List<AttestationGrade>

    @EntityGraph(attributePaths = ["studentDefense", "gradedBy"])
    fun findByStudentDefenseIdAndGradedByIdAndDeletedFalse(
        studentDefenseId: Long,
        gradedById: Long,
    ): AttestationGrade?

    @EntityGraph(attributePaths = ["studentDefense", "gradedBy"])
    fun findByIdAndDeletedFalse(id: Long): AttestationGrade?

    fun countByStudentDefenseIdAndDeletedFalse(studentDefenseId: Long): Long

    @Query(
        """
        SELECT AVG(ag.score) FROM AttestationGrade ag
        WHERE ag.studentDefense.id = :studentDefenseId AND ag.deleted = false
    """
    )
    fun getAverageScoreByStudentDefenseId(@Param("studentDefenseId") studentDefenseId: Long): BigDecimal?

    @Query(
        """
        SELECT ag FROM AttestationGrade ag
        WHERE ag.studentDefense.id = :studentDefenseId AND ag.deleted = false
        ORDER BY ag.score DESC
    """
    )
    fun findAllByStudentDefenseIdOrderByScoreDesc(
        @Param("studentDefenseId") studentDefenseId: Long,
    ): List<AttestationGrade>

    @Query(
        """
        SELECT COUNT(ag) FROM AttestationGrade ag
        WHERE ag.studentDefense.id IN (
            SELECT sd.id FROM StudentDefense sd
            WHERE sd.attestationSession.id = :attestationSessionId AND sd.deleted = false
        ) AND ag.deleted = false
    """
    )
    fun countGradesByAttestationSessionId(@Param("attestationSessionId") attestationSessionId: Long): Long
}