package uz.scorm.lms.app.v1.compliance

import org.springframework.data.jpa.repository.JpaRepository

interface ComplianceIssueRepository : JpaRepository<ComplianceIssue, Long> {
    fun findAllByDeletedFalseOrderByStatusAscDueDateAsc(): List<ComplianceIssue>
    fun findByIdAndDeletedFalse(id: Long): ComplianceIssue?
    fun findFirstByViolationCodeAndStatusNotAndDeletedFalse(
        violationCode: String,
        status: ComplianceIssueStatus,
    ): ComplianceIssue?
}
