package uz.scorm.lms.app.v1.leave.dto

import uz.scorm.lms.app.v1.leave.model.AssessmentLeavePurpose
import java.time.Instant
import java.time.LocalDate

data class SaveAssessmentLeaveEvidenceRequest(
    val studentId: Long,
    val academicYear: String,
    val leavePurpose: AssessmentLeavePurpose,
    val assessmentReference: String,
    val employerName: String,
    val jobTitle: String,
    val employmentDocumentReference: String,
    val leaveOrderNumber: String,
    val leaveOrderDate: LocalDate,
    val leaveStartDate: LocalDate,
    val leaveEndDate: LocalDate,
    val salaryRetentionConfirmed: Boolean,
    val evidenceReference: String,
)

data class VerifyAssessmentLeaveEvidenceRequest(val verificationNote: String)
data class RejectAssessmentLeaveEvidenceRequest(val reason: String)
data class AssessmentLeaveStudentOptionDto(val id: Long, val studentNumber: String, val fullName: String, val academicYear: String?)

data class AssessmentLeaveEvidenceDto(
    val id: Long,
    val studentId: Long,
    val studentNumber: String,
    val studentName: String,
    val academicYear: String,
    val leavePurpose: String,
    val assessmentReference: String,
    val employerName: String,
    val jobTitle: String,
    val employmentDocumentReference: String,
    val leaveOrderNumber: String,
    val leaveOrderDate: LocalDate,
    val leaveStartDate: LocalDate,
    val leaveEndDate: LocalDate,
    val calendarDays: Long,
    val salaryRetentionConfirmed: Boolean,
    val evidenceReference: String,
    val status: String,
    val createdByName: String,
    val verifiedAt: Instant?,
    val verifiedByName: String?,
    val verificationNote: String?,
    val rejectedAt: Instant?,
    val rejectedByName: String?,
    val rejectionReason: String?,
)
