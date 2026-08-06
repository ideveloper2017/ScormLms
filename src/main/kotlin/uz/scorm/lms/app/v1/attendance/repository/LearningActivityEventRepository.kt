package uz.scorm.lms.app.v1.attendance.repository

import org.springframework.data.jpa.repository.EntityGraph
import org.springframework.data.jpa.repository.JpaRepository
import uz.scorm.lms.app.v1.attendance.model.LearningActivityEvent
import uz.scorm.lms.app.v1.attendance.model.LearningActivitySource
import uz.scorm.lms.app.v1.attendance.model.LearningActivityType
import java.time.Instant

interface LearningActivityEventRepository : JpaRepository<LearningActivityEvent, Long> {
    fun countByDeletedFalse(): Long
    @EntityGraph(attributePaths = ["enrollment", "enrollment.course", "enrollment.student", "enrollment.student.user"])
    fun findAllByEnrollmentIdAndOccurredAtBetweenAndDeletedFalseOrderByOccurredAtAsc(
        enrollmentId: Long,
        from: Instant,
        to: Instant,
    ): List<LearningActivityEvent>

    fun existsByEnrollmentIdAndEventTypeAndSourceTypeAndSourceIdAndDeletedFalse(
        enrollmentId: Long,
        eventType: LearningActivityType,
        sourceType: LearningActivitySource,
        sourceId: Long,
    ): Boolean

    fun countByEnrollmentIdAndDeletedFalse(enrollmentId: Long): Long
    fun countByEnrollmentIdAndOccurredAtBetweenAndDeletedFalse(enrollmentId: Long, from: Instant, to: Instant): Long
}
