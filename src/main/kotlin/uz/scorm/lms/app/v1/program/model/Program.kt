package uz.scorm.lms.app.v1.program.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import uz.scorm.lms.app.common.BaseEntity
import uz.scorm.lms.app.v1.department.model.Department

@Entity
@Table(name = "programs")
class Program(

    @Column(nullable = false)
    var name: String = "",

    @Column
    var code: String? = null,

    // BACHELOR, MASTER, PHD ...
    @Column(name = "degree_level")
    var degreeLevel: String? = null,

    @Column(nullable = false)
    var active: Boolean = true,

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "department_id")
    var department: Department? = null,

) : BaseEntity()
