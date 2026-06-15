package uz.scorm.lms.app.v1.subject.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import uz.scorm.lms.app.common.BaseEntity
import uz.scorm.lms.app.v1.program.model.Program

@Entity
@Table(name = "subjects")
class Subject(

    @Column(nullable = false)
    var name: String = "",

    @Column(unique = true)
    var code: String? = null,

    @Column
    var credits: Int? = null,

    @Column(nullable = false)
    var active: Boolean = true,

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "program_id")
    var program: Program? = null,

) : BaseEntity()
