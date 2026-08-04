package uz.scorm.lms.app.v1.quiz.model

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
    name = "quiz_attempts",
    uniqueConstraints = [UniqueConstraint(
        name = "uk_quiz_attempt_number",
        columnNames = ["quiz_id", "enrollment_id", "attempt_number"],
    )],
    indexes = [
        Index(name = "idx_quiz_attempt_quiz", columnList = "quiz_id,submitted_at"),
        Index(name = "idx_quiz_attempt_enrollment", columnList = "enrollment_id,status"),
    ],
)
class QuizAttempt(
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "quiz_id", nullable = false)
    var quiz: CourseQuiz,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "enrollment_id", nullable = false)
    var enrollment: CourseEnrollment,

    @Column(name = "attempt_number", nullable = false)
    var attemptNumber: Int,

    @Column(name = "started_at", nullable = false)
    var startedAt: Instant,

    @Column(name = "expires_at", nullable = false)
    var expiresAt: Instant,

    @Column(name = "submitted_at")
    var submittedAt: Instant? = null,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    var status: QuizAttemptStatus = QuizAttemptStatus.IN_PROGRESS,

    @Column(name = "question_order", nullable = false, columnDefinition = "TEXT")
    var questionOrder: String,

    @Column(nullable = false)
    var score: Int = 0,

    @Column(name = "total_points", nullable = false)
    var totalPoints: Int = 0,

    @Column(nullable = false)
    var percentage: Double = 0.0,

    @Column(nullable = false)
    var passed: Boolean = false,

    @Column(name = "duration_seconds", nullable = false)
    var durationSeconds: Int = 0,
) : BaseEntity()

enum class QuizAttemptStatus { IN_PROGRESS, SUBMITTED, TIMED_OUT }
