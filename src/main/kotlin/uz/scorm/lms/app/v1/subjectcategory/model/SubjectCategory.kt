package uz.scorm.lms.app.v1.subjectcategory.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Table
import uz.scorm.lms.app.common.BaseEntity

@Entity
@Table(name = "subject_categories")
class SubjectCategory(
    @Column(nullable = false, length = 200)
    var name: String = "",

    @Column(unique = true, length = 50)
    var code: String? = null,

    @Column(name = "name_en", length = 200)
    var nameEn: String? = null,

    @Column(name = "name_ru", length = 200)
    var nameRu: String? = null,

    @Column(name = "name_kaa", length = 200)
    var nameKaa: String? = null,

    @Column(name = "name_uz_cyrillic", length = 200)
    var nameUzCyrillic: String? = null,

    @Column(nullable = false)
    var active: Boolean = true,
) : BaseEntity()
