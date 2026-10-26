package uz.scorm.lms.app.v1.syllabus.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.FetchType
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import uz.scorm.lms.app.common.BaseEntity

@Entity
@Table(name = "subject_syllabus_topics")
class SubjectSyllabusTopic(
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "syllabus_id", nullable = false)
    var syllabus: SubjectSyllabus,

    @Enumerated(EnumType.STRING)
    @Column(name = "topic_type", nullable = false, length = 20)
    var type: SyllabusTopicType,

    @Column(name = "sort_order", nullable = false)
    var sortOrder: Int,

    @Column(nullable = false, length = 500)
    var title: String,

    @Column(columnDefinition = "TEXT")
    var description: String? = null,

    /** Ixtiyoriy: soatlar fan bo'yicha o'quv rejada belgilanadi */
    @Column
    var hours: Int? = null,
) : BaseEntity() {
    /** Ko'p semestrli fanda mavzu qaysi qismga tegishli (1-qism — birinchi semestr); bir semestrli fanda null */
    @Column
    var part: Int? = null
}

/**
 * Mashg'ulot turlari (tartibi kursdagi bo'limlar tartibini ham belgilaydi):
 * THEORETICAL — nazariy (ma'ruza), PRACTICAL — amaliy, LABORATORY — laboratoriya, SEMINAR — seminar.
 */
enum class SyllabusTopicType { THEORETICAL, PRACTICAL, LABORATORY, SEMINAR }
