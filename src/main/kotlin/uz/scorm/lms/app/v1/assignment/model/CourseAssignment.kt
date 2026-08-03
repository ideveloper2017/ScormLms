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
import uz.scorm.lms.app.common.BaseEntity
import uz.scorm.lms.app.v1.courses.model.Course
import java.time.Instant

@Entity
@Table(
    name = "course_assignments",
    indexes = [Index(name = "idx_course_assignment_course_due", columnList = "course_id,due_at")],
)
class CourseAssignment(
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "course_id", nullable = false)
    var course: Course,

    @Column(nullable = false, length = 255)
    var title: String,

    @Column(nullable = false, columnDefinition = "TEXT")
    var description: String = "",

    @Column(nullable = false, columnDefinition = "TEXT")
    var instructions: String = "",

    @Column(name = "due_at", nullable = false)
    var dueAt: Instant,

    @Column(name = "max_score", nullable = false)
    var maxScore: Int = 100,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    var priority: AssignmentPriority = AssignmentPriority.MEDIUM,

    @Enumerated(EnumType.STRING)
    @Column(name = "submission_type", nullable = false, length = 20)
    var submissionType: AssignmentSubmissionType = AssignmentSubmissionType.BOTH,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    var status: AssignmentStatus = AssignmentStatus.DRAFT,

    @Column(name = "published_at")
    var publishedAt: Instant? = null,
) : BaseEntity()

enum class AssignmentPriority { LOW, MEDIUM, HIGH }

enum class AssignmentSubmissionType { FILE, TEXT, BOTH }

enum class AssignmentStatus { DRAFT, PUBLISHED, CLOSED }
