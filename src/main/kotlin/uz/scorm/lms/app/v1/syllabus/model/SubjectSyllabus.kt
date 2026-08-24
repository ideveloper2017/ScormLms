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

@Entity
@Table(name = "subject_syllabi")
class SubjectSyllabus(
    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "subject_id", nullable = false)
    var subject: Subject,

    @Column(nullable = false, length = 500)
    var name: String,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    var language: SyllabusLanguage,

    @Column(name = "short_description", nullable = false, length = 2000)
    var shortDescription: String,

    @Column(columnDefinition = "TEXT")
    var requirements: String? = null,

    @Column(name = "full_description", nullable = false, columnDefinition = "TEXT")
    var fullDescription: String,

    @Column(nullable = false)
    var active: Boolean = true,
) : BaseEntity()

enum class SyllabusLanguage { UZ, EN, RU, KAA, UZ_CYRILLIC }
