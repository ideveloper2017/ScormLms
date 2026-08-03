package uz.scorm.lms.app.v1.attendance.dto

import java.time.Instant

data class AttendanceSessionRequest(
    val courseId: Long,
    val title: String,
    val opensAt: Instant,
    val closesAt: Instant,
    val lateAfter: Instant? = null,
    val minimumActivitySeconds: Int = 0,
)

data class TeacherAttendanceSessionDto(
    val id: Long,
    val courseId: Long,
    val courseTitle: String,
    val group: String,
    val sessionTitle: String,
    val date: Instant,
    val opensAt: Instant,
    val closesAt: Instant,
    val lateAfter: Instant?,
    val minimumActivitySeconds: Int,
    val status: String,
    val present: Int,
    val late: Int,
    val absent: Int,
    val pending: Int,
    val total: Int,
)
