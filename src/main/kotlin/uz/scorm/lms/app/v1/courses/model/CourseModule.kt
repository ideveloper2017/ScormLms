package uz.scorm.lms.app.v1.courses.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.Index
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import uz.scorm.lms.app.common.BaseEntity
import java.time.Instant

@Entity
@Table(
    name = "course_modules",
    indexes = [Index(name = "idx_course_module_order", columnList = "course_id,position")],
)
class CourseModule(
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "course_id", nullable = false)
    var course: Course,

    @Column(nullable = false)
    var title: String,

    @Column(columnDefinition = "TEXT")
    var description: String? = null,

    @Column(nullable = false)
    var position: Int = 1,

    @Column(nullable = false, length = 20)
    var status: String = LearningItemStatus.DRAFT.name,

    @Column(name = "published_at")
    var publishedAt: Instant? = null,

    // Fan dasturi mavzusidan yaratilgan modul: THEORETICAL (nazariy) / PRACTICAL (amaliy) va rejadagi soat
    @Column(name = "topic_type", length = 20)
    var topicType: String? = null,

    @Column(name = "planned_hours")
    var plannedHours: Int? = null,

    // Bo'lim yaratilgan o'quv dasturi mavzusi (sinxronlash uchun); mavzu o'chirilsa null bo'ladi
    @Column(name = "syllabus_topic_id")
    var syllabusTopicId: Long? = null,
) : BaseEntity()

enum class LearningItemStatus {
    DRAFT,
    PUBLISHED,
}
