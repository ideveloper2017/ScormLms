package uz.scorm.lms.app.v1.videoconference.repository

import org.springframework.data.jpa.repository.EntityGraph
import org.springframework.data.jpa.repository.JpaRepository
import uz.scorm.lms.app.v1.videoconference.model.VideoConferenceMeeting
import uz.scorm.lms.app.v1.videoconference.model.VideoConferenceMeetingStatus

interface VideoConferenceMeetingRepository : JpaRepository<VideoConferenceMeeting, Long> {
    @EntityGraph(attributePaths = ["session", "session.course", "requestedByUser", "cancelledByUser"])
    fun findBySessionIdAndDeletedFalse(sessionId: Long): VideoConferenceMeeting?
    fun countByStatusAndDeletedFalse(status: VideoConferenceMeetingStatus): Long
}
