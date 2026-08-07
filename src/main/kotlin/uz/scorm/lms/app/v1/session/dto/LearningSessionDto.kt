package uz.scorm.lms.app.v1.session.dto

import uz.scorm.lms.app.v1.session.model.LearningSessionAccessType
import uz.scorm.lms.app.v1.session.model.LearningSessionFormat
import uz.scorm.lms.app.v1.session.model.LearningSessionStatus
import uz.scorm.lms.app.v1.session.model.LearningSessionType
import uz.scorm.lms.app.v1.videoconference.dto.VideoConferenceMeetingDto
import java.time.Instant

data class LearningSessionRequest(
    val courseId: Long,
    val title: String,
    val description: String = "",
    val format: LearningSessionFormat,
    val sessionType: LearningSessionType = LearningSessionType.LECTURE,
    val startsAt: Instant,
    val endsAt: Instant,
    val room: String? = null,
    val building: String? = null,
    val liveUrl: String? = null,
    val recordingUrl: String? = null,
    val resourceUrl: String? = null,
    val status: LearningSessionStatus = LearningSessionStatus.DRAFT,
)

data class LearningSessionStatusRequest(val status: LearningSessionStatus)

data class TeacherLearningSessionDto(
    val id: String,
    val courseId: String,
    val courseTitle: String,
    val title: String,
    val description: String,
    val format: String,
    val sessionType: String,
    val startsAt: Instant,
    val endsAt: Instant,
    val room: String?,
    val building: String?,
    val liveUrl: String?,
    val recordingUrl: String?,
    val resourceUrl: String?,
    val status: String,
    val accessCount: Long,
    val videoConference: VideoConferenceMeetingDto?,
)

data class StudentLearningSessionDto(
    val id: String,
    val courseId: String,
    val courseName: String,
    val instructor: String,
    val title: String,
    val description: String,
    val room: String,
    val building: String?,
    val date: String,
    val startsAt: Instant,
    val endsAt: Instant,
    val dayOfWeek: Int,
    val startTime: String,
    val endTime: String,
    val type: String,
    val format: String,
    val status: String,
    val isOnline: Boolean,
    val meetingLink: String?,
    val recordingUrl: String?,
    val resourceUrl: String?,
    val hasRecording: Boolean,
    val hasResource: Boolean,
    val canJoin: Boolean,
    val canOpenResources: Boolean,
    val accessed: Boolean,
)

data class LearningSessionAccessRequest(
    val type: LearningSessionAccessType,
)

data class LearningSessionAccessResponse(
    val url: String,
    val type: String,
    val occurredAt: Instant,
)
