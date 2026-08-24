package uz.scorm.lms.app.v1.subject.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.FetchType
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import uz.scorm.lms.app.common.BaseEntity
import uz.scorm.lms.app.v1.program.model.Program
import uz.scorm.lms.app.v1.subjectcategory.model.SubjectCategory

@Entity
@Table(name = "subjects")
class Subject(

    @Column(nullable = false)
    var name: String = "",

    @Column(name = "name_en", length = 500)
    var nameEn: String? = null,

    @Column(name = "name_ru", length = 500)
    var nameRu: String? = null,

    @Column(name = "name_kaa", length = 500)
    var nameKaa: String? = null,

    @Column(name = "name_uz_cyrillic", length = 500)
    var nameUzCyrillic: String? = null,

    @Column(unique = true)
    var code: String? = null,

    @Column
    var credits: Int? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "subject_type", length = 30)
    var subjectType: SubjectType? = null,

    @Column(nullable = false)
    var active: Boolean = true,

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "program_id")
    var program: Program? = null,

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "subject_category_id")
    var subjectCategory: SubjectCategory? = null,

) : BaseEntity()

enum class SubjectType {
    PRACTICE,
    COURSE_WORK,
    STATE_ATTESTATION,
    GRADUATION_WORK,
}
