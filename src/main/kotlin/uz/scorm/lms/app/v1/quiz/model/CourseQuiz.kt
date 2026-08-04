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
import uz.scorm.lms.app.common.BaseEntity
import uz.scorm.lms.app.v1.courses.model.Course
import java.time.Instant

@Entity
@Table(
    name = "course_quizzes",
    indexes = [Index(name = "idx_course_quiz_course_window", columnList = "course_id,opens_at,closes_at")],
)
class CourseQuiz(
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "course_id", nullable = false)
    var course: Course,

    @Column(nullable = false, length = 255)
    var title: String,

    @Column(nullable = false, columnDefinition = "TEXT")
    var instructions: String = "",

    @Column(name = "opens_at", nullable = false)
    var opensAt: Instant,

    @Column(name = "closes_at", nullable = false)
    var closesAt: Instant,

    @Column(name = "duration_minutes", nullable = false)
    var durationMinutes: Int,

    @Column(name = "allowed_attempts", nullable = false)
    var allowedAttempts: Int = 1,

    @Column(name = "passing_percentage", nullable = false)
    var passingPercentage: Int = 60,

    @Column(name = "shuffle_questions", nullable = false)
    var shuffleQuestions: Boolean = true,

    @Column(name = "show_result", nullable = false)
    var showResult: Boolean = true,

    @Column(nullable = false)
    var proctoring: Boolean = false,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    var status: QuizStatus = QuizStatus.DRAFT,

    @Column(name = "published_at")
    var publishedAt: Instant? = null,
) : BaseEntity()

enum class QuizStatus { DRAFT, PUBLISHED, CLOSED }
