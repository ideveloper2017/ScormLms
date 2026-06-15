package uz.scorm.lms.app.v1.teacher.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.JoinColumn
import jakarta.persistence.JoinTable
import jakarta.persistence.ManyToMany
import jakarta.persistence.ManyToOne
import jakarta.persistence.OneToOne
import jakarta.persistence.Table
import uz.scorm.lms.app.common.BaseEntity
import uz.scorm.lms.app.v1.department.model.Department
import uz.scorm.lms.app.v1.subject.model.Subject
import uz.scorm.lms.app.v1.user.model.User

@Entity
@Table(name = "teachers")
class Teacher(

    @Column(name = "full_name", nullable = false)
    var fullName: String = "",

    @Column
    var phone: String? = null,

    @Column
    var email: String? = null,

    // ilmiy daraja: PhD, DSc ...
    @Column(name = "academic_degree")
    var academicDegree: String? = null,

    // ilmiy unvon: dotsent, professor ...
    @Column(name = "academic_rank")
    var academicRank: String? = null,

    // lavozim: assistent, katta o'qituvchi ...
    @Column
    var position: String? = null,

    @Column(nullable = false)
    var active: Boolean = true,

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "department_id")
    var department: Department? = null,

    // Ixtiyoriy login akkaunti (role = teacher)
    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id")
    var user: User? = null,

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "teacher_subjects",
        joinColumns = [JoinColumn(name = "teacher_id")],
        inverseJoinColumns = [JoinColumn(name = "subject_id")]
    )
    var subjects: MutableSet<Subject> = mutableSetOf(),

) : BaseEntity()
