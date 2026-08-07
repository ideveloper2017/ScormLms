package uz.scorm.lms.app.v1.courses.model

import org.springframework.data.jpa.domain.support.AuditingEntityListener
import jakarta.persistence.*
import uz.scorm.lms.app.common.BaseEntity
import uz.scorm.lms.app.v1.subject.model.Subject
import java.time.Instant
import java.time.LocalDate

@Entity
@Table(name = "courses",indexes = [
    Index(name = "idx_course_user_id", columnList = "user_id"),
    Index(name = "idx_course_category_id", columnList = "category_id")
])
@EntityListeners(AuditingEntityListener::class)
class Course(

    @Column
    var title: String? = null,

    @Column
    var slug: String? = null,

    @Column(name = "short_description", columnDefinition = "TEXT")
    var shortDescription: String? = null,

    @Column(name = "user_id")
    var userId: Long? = null,

    @Column(name = "category_id")
    var categoryId: Long? = null,

    @Column(name = "course_type")
    var courseType: String? = null,

    @Column
    var status: String? = CourseStatus.DRAFT.name,

    @Column
    var level: String? = null,

    @Column
    var language: String? = null,

    @Column(name = "subject_name")
    var subjectName: String? = null,

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "subject_id")
    var subject: Subject? = null,

    @Column(name = "group_name")
    var groupName: String? = null,

    @Column(name = "start_date")
    var startDate: LocalDate? = null,

    @Column(name = "end_date")
    var endDate: LocalDate? = null,

    @Column(name = "published_at")
    var publishedAt: Instant? = null,

    @Column(name = "archived_at")
    var archivedAt: Instant? = null,

    @Column(name = "is_paid")
    var isPaid: Int? = null,

    @Column
    var price: Double? = null,

    @Column(name = "discount_flag")
    var discountFlag: Int? = null,

    @Column(name = "discounted_price")
    var discountedPrice: Double? = null,

    @Column(name = "meta_keywords", columnDefinition = "TEXT")
    var metaKeywords: String? = null,

    @Column(name = "meta_description", columnDefinition = "TEXT")
    var metaDescription: String? = null,

    @Column
    var thumbnail: String? = null,

    @Column
    var banner: String? = null,

    @Column
    var preview: String? = null,

    @Column(columnDefinition = "TEXT")
    var description: String? = null,

    @Column(columnDefinition = "TEXT")
    var requirements: String? = null,

    @Column(columnDefinition = "TEXT")
    var outcomes: String? = null,

    @Column(columnDefinition = "TEXT")
    var faqs: String? = null,

    @Column(name = "instructor_ids", columnDefinition = "TEXT")
    var instructorIds: String? = null,

//    @CreatedDate
//    @Column(name = "created_at", nullable = false, updatable = false)
//    val createdAt: LocalDateTime = LocalDateTime.now(),
//
//    @LastModifiedDate
//    @Column(name = "updated_at")
//    var updatedAt: LocalDateTime = LocalDateTime.now()
): BaseEntity() {
    @get:Transient
    val name: String
        get() = title.orEmpty()
}

enum class CourseStatus {
    DRAFT,
    PUBLISHED,
    ARCHIVED,
}
