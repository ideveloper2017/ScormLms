package uz.scorm.lms.app.v1.courses.dto

import uz.scorm.lms.app.v1.courses.model.CourseStatus
import uz.scorm.lms.app.v1.courses.model.CourseContentType
import uz.scorm.lms.app.v1.courses.model.ContentReviewDecision
import uz.scorm.lms.app.v1.courses.model.LearningItemStatus
import java.time.Instant
import java.time.LocalDate

data class CourseDto(
    val id: Long,
    val title: String,
    val description: String,
    val subjectName: String?,
    val subjectId: Long?,
    val programId: Long?,
    val programName: String?,
    val programLanguage: String?,
    val groupName: String?,
    val subjectGroupId: Long?,
    val curriculumSubjectId: Long?,
    val academicYear: String?,
    val semester: Int?,
    val credits: Int?,
    val status: String,
    val startDate: LocalDate?,
    val endDate: LocalDate?,
    val language: String?,
    val level: String?,
    val ownerUserId: Long,
    val students: Long,
    val progress: Int = 0,
    val avgScore: Double? = null,
    val publishedAt: Instant?,
    val archivedAt: Instant?,
    val createdAt: Instant?,
    val updatedAt: Instant?,
)

data class CourseCreateRequest(
    val title: String,
    val description: String? = null,
    val subjectName: String? = null,
    val subjectId: Long? = null,
    val subjectGroupId: Long? = null,
    val groupName: String? = null,
    val startDate: LocalDate? = null,
    val endDate: LocalDate? = null,
    val language: String? = "uz",
    val level: String? = null,
)

data class CourseUpdateRequest(
    val title: String? = null,
    val description: String? = null,
    val subjectName: String? = null,
    val subjectId: Long? = null,
    val groupName: String? = null,
    val startDate: LocalDate? = null,
    val endDate: LocalDate? = null,
    val language: String? = null,
    val level: String? = null,
)

data class CourseStatusRequest(
    val status: CourseStatus,
)

data class CourseEnrollmentRequest(
    val studentIds: Set<Long>,
    val academicYear: String? = null,
    val semester: Int = 1,
    val credits: Int = 0,
    val required: Boolean = true,
)

data class CourseEnrollmentDto(
    val id: Long,
    val courseId: Long,
    val studentId: Long,
    val studentNumber: String,
    val studentName: String,
    val status: String,
    val progress: Int,
    val academicYear: String,
    val semester: Int,
    val credits: Int,
    val required: Boolean,
    val enrolledAt: Instant,
    val completedAt: Instant?,
)

data class CourseModuleDto(
    val id: Long,
    val courseId: Long,
    val title: String,
    val description: String?,
    val position: Int,
    val status: String,
    val contentCount: Int,
    val publishedAt: Instant?,
)

data class CourseModuleRequest(
    val title: String,
    val description: String? = null,
    val position: Int? = null,
)

data class CourseContentDto(
    val id: Long,
    val courseId: Long,
    val moduleId: Long,
    val moduleTitle: String,
    val title: String,
    val description: String?,
    val contentType: String,
    val contentUrl: String?,
    val contentBody: String?,
    val asset: CourseContentAssetDto?,
    val subjectMaterialId: Long?,
    val durationMinutes: Int?,
    val position: Int,
    val status: String,
    val publishedAt: Instant?,
    val languageCode: String,
    val authorName: String,
    val contentVersion: String,
    val sourceName: String,
    val sourceUrl: String?,
    val validFrom: LocalDate,
    val validUntil: LocalDate?,
    val effective: Boolean,
    val metadataUpdatedAt: Instant,
    val reviewStatus: String,
    val approvedRevisionNumber: Int?,
    val compatibility: ContentCompatibilityDto,
)

data class ContentCompatibilityIssueDto(
    val code: String,
    val message: String,
    val details: List<String> = emptyList(),
)

data class ContentCompatibilityDto(
    val compatible: Boolean,
    val courseLanguage: String?,
    val contentLanguage: String,
    val subjectId: Long?,
    val subjectName: String?,
    val programId: Long?,
    val programName: String?,
    val programLanguage: String?,
    val issues: List<ContentCompatibilityIssueDto>,
)

data class CourseContentRequest(
    val title: String,
    val description: String? = null,
    val contentType: CourseContentType,
    val contentUrl: String? = null,
    val contentBody: String? = null,
    val assetId: Long? = null,
    val durationMinutes: Int? = null,
    val position: Int? = null,
    val languageCode: String,
    val authorName: String,
    val contentVersion: String,
    val sourceName: String,
    val sourceUrl: String? = null,
    val validFrom: LocalDate,
    val validUntil: LocalDate? = null,
)

data class CourseContentRevisionDto(
    val id: Long,
    val contentId: Long,
    val revisionNumber: Int,
    val title: String,
    val description: String?,
    val contentType: String,
    val contentUrl: String?,
    val contentBody: String?,
    val asset: CourseContentAssetDto?,
    val durationMinutes: Int?,
    val languageCode: String,
    val authorName: String,
    val contentVersion: String,
    val sourceName: String,
    val sourceUrl: String?,
    val validFrom: LocalDate,
    val validUntil: LocalDate?,
    val changedAt: Instant,
    val changedBy: Long,
)

data class CourseContentAssetDto(
    val id: Long,
    val courseId: Long?,
    val subjectId: Long?,
    val originalFileName: String,
    val mediaType: String,
    val sizeBytes: Long,
    val sha256: String,
    val uploadedAt: Instant?,
)

data class SubjectMaterialRequest(
    val subjectId: Long,
    val title: String,
    val description: String? = null,
    val contentType: CourseContentType,
    val contentUrl: String? = null,
    val contentBody: String? = null,
    val assetId: Long? = null,
    val languageCode: String = "uz",
    val contentVersion: String = "1.0",
    val sourceName: String? = null,
    val sourceUrl: String? = null,
)

data class SubjectMaterialSubjectDto(
    val id: Long,
    val name: String,
)

data class SubjectMaterialDto(
    val id: Long,
    val subjectId: Long,
    val subjectName: String,
    val title: String,
    val description: String?,
    val contentType: String,
    val contentUrl: String?,
    val contentBody: String?,
    val asset: CourseContentAssetDto?,
    val languageCode: String,
    val authorName: String,
    val contentVersion: String,
    val sourceName: String,
    val sourceUrl: String?,
    val createdAt: Instant?,
    val updatedAt: Instant?,
)

data class CourseContentReviewDto(
    val id: Long,
    val courseId: Long,
    val courseTitle: String,
    val moduleId: Long,
    val moduleTitle: String,
    val contentId: Long,
    val contentTitle: String,
    val description: String?,
    val contentType: String,
    val contentUrl: String?,
    val contentBody: String? = null,
    val asset: CourseContentAssetDto? = null,
    val languageCode: String,
    val authorName: String,
    val sourceName: String,
    val sourceUrl: String?,
    val validFrom: LocalDate,
    val validUntil: LocalDate?,
    val revisionNumber: Int,
    val contentVersion: String,
    val status: String,
    val submittedAt: Instant,
    val submittedBy: Long,
    val reviewedAt: Instant?,
    val reviewedBy: Long?,
    val decisionComment: String?,
    val compatibility: ContentCompatibilityDto,
)

data class ContentReviewDecisionRequest(
    val decision: ContentReviewDecision,
    val comment: String? = null,
)

data class LearningItemStatusRequest(
    val status: LearningItemStatus,
)
