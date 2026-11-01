package uz.scorm.lms.app.v1.syllabus.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import uz.scorm.lms.app.common.BaseEntity

/** O'quv dasturi moduli: nomi, qisqa ma'lumoti va darslari (darslar — [SubjectSyllabusTopic], mashg'ulot turi bilan) */
@Entity
@Table(name = "subject_syllabus_modules")
class SubjectSyllabusModule(
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "syllabus_id", nullable = false)
    var syllabus: SubjectSyllabus,

    @Column(name = "sort_order", nullable = false)
    var sortOrder: Int,

    @Column(nullable = false, length = 255)
    var name: String,

    @Column(length = 500)
    var description: String? = null,
) : BaseEntity()
