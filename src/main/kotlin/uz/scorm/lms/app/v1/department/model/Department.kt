package uz.scorm.lms.app.v1.department.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import uz.scorm.lms.app.common.BaseEntity
import uz.scorm.lms.app.v1.faculty.model.Faculty

@Entity
@Table(name = "departments")
class Department(

    @Column(nullable = false)
    var name: String = "",

    @Column
    var code: String? = null,

    @Column(nullable = false)
    var active: Boolean = true,

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "faculty_id")
    var faculty: Faculty? = null,

) : BaseEntity()
