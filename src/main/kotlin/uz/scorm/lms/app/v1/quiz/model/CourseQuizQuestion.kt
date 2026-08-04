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

@Entity
@Table(
    name = "course_quiz_questions",
    uniqueConstraints = [UniqueConstraint(name = "uk_course_quiz_question", columnNames = ["quiz_id", "question_id"])],
    indexes = [Index(name = "idx_course_quiz_question_order", columnList = "quiz_id,position")],
)
class CourseQuizQuestion(
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "quiz_id", nullable = false)
    var quiz: CourseQuiz,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "question_id", nullable = false)
    var question: QuizQuestion,

    @Column(nullable = false)
    var position: Int,
) : BaseEntity()
