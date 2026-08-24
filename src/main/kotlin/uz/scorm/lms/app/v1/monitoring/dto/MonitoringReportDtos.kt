package uz.scorm.lms.app.v1.monitoring.dto

import java.time.Instant

data class StudentLoginMonitorDto(
    val studentId: Long,
    val fullName: String,
    val studentNumber: String,
    val group: String,
    val lastLoginAt: Instant?,
    val inactiveDays: Long?,
)

data class ElectiveChoiceExceptionDto(
    val studentId: Long,
    val fullName: String,
    val curriculum: String,
    val group: String,
    val subject: String,
    val academicYear: String,
    val semester: Int,
    val status: String,
)

data class LearningParticipationDto(
    val eventId: Long,
    val studentId: Long,
    val fullName: String,
    val group: String,
    val program: String,
    val lesson: String,
    val eventType: String,
    val loginDate: Instant,
    val durationSeconds: Int,
)

data class StudentIpReportDto(
    val studentId: Long,
    val fullName: String,
    val studentNumber: String,
    val group: String,
    val username: String,
    val ipAddresses: List<String>,
    val loginCount: Int,
    val lastSeenAt: Instant,
)

data class LessonCommentReportDto(
    val postId: Long,
    val academicYear: String,
    val program: String,
    val semester: Int?,
    val course: String,
    val topic: String,
    val author: String,
    val comment: String,
    val createdAt: Instant?,
    val hidden: Boolean,
)
