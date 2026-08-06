package uz.scorm.lms.app.v1.quiz.model

import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.Index
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import jakarta.persistence.UniqueConstraint
import uz.scorm.lms.app.common.BaseEntity
import uz.scorm.lms.app.v1.user.model.User

@Entity
@Table(
    name = "course_quiz_proctors",
    uniqueConstraints = [UniqueConstraint(
        name = "uk_course_quiz_proctor",
        columnNames = ["quiz_id", "user_id"],
    )],
    indexes = [Index(name = "idx_course_quiz_proctor_user", columnList = "user_id,quiz_id")],
)
class CourseQuizProctor(
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "quiz_id", nullable = false)
    var quiz: CourseQuiz,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    var user: User,
) : BaseEntity()
