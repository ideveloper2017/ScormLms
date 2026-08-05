package uz.scorm.lms.app.v1.exam.dto

import uz.scorm.lms.app.v1.exam.model.ExamSessionStatus
import uz.scorm.lms.app.v1.exam.model.ExamType
import java.time.Instant
import java.time.LocalDate
import java.time.LocalTime

data class CreateExamSessionRequest(
    val courseId: Long,
    val semesterId: Long? = null,
    val title: String,
    val description: String? = null,
    val examDate: LocalDate,
    val examTime: LocalTime,
    val location: String,
    val maxCapacity: Int? = null,
    val examinerId: Long,
    val secondaryExaminerId: Long? = null,
    val examType: ExamType = ExamType.WRITTEN,
    val durationMinutes: Int = 120,
)

data class UpdateExamSessionRequest(
    val title: String? = null,
    val description: String? = null,
    val location: String? = null,
    val examTime: LocalTime? = null,
    val examDate: LocalDate? = null,
    val maxCapacity: Int? = null,
    val secondaryExaminerId: Long? = null,
    val durationMinutes: Int? = null,
)

data class PublishExamSessionRequest(val publishAt: Instant? = null)

data class CompleteExamSessionRequest(val completedAt: Instant? = null)

data class TeacherExamSessionDto(
    val id: String,
    val courseId: String,
    val courseTitle: String,
    val title: String,
    val description: String?,
    val examDate: LocalDate,
    val examTime: LocalTime,
    val location: String,
    val examType: String,
    val durationMinutes: Int,
    val examinerId: String,
    val examinerName: String,
    val secondaryExaminerId: String?,
    val secondaryExaminerName: String?,
    val status: String,
    val maxCapacity: Int?,
    val registeredCount: Int,
    val presentCount: Int,
    val absentCount: Int,
    val publishedAt: Instant?,
    val heldAt: Instant?,
    val createdAt: Instant,
    val updatedAt: Instant,
)

data class StudentExamSessionDto(
    val id: String,
    val courseId: String,
    val courseTitle: String,
    val title: String,
    val description: String?,
    val examDate: LocalDate,
    val examTime: LocalTime,
    val location: String,
    val examType: String,
    val durationMinutes: Int,
    val examinerName: String,
    val status: String,
    val myAttendanceStatus: String?,
    val myScore: Double?,
    val myGrade: String?,
    val resultPublished: Boolean = false,
)

data class ExamSessionDetailDto(
    val id: String,
    val courseId: String,
    val courseTitle: String,
    val title: String,
    val description: String?,
    val examDate: LocalDate,
    val examTime: LocalTime,
    val location: String,
    val examType: String,
    val durationMinutes: Int,
    val examinerName: String,
    val secondaryExaminerName: String?,
    val status: String,
    val maxCapacity: Int?,
    val totalEnrolled: Int,
    val presentCount: Int,
    val lateCount: Int,
    val absentCount: Int,
    val excusedCount: Int,
    val averageScore: Double?,
    val passedCount: Int?,
    val failedCount: Int?,
    val publishedAt: Instant?,
    val heldAt: Instant?,
)