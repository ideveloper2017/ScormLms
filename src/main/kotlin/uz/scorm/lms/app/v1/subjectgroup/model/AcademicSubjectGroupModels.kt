package uz.scorm.lms.app.v1.subjectgroup.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import jakarta.persistence.UniqueConstraint
import uz.scorm.lms.app.common.DateAudit
import uz.scorm.lms.app.v1.curriculum.model.ProgramCurriculumSubject
import uz.scorm.lms.app.v1.student.model.StudentProfile

@Entity
@Table(
    name = "academic_subject_groups",
    uniqueConstraints = [UniqueConstraint(
        name = "uq_academic_subject_group_code",
        columnNames = ["curriculum_subject_id", "code"],
    )],
)
class AcademicSubjectGroup(
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "curriculum_subject_id", nullable = false)
    var curriculumSubject: ProgramCurriculumSubject,

    @Column(nullable = false, length = 100)
    var code: String,

    @Column(nullable = false, length = 200)
    var name: String,

    @Column(nullable = false)
    var capacity: Int = 30,

    @Column(nullable = false)
    var active: Boolean = true,

    @Column(nullable = false)
    var deleted: Boolean = false,

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null,
) : DateAudit()

@Entity
@Table(
    name = "academic_subject_group_memberships",
    uniqueConstraints = [UniqueConstraint(
        name = "uq_academic_subject_group_member",
        columnNames = ["subject_group_id", "student_id"],
    )],
)
class AcademicSubjectGroupMembership(
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "subject_group_id", nullable = false)
    var subjectGroup: AcademicSubjectGroup,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "curriculum_subject_id", nullable = false)
    var curriculumSubject: ProgramCurriculumSubject,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_id", nullable = false)
    var student: StudentProfile,

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null,
) : DateAudit()
