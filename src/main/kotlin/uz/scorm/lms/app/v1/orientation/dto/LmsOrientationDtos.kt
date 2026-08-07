package uz.scorm.lms.app.v1.orientation.dto

import uz.scorm.lms.app.v1.orientation.model.LmsOrientationAttendanceStatus
import java.time.Instant

data class CreateLmsOrientationRequest(
    val title: String,
    val venue: String,
    val academicYear: String,
    val startsAt: Instant,
    val endsAt: Instant,
    val instructions: String? = null,
    val programId: Long? = null,
    val groupId: Long? = null,
)

data class RecordLmsOrientationAttendanceRequest(
    val status: LmsOrientationAttendanceStatus,
)

data class LmsOrientationSessionDto(
    val id: Long,
    val title: String,
    val venue: String,
    val academicYear: String,
    val startsAt: Instant,
    val endsAt: Instant,
    val instructions: String?,
    val programId: Long?,
    val groupId: Long?,
    val status: String,
    val attendeeCount: Int,
    val presentCount: Int,
    val acknowledgedCount: Int,
    val publishedAt: Instant?,
    val completedAt: Instant?,
    val cancelledAt: Instant?,
)

data class LmsOrientationAttendeeDto(
    val id: Long,
    val sessionId: Long,
    val sessionTitle: String,
    val venue: String,
    val startsAt: Instant,
    val endsAt: Instant,
    val instructions: String?,
    val sessionStatus: String,
    val studentId: Long,
    val studentNumber: String,
    val studentName: String,
    val attendanceStatus: String,
    val checkedInAt: Instant?,
    val acknowledgementAt: Instant?,
)

data class StudentLmsOrientationDto(
    val orientationRequired: Boolean,
    val orientationCompletedAt: Instant?,
    val sessions: List<LmsOrientationAttendeeDto>,
)
