package uz.scorm.lms.app.v1.compliance.uat

import org.springframework.data.jpa.repository.JpaRepository

interface Decision559UatRunRepository : JpaRepository<Decision559UatRun, Long> {
    fun findAllByDeletedFalseOrderByCreatedAtDesc(): List<Decision559UatRun>
    fun findByIdAndDeletedFalse(id: Long): Decision559UatRun?
    fun countByStatusAndDeletedFalse(status: Decision559UatRunStatus): Long
}

interface Decision559UatEvidenceRepository : JpaRepository<Decision559UatEvidence, Long> {
    fun findAllByRunIdAndDeletedFalseOrderByBandAsc(runId: Long): List<Decision559UatEvidence>
    fun findByRunIdAndBandAndDeletedFalse(runId: Long, band: Int): Decision559UatEvidence?
    fun findByIdAndDeletedFalse(id: Long): Decision559UatEvidence?
}

interface Decision559UatEvidenceFileRepository : JpaRepository<Decision559UatEvidenceFile, Long> {
    fun findAllByEvidenceIdAndDeletedFalseOrderByIdAsc(evidenceId: Long): List<Decision559UatEvidenceFile>
    fun findAllByEvidenceRunIdAndDeletedFalseOrderByEvidenceBandAscIdAsc(runId: Long): List<Decision559UatEvidenceFile>
    fun findByIdAndDeletedFalse(id: Long): Decision559UatEvidenceFile?
    fun countByEvidenceIdAndDeletedFalse(evidenceId: Long): Long
}

interface Decision559UatManualTaskCoordinationRepository : JpaRepository<Decision559UatManualTaskCoordination, Long> {
    fun findAllByRunIdAndDeletedFalseOrderByBandAscItemIndexAsc(runId: Long): List<Decision559UatManualTaskCoordination>
    fun findByRunIdAndRequirementIdAndItemIndexAndDeletedFalse(
        runId: Long,
        requirementId: String,
        itemIndex: Int,
    ): Decision559UatManualTaskCoordination?
}
