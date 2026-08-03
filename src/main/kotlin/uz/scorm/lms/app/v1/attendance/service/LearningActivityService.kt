package uz.scorm.lms.app.v1.attendance.service

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.attendance.model.LearningActivityEvent
import uz.scorm.lms.app.v1.attendance.model.LearningActivitySource
import uz.scorm.lms.app.v1.attendance.model.LearningActivityType
import uz.scorm.lms.app.v1.attendance.repository.LearningActivityEventRepository
import uz.scorm.lms.app.v1.courses.model.CourseEnrollmentStatus
import uz.scorm.lms.app.v1.courses.repository.CourseEnrollmentRepository
import java.time.Instant

@Service
class LearningActivityService(
    private val enrollmentRepository: CourseEnrollmentRepository,
    private val eventRepository: LearningActivityEventRepository,
) {
    @Transactional
    fun recordIfEnrolled(
        courseId: Long,
        userId: Long,
        eventType: LearningActivityType,
        sourceType: LearningActivitySource,
        sourceId: Long,
        durationSeconds: Int = 0,
        occurredAt: Instant = Instant.now(),
    ): LearningActivityEvent? {
        require(durationSeconds in 0..86_400) { "Faollik davomiyligi 0 dan 86400 soniyagacha bo'lishi kerak" }
        val enrollment = enrollmentRepository.findByCourseIdAndStudentUserIdAndStatusInAndDeletedFalse(
            courseId,
            userId,
            setOf(CourseEnrollmentStatus.ACTIVE, CourseEnrollmentStatus.COMPLETED),
        ) ?: return null
        val enrollmentId = requireNotNull(enrollment.id)
        if (eventType in setOf(LearningActivityType.CONTENT_COMPLETED, LearningActivityType.SCORM_FINISHED) &&
            eventRepository.existsByEnrollmentIdAndEventTypeAndSourceTypeAndSourceIdAndDeletedFalse(
                enrollmentId, eventType, sourceType, sourceId,
            )
        ) return null
        return eventRepository.save(LearningActivityEvent(
            enrollment = enrollment,
            eventType = eventType,
            sourceType = sourceType,
            sourceId = sourceId,
            durationSeconds = durationSeconds,
            occurredAt = occurredAt,
        ))
    }
}
