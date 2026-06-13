package uz.scorm.lms.app.v1.group.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import uz.scorm.lms.app.common.BaseEntity
import uz.scorm.lms.app.v1.program.model.Program

@Entity
// NOTE: "groups" is a reserved keyword in PostgreSQL — use a safe table name.
@Table(name = "study_groups")
class Group(

    @Column(nullable = false)
    var name: String = "",

    // e.g. "2024-2025"
    @Column(name = "education_year")
    var educationYear: String? = null,

    // uz / ru / en
    @Column
    var language: String? = null,

    @Column(nullable = false)
    var active: Boolean = true,

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "program_id")
    var program: Program? = null,

) : BaseEntity()
