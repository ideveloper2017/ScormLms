package uz.scorm.lms.app.v1.courses.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.Index
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import uz.scorm.lms.app.common.BaseEntity

/**
 * Kurs moduli (o'quv dasturidagi kabi): ichida darslar ([CourseModule]), darslar ichida materiallar.
 * Dastur modulidan yaratilgani nomi va tartibi sinxronlashda dasturdan olinadi.
 */
@Entity
@Table(
    name = "course_units",
    indexes = [Index(name = "idx_course_unit_order", columnList = "course_id,position")],
)
class CourseUnit(
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "course_id", nullable = false)
    var course: Course,

    @Column(nullable = false)
    var title: String,

    @Column(columnDefinition = "TEXT")
    var description: String? = null,

    @Column(nullable = false)
    var position: Int = 1,

    // Dastur moduli o'chirilsa null bo'ladi; bo'sh qolgan modul sinxronlashda olib tashlanadi
    @Column(name = "syllabus_module_id")
    var syllabusModuleId: Long? = null,

    @Column(name = "from_syllabus", nullable = false)
    var fromSyllabus: Boolean = syllabusModuleId != null,
) : BaseEntity()
