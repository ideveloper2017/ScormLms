package uz.scorm.lms.app.v1.leave.repository

import org.springframework.data.jpa.repository.JpaRepository
import uz.scorm.lms.app.v1.leave.model.AssessmentLeaveEvidence
import uz.scorm.lms.app.v1.leave.model.AssessmentLeavePurpose
import uz.scorm.lms.app.v1.leave.model.AssessmentLeaveStatus

interface AssessmentLeaveEvidenceRepository : JpaRepository<AssessmentLeaveEvidence, Long> {
    fun findByIdAndDeletedFalse(id: Long): AssessmentLeaveEvidence?
    fun findAllByDeletedFalseOrderByLeaveStartDateDesc(): List<AssessmentLeaveEvidence>
    fun findAllByStudentIdAndDeletedFalseOrderByLeaveStartDateDesc(studentId: Long): List<AssessmentLeaveEvidence>
    fun existsByStudentIdAndAcademicYearAndLeavePurposeAndAssessmentReferenceAndDeletedFalseAndStatusNot(
        studentId: Long,
        academicYear: String,
        leavePurpose: AssessmentLeavePurpose,
        assessmentReference: String,
        status: AssessmentLeaveStatus,
    ): Boolean
    fun existsByStudentIdAndAcademicYearAndLeavePurposeAndAssessmentReferenceAndDeletedFalseAndStatusNotAndIdNot(
        studentId: Long,
        academicYear: String,
        leavePurpose: AssessmentLeavePurpose,
        assessmentReference: String,
        status: AssessmentLeaveStatus,
        id: Long,
    ): Boolean
    fun countByStatusAndDeletedFalse(status: AssessmentLeaveStatus): Long
}
