package uz.scorm.lms.app.v1.curriculum.dto

import uz.scorm.lms.app.v1.curriculum.model.CurriculumCredentialType
import uz.scorm.lms.app.v1.curriculum.model.CurriculumNormativeBasisType
import uz.scorm.lms.app.v1.curriculum.model.CurriculumPlanItemType
import java.time.Instant
import java.time.LocalDate

data class SaveCurriculumVersionRequest(
    val programId: Long,
    val versionCode: String,
    val academicYear: String,
    val credentialType: CurriculumCredentialType,
    val normativeBasisType: CurriculumNormativeBasisType,
    val standardReference: String,
    val qualificationRequirementsReference: String,
    val validFrom: LocalDate,
    val validUntil: LocalDate,
)

data class AddCurriculumSubjectRequest(
    val subjectId: Long,
    val semester: Int,
    val planItemType: CurriculumPlanItemType,
)

data class ApproveCurriculumRequest(
    val approvalOrderNumber: String,
    val approvalOrderDate: LocalDate,
)

data class CurriculumSubjectDto(
    val id: Long,
    val subjectId: Long?,
    val subjectCode: String,
    val subjectName: String,
    val credits: Int,
    val semester: Int,
    val planItemType: String,
)

data class CurriculumVersionDto(
    val id: Long,
    val programId: Long,
    val programName: String,
    val versionCode: String,
    val academicYear: String,
    val credentialType: String,
    val normativeBasisType: String,
    val standardReference: String,
    val qualificationRequirementsReference: String,
    val validFrom: LocalDate,
    val validUntil: LocalDate,
    val status: String,
    val subjects: List<CurriculumSubjectDto>,
    val subjectCount: Int,
    val totalCredits: Int,
    val approvalOrderNumber: String?,
    val approvalOrderDate: LocalDate?,
    val approvedAt: Instant?,
    val approvedByName: String?,
    val archivedAt: Instant?,
)

