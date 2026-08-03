package uz.scorm.lms.app.v1.assignment.dto

import uz.scorm.lms.app.v1.assignment.model.AssignmentPriority
import uz.scorm.lms.app.v1.assignment.model.AssignmentStatus
import uz.scorm.lms.app.v1.assignment.model.AssignmentSubmissionType
import java.time.Instant

data class AssignmentRequest(
    val courseId: Long,
    val title: String,
    val description: String = "",
    val instructions: String = "",
    val dueDate: Instant,
    val maxScore: Int = 100,
    val priority: AssignmentPriority = AssignmentPriority.MEDIUM,
    val submissionType: AssignmentSubmissionType = AssignmentSubmissionType.BOTH,
    val status: AssignmentStatus = AssignmentStatus.PUBLISHED,
)

data class AssignmentStatusRequest(val status: AssignmentStatus)

data class GradeSubmissionRequest(val score: Int, val feedback: String? = null)

data class TeacherAssignmentDto(
    val id: String,
    val title: String,
    val description: String,
    val courseTitle: String,
    val courseId: String,
    val dueDate: Instant,
    val maxScore: Int,
    val priority: String,
    val submissionType: String,
    val totalSubmissions: Int,
    val pendingGrade: Int,
    val status: String,
)

data class TeacherSubmissionDto(
    val id: String,
    val assignmentId: String,
    val studentName: String,
    val assignmentTitle: String,
    val courseTitle: String,
    val submittedAt: Instant,
    val status: String,
    val score: Int?,
    val maxScore: Int,
    val feedback: String?,
    val answer: String?,
    val fileName: String?,
    val fileUrl: String?,
    val attemptNumber: Int,
)

data class StudentAssignmentDetailsDto(
    val id: String,
    val title: String,
    val description: String,
    val courseId: String,
    val courseName: String,
    val dueDate: Instant,
    val status: String,
    val priority: String,
    val maxScore: Int,
    val submittedAt: Instant?,
    val grade: Int?,
    val feedback: String?,
    val instructions: String,
    val attachments: List<AssignmentAttachmentDto> = emptyList(),
    val submissionType: String,
)

data class AssignmentAttachmentDto(
    val id: String,
    val name: String,
    val url: String,
    val size: Long,
    val uploadedAt: Instant,
)

data class StudentSubmissionDto(
    val id: String,
    val assignmentId: String,
    val studentId: String,
    val fileUrl: String?,
    val fileName: String?,
    val answer: String?,
    val submittedAt: Instant,
    val grade: Int?,
    val feedback: String?,
    val status: String,
    val attemptNumber: Int,
    val late: Boolean,
)

data class SubmissionFileResource(
    val bytes: ByteArray,
    val contentType: String,
    val fileName: String,
)
