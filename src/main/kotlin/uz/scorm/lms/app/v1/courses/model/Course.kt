package uz.scorm.lms.app.v1.courses.model

import org.springframework.data.annotation.CreatedDate
import org.springframework.data.annotation.LastModifiedDate
import org.springframework.data.jpa.domain.support.AuditingEntityListener
import java.time.LocalDateTime
import jakarta.persistence.*
import org.hibernate.annotations.JdbcTypeCode
import org.hibernate.type.SqlTypes
import org.springframework.stereotype.Indexed
import uz.scorm.lms.app.common.BaseEntity

@Entity
@Table(name = "courses",indexes = [
    Index(name = "idx_course_user_id", columnList = "user_id"),
    Index(name = "idx_course_category_id", columnList = "category_id")
])
@EntityListeners(AuditingEntityListener::class)
data class Course(

    @Column
    val title: String? = null,

    @Column
    val slug: String? = null,

    @Column(name = "short_description", columnDefinition = "TEXT")
    val shortDescription: String? = null,

    @Column(name = "user_id")
    val userId: Long? = null,

    @Column(name = "category_id")
    val categoryId: Long? = null,

    @Column(name = "course_type")
    val courseType: String? = null,

    @Column
    val status: String? = null,

    @Column
    val level: String? = null,

    @Column
    val language: String? = null,

    @Column(name = "is_paid")
    val isPaid: Int? = null,

    @Column
    val price: Double? = null,

    @Column(name = "discount_flag")
    val discountFlag: Int? = null,

    @Column(name = "discounted_price")
    val discountedPrice: Double? = null,

    @Column(name = "meta_keywords", columnDefinition = "TEXT")
    val metaKeywords: String? = null,

    @Column(name = "meta_description", columnDefinition = "TEXT")
    val metaDescription: String? = null,

    @Column
    val thumbnail: String? = null,

    @Column
    val banner: String? = null,

    @Column
    val preview: String? = null,

    @Column(columnDefinition = "TEXT")
    val description: String? = null,

    @Column(columnDefinition = "TEXT")
    val requirements: String? = null,

    @Column(columnDefinition = "TEXT")
    val outcomes: String? = null,

    @Column(columnDefinition = "TEXT")
    val faqs: String? = null,

    @Column(name = "instructor_ids", columnDefinition = "TEXT")
    val instructorIds: String? = null,

//    @CreatedDate
//    @Column(name = "created_at", nullable = false, updatable = false)
//    val createdAt: LocalDateTime = LocalDateTime.now(),
//
//    @LastModifiedDate
//    @Column(name = "updated_at")
//    var updatedAt: LocalDateTime = LocalDateTime.now()
): BaseEntity() {

}