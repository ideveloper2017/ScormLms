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
import uz.scorm.lms.app.common.BaseEntity
import uz.scorm.lms.app.v1.subject.model.Subject

@Entity
@Table(
    name = "program_curriculum_subjects",
    indexes = [Index(name = "idx_curriculum_subject_order", columnList = "curriculum_version_id,semester,subject_name_snapshot")],
    // Unikallik: (reja, fan, semestr) — V84 dagi partial unique index (deleted = false)
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
) : BaseEntity() {
    /** Ishchi o'quv rejadagi T/r (masalan "1.09"); tanlov muqobillari bir raqamni bo'lishadi */
    @Column(name = "plan_row_number", length = 20)
    var planRowNumber: String? = null

    // Shu semestrdagi soatlar (reja belgilaydi): ma'ruza, amaliy, laboratoriya, seminar, kurs ishi
    @Column(name = "lecture_hours", nullable = false)
    var lectureHours: Int = 0

    @Column(name = "practical_hours", nullable = false)
    var practicalHours: Int = 0

    @Column(name = "laboratory_hours", nullable = false)
    var laboratoryHours: Int = 0

    @Column(name = "seminar_hours", nullable = false)
    var seminarHours: Int = 0

    @Column(name = "course_work_hours", nullable = false)
    var courseWorkHours: Int = 0

    /** Auditoriya jami: turlar yig'indisi yoki masofaviy shaklda turlarga bo'linmagan soat */
    @Column(name = "auditory_hours", nullable = false)
    var auditoryHours: Int = 0

    @Column(name = "self_study_hours", nullable = false)
    var selfStudyHours: Int = 0
}

enum class CurriculumPlanItemType {
    REQUIRED,
    ELECTIVE,
}

