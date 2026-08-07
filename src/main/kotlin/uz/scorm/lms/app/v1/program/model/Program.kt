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

    @Column(name = "distance_enabled", nullable = false)
    var distanceEnabled: Boolean = false,

    @Column(name = "information_technology_program", nullable = false)
    var informationTechnologyProgram: Boolean = false,

    @Column(name = "education_language", nullable = false, length = 10)
    var educationLanguage: String = "uz",

    @Column(name = "distance_admission_limit")
    var distanceAdmissionLimit: Int? = null,

    @Column(name = "license_reference", length = 200)
    var licenseReference: String? = null,

    @Column(name = "full_time_duration_months")
    var fullTimeDurationMonths: Int? = null,

    @Column(name = "distance_duration_months")
    var distanceDurationMonths: Int? = null,

    @Column(name = "full_time_available")
    var fullTimeAvailable: Boolean? = null,

    @Column(name = "full_time_basis_reference", length = 500)
    var fullTimeBasisReference: String? = null,

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "department_id")
    var department: Department? = null,

) : BaseEntity()
