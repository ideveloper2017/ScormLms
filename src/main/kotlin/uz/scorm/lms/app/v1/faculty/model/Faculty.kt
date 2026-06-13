package uz.scorm.lms.app.v1.faculty.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Table
import uz.scorm.lms.app.common.BaseEntity

@Entity
@Table(name = "faculties")
class Faculty(

    @Column(nullable = false)
    var name: String = "",

    @Column(unique = true)
    var code: String? = null,

    @Column(nullable = false)
    var active: Boolean = true,

) : BaseEntity()
