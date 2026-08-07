package uz.scorm.lms.app.v1.compliance

import org.springframework.data.jpa.repository.JpaRepository

interface ComplianceAccountabilityReferralRepository : JpaRepository<ComplianceAccountabilityReferral, Long> {
    fun findAllByDeletedFalseOrderByReferralDateDesc(): List<ComplianceAccountabilityReferral>
    fun findByIdAndDeletedFalse(id: Long): ComplianceAccountabilityReferral?
    fun countByStatusAndDeletedFalse(status: AccountabilityReferralStatus): Long
    fun existsByCompetentAuthorityAndReferralNumberAndDeletedFalse(competentAuthority: String, referralNumber: String): Boolean
    fun existsByCompetentAuthorityAndReferralNumberAndDeletedFalseAndIdNot(competentAuthority: String, referralNumber: String, id: Long): Boolean
}
