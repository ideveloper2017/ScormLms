package uz.scorm.lms.app.v1.curriculum.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.FetchType
import jakarta.persistence.Index
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import jakarta.persistence.UniqueConstraint
import uz.scorm.lms.app.common.BaseEntity
import uz.scorm.lms.app.v1.subject.model.Subject

@Entity
@Table(
    name = "program_curriculum_subjects",
    indexes = [Index(name = "idx_curriculum_subject_order", columnList = "curriculum_version_id,semester,subject_name_snapshot")],
    uniqueConstraints = [UniqueConstraint(name = "uq_curriculum_subject", columnNames = ["curriculum_version_id", "subject_id"])],
)
class ProgramCurriculumSubject(
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "curriculum_version_id", nullable = false)
    var curriculumVersion: ProgramCurriculumVersion,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id")
    var subject: Subject?,

    @Column(name = "subject_code_snapshot", nullable = false, length = 100)
    var subjectCodeSnapshot: String,

    @Column(name = "subject_name_snapshot", nullable = false, length = 500)
    var subjectNameSnapshot: String,

    @Column(name = "credits_snapshot", nullable = false)
    var creditsSnapshot: Int,

    @Column(nullable = false)
    var semester: Int,

    @Enumerated(EnumType.STRING)
    @Column(name = "plan_item_type", nullable = false, length = 20)
    var planItemType: CurriculumPlanItemType,
) : BaseEntity()

enum class CurriculumPlanItemType {
    REQUIRED,
    ELECTIVE,
}

