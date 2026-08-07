package uz.scorm.lms.app.v1.license.repository

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import uz.scorm.lms.app.v1.license.model.NonStateEducationLicense
import uz.scorm.lms.app.v1.license.model.NonStateLicenseProgramScope
import uz.scorm.lms.app.v1.license.model.NonStateLicenseStatus
import java.time.LocalDate

interface NonStateEducationLicenseRepository : JpaRepository<NonStateEducationLicense, Long> {
    fun findByIdAndDeletedFalse(id: Long): NonStateEducationLicense?
    fun findAllByDeletedFalseOrderByIssueDateDescLicenseNumberAsc(): List<NonStateEducationLicense>
    fun existsByLicenseNumberAndDeletedFalse(licenseNumber: String): Boolean
    fun countByStatusAndDeletedFalse(status: NonStateLicenseStatus): Long
}

interface NonStateLicenseProgramScopeRepository : JpaRepository<NonStateLicenseProgramScope, Long> {
    fun findByIdAndDeletedFalse(id: Long): NonStateLicenseProgramScope?
    fun findAllByLicenseIdAndDeletedFalseOrderByProgramCodeSnapshotAsc(licenseId: Long): List<NonStateLicenseProgramScope>
    fun existsByLicenseIdAndProgramIdAndDeletedFalse(licenseId: Long, programId: Long): Boolean

    @Query("""
        select case when count(s) > 0 then true else false end
        from NonStateLicenseProgramScope s
        where s.program.id = :programId and s.deleted = false and s.distanceEducationCovered = true
          and s.license.deleted = false and s.license.status = :status
          and s.license.validFrom <= :onDate
          and (s.license.validUntil is null or s.license.validUntil >= :onDate)
    """)
    fun existsEffectiveCoverage(
        @Param("programId") programId: Long,
        @Param("status") status: NonStateLicenseStatus,
        @Param("onDate") onDate: LocalDate,
    ): Boolean

    @Query("""
        select count(s) from NonStateLicenseProgramScope s
        where s.deleted = false and s.distanceEducationCovered = true
          and s.license.deleted = false and s.license.status = :status
          and s.license.validFrom <= :onDate
          and (s.license.validUntil is null or s.license.validUntil >= :onDate)
    """)
    fun countEffectiveCoverages(@Param("status") status: NonStateLicenseStatus, @Param("onDate") onDate: LocalDate): Long
}
