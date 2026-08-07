package uz.scorm.lms.app.v1.practice.dto

import uz.scorm.lms.app.v1.practice.model.PracticePlacementBasis
import java.time.Instant
import java.time.LocalDate

data class SaveStudentPracticeRequest(
    val studentId: Long,
    val academicYear: String,
    val planReference: String,
    val startsOn: LocalDate,
    val endsOn: LocalDate,
    val placementBasis: PracticePlacementBasis,
    val organizationName: String,
    val organizationAddress: String,
    val jobTitle: String? = null,
    val specialtyMatchConfirmed: Boolean = false,
    val agreementNumber: String? = null,
    val agreementDate: LocalDate? = null,
    val basisEvidenceReference: String,
)

data class CompleteStudentPracticeRequest(
    val summary: String,
    val evidenceReference: String,
)

data class PracticeStudentOptionDto(
    val id: Long,
    val studentNumber: String,
    val fullName: String,
    val academicYear: String?,
)

data class StudentPracticeDto(
    val id: Long,
    val studentId: Long,
    val studentNumber: String,
    val studentName: String,
    val academicYear: String,
    val planReference: String,
    val startsOn: LocalDate,
    val endsOn: LocalDate,
    val placementBasis: String,
    val organizationName: String,
    val organizationAddress: String,
    val jobTitle: String?,
    val specialtyMatchConfirmed: Boolean,
    val agreementNumber: String?,
    val agreementDate: LocalDate?,
    val basisEvidenceReference: String,
    val ruleCompliant: Boolean,
    val status: String,
    val approvedAt: Instant?,
    val approvedByName: String?,
    val completionSummary: String?,
    val completionEvidenceReference: String?,
    val completedAt: Instant?,
    val cancelledAt: Instant?,
)
