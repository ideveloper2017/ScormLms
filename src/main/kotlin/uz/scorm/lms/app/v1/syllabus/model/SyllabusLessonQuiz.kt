package uz.scorm.lms.app.v1.syllabus.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.FetchType
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import uz.scorm.lms.app.common.BaseEntity

/**
 * Dars resursi: Test (savollar to'plami, vaqt bilan) yoki Savol/Javob (bitta savol, urinishlar bilan).
 * Savollar JSON ro'yxat sifatida saqlanadi; kursga sinxronlashda kurs testiga aylanadi.
 * [version] har tahrirda oshadi — kursdagi nusxa shu bo'yicha yangilanadi.
 */
@Entity
@Table(name = "subject_syllabus_lesson_quizzes")
class SyllabusLessonQuiz(
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "topic_id", nullable = false)
    var topic: SubjectSyllabusTopic,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    var kind: SyllabusQuizKind,

    @Column(nullable = false, length = 255)
    var title: String,

    @Column(columnDefinition = "TEXT")
    var instructions: String? = null,

    @Column(name = "duration_minutes", nullable = false)
    var durationMinutes: Int,

    @Column(name = "allowed_attempts", nullable = false)
    var allowedAttempts: Int,

    @Column(name = "passing_percentage", nullable = false)
    var passingPercentage: Int,

    @Column(name = "questions_json", nullable = false, columnDefinition = "TEXT")
    var questionsJson: String,

    @Column(nullable = false)
    var position: Int = 1,

    @Column(nullable = false)
    var version: Int = 1,
) : BaseEntity()

/** TEST — darsga bitta, vaqtli test; QUESTION — Savol/Javob: bitta savol, bir necha urinish */
enum class SyllabusQuizKind { TEST, QUESTION }
