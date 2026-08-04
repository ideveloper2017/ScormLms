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

@Entity
@Table(
    name = "quiz_questions",
    indexes = [Index(name = "idx_quiz_question_course", columnList = "course_id,difficulty")],
)
class QuizQuestion(
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "course_id", nullable = false)
    var course: Course,

    @Column(nullable = false, columnDefinition = "TEXT")
    var text: String,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    var type: QuizQuestionType,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    var difficulty: QuizDifficulty = QuizDifficulty.MEDIUM,

    @Column(nullable = false)
    var points: Int = 1,

    @Column(name = "options_json", columnDefinition = "TEXT")
    var optionsJson: String? = null,

    @Column(name = "correct_answer", nullable = false, columnDefinition = "TEXT")
    var correctAnswer: String,

    @Column(columnDefinition = "TEXT")
    var explanation: String? = null,
) : BaseEntity()

enum class QuizQuestionType { SINGLE_CHOICE, TRUE_FALSE, SHORT_ANSWER }

enum class QuizDifficulty { EASY, MEDIUM, HARD }
