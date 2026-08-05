package uz.scorm.lms.app.v1.attestation.repository

import org.springframework.data.jpa.repository.EntityGraph
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import uz.scorm.lms.app.v1.attestation.model.AttestationSessionStatus
import uz.scorm.lms.app.v1.attestation.model.StateAttestationSession
import java.time.LocalDate

interface AttestationSessionRepository : JpaRepository<StateAttestationSession, Long> {
    @EntityGraph(attributePaths = ["course", "commissionChair"])
    fun findAllByCourseIdAndDeletedFalseOrderByExamDateDesc(courseId: Long): List<StateAttestationSession>

    @EntityGraph(attributePaths = ["course", "commissionChair"])
    fun findAllByCommissionChairIdAndDeletedFalseOrderByExamDateDesc(commissionChairId: Long): List<StateAttestationSession>

    @EntityGraph(attributePaths = ["course", "commissionChair"])
    fun findAllByStatusAndDeletedFalseOrderByExamDateAsc(
        status: AttestationSessionStatus,
    ): List<StateAttestationSession>

    @EntityGraph(attributePaths = ["course", "commissionChair"])
    fun findAllByExamDateBetweenAndDeletedFalseOrderByExamDateAsc(
        from: LocalDate,
        to: LocalDate,
    ): List<StateAttestationSession>

    @EntityGraph(attributePaths = ["course", "commissionChair"])
    fun findByIdAndDeletedFalse(id: Long): StateAttestationSession?

    @Query(
        """
        SELECT ast FROM StateAttestationSession ast
        WHERE ast.course.id = :courseId AND ast.deleted = false
        AND ast.examDate = :examDate
        AND ast.location = :location
    """
    )
    fun findByCourseIdAndDateAndLocation(
        @Param("courseId") courseId: Long,
        @Param("examDate") examDate: LocalDate,
        @Param("location") location: String,
    ): StateAttestationSession?

    fun countByStatusAndDeletedFalse(status: AttestationSessionStatus): Long
}