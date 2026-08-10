package uz.scorm.lms.app.v1.student.dto

import uz.scorm.lms.app.v1.courses.model.CourseEnrollmentStatus
import uz.scorm.lms.app.v1.student.model.StudentStatus
import java.time.Instant
import java.time.LocalDate

data class ReinstatementSubjectDto(
    val enrollmentId: Long,
    val courseId: Long,
    val courseTitle: String,
    val subjectCode: String?,
    val subjectName: String,
    val academicYear: String,
    val semester: Int,
    val credits: Int,
    val required: Boolean,
    val status: CourseEnrollmentStatus,
    val progress: Int,
    val enrolledAt: Instant,
    val completedAt: Instant?,
)

data class ReinstatementSubjectReportItemDto(
    val reinstatementEventId: Long,
    val studentId: Long,
    val studentNumber: String,
    val studentName: String,
    val studentStatus: StudentStatus,
    val programId: Long?,
    val programName: String?,
    val groupId: Long?,
    val groupName: String?,
    val academicYear: String?,
    val semesterNumber: Int?,
    val orderNumber: String,
    val orderDate: LocalDate,
    val effectiveDate: LocalDate,
    val reason: String,
    val subjects: List<ReinstatementSubjectDto>,
)

data class ReinstatementSubjectReportPageDto(
    val items: List<ReinstatementSubjectReportItemDto>,
    val page: Int,
    val size: Int,
    val totalElements: Long,
    val totalPages: Int,
)
