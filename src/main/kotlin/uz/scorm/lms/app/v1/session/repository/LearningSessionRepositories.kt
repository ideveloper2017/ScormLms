package uz.scorm.lms.app.v1.session.repository

import org.springframework.data.jpa.repository.EntityGraph
import org.springframework.data.jpa.repository.JpaRepository
import uz.scorm.lms.app.v1.session.model.CourseLearningSession
import uz.scorm.lms.app.v1.session.model.LearningSessionAccess
import uz.scorm.lms.app.v1.session.model.LearningSessionStatus

interface CourseLearningSessionRepository : JpaRepository<CourseLearningSession, Long> {
    fun countByDeletedFalse(): Long
    @EntityGraph(attributePaths = ["course"])
    fun findAllByDeletedFalseOrderByStartsAtDesc(): List<CourseLearningSession>

    @EntityGraph(attributePaths = ["course"])
    fun findAllByCourseUserIdAndDeletedFalseOrderByStartsAtDesc(userId: Long): List<CourseLearningSession>

    @EntityGraph(attributePaths = ["course"])
    fun findAllByCourseIdInAndStatusInAndDeletedFalseOrderByStartsAtAsc(
        courseIds: Collection<Long>,
        statuses: Collection<LearningSessionStatus>,
    ): List<CourseLearningSession>

    @EntityGraph(attributePaths = ["course"])
    fun findByIdAndDeletedFalse(id: Long): CourseLearningSession?
}

interface LearningSessionAccessRepository : JpaRepository<LearningSessionAccess, Long> {
    fun countBySessionIdAndDeletedFalse(sessionId: Long): Long

    fun existsBySessionIdAndEnrollmentIdAndDeletedFalse(sessionId: Long, enrollmentId: Long): Boolean
}
