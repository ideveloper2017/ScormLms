package uz.scorm.lms.app.v1.orientation.repository

import org.springframework.data.jpa.repository.JpaRepository
import uz.scorm.lms.app.v1.orientation.model.LmsOrientationAttendee
import uz.scorm.lms.app.v1.orientation.model.LmsOrientationSession
import uz.scorm.lms.app.v1.orientation.model.LmsOrientationSessionStatus

interface LmsOrientationSessionRepository : JpaRepository<LmsOrientationSession, Long> {
    fun findAllByDeletedFalseOrderByStartsAtDesc(): List<LmsOrientationSession>
    fun findByIdAndDeletedFalse(id: Long): LmsOrientationSession?
    fun countByStatusAndDeletedFalse(status: LmsOrientationSessionStatus): Long
}

interface LmsOrientationAttendeeRepository : JpaRepository<LmsOrientationAttendee, Long> {
    fun findAllBySessionIdAndDeletedFalseOrderByStudentLastNameAsc(sessionId: Long): List<LmsOrientationAttendee>
    fun findAllByStudentIdAndDeletedFalseOrderBySessionStartsAtDesc(studentId: Long): List<LmsOrientationAttendee>
    fun findBySessionIdAndStudentIdAndDeletedFalse(sessionId: Long, studentId: Long): LmsOrientationAttendee?
    fun countByAcknowledgementAtIsNotNullAndDeletedFalse(): Long
}
