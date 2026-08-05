package uz.scorm.lms.app.v1.exam.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.Index
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import jakarta.persistence.UniqueConstraint
import uz.scorm.lms.app.common.BaseEntity
import uz.scorm.lms.app.v1.courses.model.CourseEnrollment
import uz.scorm.lms.app.v1.user.model.User
import java.math.BigDecimal
import java.time.Instant

@Entity
@Table(
    name = "exam_results",
    indexes = [
        Index(name = "idx_exam_result_session", columnList = "exam_session_id,graded_by"),
        Index(name = "idx_exam_result_enrollment", columnList = "enrollment_id,passed"),
    ],
    uniqueConstraints = [
        UniqueConstraint(name = "uk_exam_result_unique", columnNames = ["exam_session_id", "enrollment_id"]),
    ],
)
class ExamResult(
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "exam_session_id", nullable = false)
    var examSession: ExamSession,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "enrollment_id", nullable = false)
    var enrollment: CourseEnrollment,

    @Column(nullable = false)
    var score: BigDecimal = BigDecimal.ZERO,

    @Column(name = "total_score", nullable = false)
    var totalScore: BigDecimal = BigDecimal("100"),

    @Column(nullable = false)
    var percentage: Double = 0.0,

    @Column(nullable = false)
    var passed: Boolean = false,

    @Column(length = 2)
    var grade: String? = null,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "graded_by", nullable = false)
    var gradedBy: User,

    @Column(name = "grading_date", nullable = false)
    var gradingDate: Instant,

    @Column(columnDefinition = "TEXT")
    var comments: String? = null,
) : BaseEntity()