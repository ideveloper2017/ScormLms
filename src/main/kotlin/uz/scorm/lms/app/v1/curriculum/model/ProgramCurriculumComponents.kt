package uz.scorm.lms.app.v1.curriculum.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.FetchType
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import uz.scorm.lms.app.common.BaseEntity

/** Rejadagi fan bo'lmagan qism: malakaviy amaliyot yoki yakuniy davlat attestatsiyasi. */
@Entity
@Table(name = "program_curriculum_components")
class ProgramCurriculumComponent(
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "curriculum_version_id", nullable = false)
    var curriculumVersion: ProgramCurriculumVersion,

    @Enumerated(EnumType.STRING)
    @Column(name = "component_type", nullable = false, length = 30)
    var type: CurriculumComponentType,

    @Column(nullable = false, length = 500)
    var name: String,

    @Column(nullable = false)
    var semester: Int,

    @Column(nullable = false)
    var credits: Int = 0,

    @Column(nullable = false)
    var hours: Int = 0,

    @Column
    var weeks: Int? = null,
) : BaseEntity()

enum class CurriculumComponentType {
    /** Malakaviy amaliyot (ishlab chiqarish va bitiruv oldi amaliyotlar) */
    PRACTICE,
    /** Yakuniy davlat attestatsiyasi (bitiruv malakaviy ishi himoyasi) */
    STATE_ATTESTATION,
}

/**
 * "I. O'quv jarayoni jadvali" — kursning 52 haftasi: FT (fanlarni tanlash), A (attestatsiya), T (ta'til),
 * M (malakaviy amaliyot), B (bitiruv malakaviy ishi), G (GPA hisoblash); bo'sh — nazariy ta'lim.
 */
@Entity
@Table(name = "program_curriculum_schedule")
class ProgramCurriculumScheduleRow(
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "curriculum_version_id", nullable = false)
    var curriculumVersion: ProgramCurriculumVersion,

    @Column(nullable = false)
    var course: Int,

    /** Haftalar kodlari vergul bilan, 1-haftadan boshlab */
    @Column(nullable = false, length = 1000)
    var weeks: String,
) : BaseEntity()
