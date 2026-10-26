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
import uz.scorm.lms.app.v1.subject.model.Subject

/**
 * O'quv dasturi (namunaviy) — fan bo'yicha umumiy, uzoq muddatli hujjat. Bir fan va til uchun bitta.
 * Undan o'quv yili va semestr uchun fan dasturlari (ishchi dastur — [SubjectSyllabus]) yaratiladi.
 */
@Entity
@Table(name = "subject_model_programs")
class SubjectModelProgram(
    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "subject_id", nullable = false)
    var subject: Subject,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    var language: SyllabusLanguage,

    @Column(nullable = false, length = 500)
    var name: String,

    @Column(name = "short_description", nullable = false, length = 2000)
    var shortDescription: String,

    @Column(columnDefinition = "TEXT")
    var requirements: String? = null,

    @Column(name = "full_description", nullable = false, columnDefinition = "TEXT")
    var fullDescription: String,

    @Column(nullable = false)
    var active: Boolean = true,
) : BaseEntity()
