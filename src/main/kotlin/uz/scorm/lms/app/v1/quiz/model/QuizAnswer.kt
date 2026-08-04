package uz.scorm.lms.app.v1.quiz.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.Index
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import jakarta.persistence.UniqueConstraint
import uz.scorm.lms.app.common.BaseEntity
import java.time.Instant

@Entity
@Table(
    name = "quiz_answers",
    uniqueConstraints = [UniqueConstraint(name = "uk_quiz_answer", columnNames = ["attempt_id", "question_id"])],
    indexes = [Index(name = "idx_quiz_answer_attempt", columnList = "attempt_id")],
)
class QuizAnswer(
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "attempt_id", nullable = false)
    var attempt: QuizAttempt,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "question_id", nullable = false)
    var question: QuizQuestion,

    @Column(nullable = false, columnDefinition = "TEXT")
    var answer: String,

    @Column(name = "is_correct", nullable = false)
    var correct: Boolean = false,

    @Column(name = "awarded_points", nullable = false)
    var awardedPoints: Int = 0,

    @Column(name = "answered_at", nullable = false)
    var answeredAt: Instant = Instant.now(),
) : BaseEntity()
