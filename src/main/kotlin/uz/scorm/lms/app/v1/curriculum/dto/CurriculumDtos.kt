package uz.scorm.lms.app.v1.curriculum.dto

import uz.scorm.lms.app.v1.curriculum.model.CurriculumCredentialType
import uz.scorm.lms.app.v1.curriculum.model.CurriculumNormativeBasisType
import uz.scorm.lms.app.v1.curriculum.model.CurriculumPlanItemType
import uz.scorm.lms.app.v1.student.model.EducationForm
import uz.scorm.lms.app.v1.student.model.StudentStatus
import java.time.Instant
import java.time.LocalDate

data class SaveCurriculumVersionRequest(
    val programId: Long,
    val versionCode: String,
    val academicYear: String,
    val name: String = "",
    val active: Boolean = true,
    val educationLanguage: String = "uz",
    val passingScore: Int = 60,
    val baseCreditAmount: Long = 0,
    val educationForm: EducationForm = EducationForm.DISTANCE,
    val ratingSystemId: Long? = null,
    val semesterCount: Int = 8,
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
    val facultyId: Long?,
    val facultyName: String?,
    val versionCode: String,
    val academicYear: String,
    val startYear: Int,
    val name: String,
    val active: Boolean,
    val educationLanguage: String,
    val passingScore: Int,
    val baseCreditAmount: Long,
    val educationForm: EducationForm,
    val ratingSystemId: Long,
    val ratingSystemName: String,
    val semesterCount: Int,
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

data class CurriculumStudentDto(
    val studentId: Long,
    val studentNumber: String,
    val fullName: String,
    val status: StudentStatus,
    val groupId: Long?,
    val groupName: String?,
    val courseNumber: Int,
    val semesterNumber: Int?,
    val educationForm: EducationForm,
    val educationLanguage: String,
)

data class CurriculumStudentPageDto(
    val items: List<CurriculumStudentDto>,
    val page: Int,
    val size: Int,
    val totalElements: Long,
    val totalPages: Int,
)
