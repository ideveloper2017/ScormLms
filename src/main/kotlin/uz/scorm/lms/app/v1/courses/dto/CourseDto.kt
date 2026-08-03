package uz.scorm.lms.app.v1.courses.dto

import uz.scorm.lms.app.v1.courses.model.CourseStatus
import uz.scorm.lms.app.v1.courses.model.CourseContentType
import uz.scorm.lms.app.v1.courses.model.LearningItemStatus
import java.time.Instant
import java.time.LocalDate

data class CourseDto(
    val id: Long,
    val title: String,
    val description: String,
    val subjectName: String?,
    val groupName: String?,
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
    val durationMinutes: Int?,
    val position: Int,
    val status: String,
    val publishedAt: Instant?,
)

data class CourseContentRequest(
    val title: String,
    val description: String? = null,
    val contentType: CourseContentType,
    val contentUrl: String? = null,
    val durationMinutes: Int? = null,
    val position: Int? = null,
)

data class LearningItemStatusRequest(
    val status: LearningItemStatus,
)
