package uz.scorm.lms.app.v1.assignment.repository

import org.springframework.data.jpa.repository.EntityGraph
import org.springframework.data.jpa.repository.JpaRepository
import uz.scorm.lms.app.v1.assignment.model.AssignmentSubmission

interface AssignmentSubmissionRepository : JpaRepository<AssignmentSubmission, Long> {
    @EntityGraph(attributePaths = ["assignment", "assignment.course", "enrollment", "enrollment.student", "enrollment.student.user"])
    fun findAllByAssignmentCourseUserIdAndDeletedFalseOrderBySubmittedAtDesc(userId: Long): List<AssignmentSubmission>

    @EntityGraph(attributePaths = ["assignment", "assignment.course", "enrollment", "enrollment.student", "enrollment.student.user"])
    fun findAllByDeletedFalseOrderBySubmittedAtDesc(): List<AssignmentSubmission>

    @EntityGraph(attributePaths = ["assignment", "assignment.course", "enrollment", "enrollment.student", "enrollment.student.user"])
    fun findAllByAssignmentIdAndDeletedFalseOrderBySubmittedAtDesc(assignmentId: Long): List<AssignmentSubmission>

    @EntityGraph(attributePaths = ["assignment", "assignment.course", "enrollment", "enrollment.student", "enrollment.student.user"])
    fun findAllByAssignmentIdAndEnrollmentIdAndDeletedFalseOrderByAttemptNumberDesc(
        assignmentId: Long,
        enrollmentId: Long,
    ): List<AssignmentSubmission>

    @EntityGraph(attributePaths = ["assignment", "assignment.course", "enrollment", "enrollment.student", "enrollment.student.user"])
    fun findByIdAndDeletedFalse(id: Long): AssignmentSubmission?
}
