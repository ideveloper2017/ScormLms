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
import uz.scorm.lms.app.v1.courses.model.CourseModule
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

    /**
     * Har urinishga savol bankidan nechta savol tushadi. null — testga biriktirilgan barcha savollar;
     * N — har talabaga qiyinlik bo'yicha mutanosib N ta tasodifiy savol ([uz.scorm.lms.app.v1.quiz.service.QuizQuestionDraw]).
     */
    @Column(name = "questions_per_attempt")
    var questionsPerAttempt: Int? = null,
) : BaseEntity() {
    /** Test qaysi darsda (o'quv dasturi darsidan kelgan testlar uchun) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "module_id")
    var module: CourseModule? = null

    /** O'quv dasturi darsining Test yoki Savol/Javob resursi va kursga ko'chirilgan versiyasi */
    @Column(name = "syllabus_quiz_id")
    var syllabusQuizId: Long? = null

    @Column(name = "syllabus_quiz_version")
    var syllabusQuizVersion: Int? = null
}

enum class QuizStatus { DRAFT, PUBLISHED, CLOSED }
