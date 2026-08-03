package uz.scorm.lms.app.v1.assignment.repository

import org.springframework.data.jpa.repository.EntityGraph
import org.springframework.data.jpa.repository.JpaRepository
import uz.scorm.lms.app.v1.assignment.model.AssignmentStatus
import uz.scorm.lms.app.v1.assignment.model.CourseAssignment

interface CourseAssignmentRepository : JpaRepository<CourseAssignment, Long> {
    @EntityGraph(attributePaths = ["course"])
    fun findAllByDeletedFalseOrderByDueAtDesc(): List<CourseAssignment>

    @EntityGraph(attributePaths = ["course"])
    fun findAllByCourseUserIdAndDeletedFalseOrderByDueAtDesc(userId: Long): List<CourseAssignment>

    @EntityGraph(attributePaths = ["course"])
    fun findAllByCourseIdInAndStatusInAndDeletedFalseOrderByDueAtAsc(
        courseIds: Collection<Long>,
        statuses: Collection<AssignmentStatus>,
    ): List<CourseAssignment>

    @EntityGraph(attributePaths = ["course"])
    fun findByIdAndDeletedFalse(id: Long): CourseAssignment?
}
