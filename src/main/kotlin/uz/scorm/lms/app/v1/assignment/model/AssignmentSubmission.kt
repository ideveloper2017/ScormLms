package uz.scorm.lms.app.v1.assignment.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.FetchType
import jakarta.persistence.Index
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import jakarta.persistence.UniqueConstraint
import uz.scorm.lms.app.common.BaseEntity
import uz.scorm.lms.app.v1.courses.model.CourseEnrollment
import java.time.Instant

@Entity
@Table(
    name = "assignment_submissions",
    uniqueConstraints = [
        UniqueConstraint(
            name = "uk_assignment_submission_attempt",
            columnNames = ["assignment_id", "enrollment_id", "attempt_number"],
        ),
    ],
    indexes = [
        Index(name = "idx_assignment_submission_assignment", columnList = "assignment_id,submitted_at"),
        Index(name = "idx_assignment_submission_enrollment", columnList = "enrollment_id,submitted_at"),
    ],
)
class AssignmentSubmission(
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "assignment_id", nullable = false)
    var assignment: CourseAssignment,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "enrollment_id", nullable = false)
    var enrollment: CourseEnrollment,

    @Column(name = "attempt_number", nullable = false)
    var attemptNumber: Int,

    @Column(columnDefinition = "TEXT")
    var answer: String? = null,

    @Column(name = "storage_key", length = 64)
    var storageKey: String? = null,

    @Column(name = "original_file_name", length = 255)
    var originalFileName: String? = null,

    @Column(name = "content_type", length = 150)
    var contentType: String? = null,

    @Column(name = "file_size")
    var fileSize: Long? = null,

    @Column(name = "submitted_at", nullable = false)
    var submittedAt: Instant = Instant.now(),

    @Column(nullable = false)
    var late: Boolean = false,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    var status: SubmissionStatus = SubmissionStatus.SUBMITTED,

    @Column
    var score: Int? = null,

    @Column(columnDefinition = "TEXT")
    var feedback: String? = null,

    @Column(name = "graded_at")
    var gradedAt: Instant? = null,

    @Column(name = "graded_by")
    var gradedBy: Long? = null,
) : BaseEntity()

enum class SubmissionStatus { SUBMITTED, GRADED, RETURNED }
