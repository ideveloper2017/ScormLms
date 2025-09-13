package uz.scorm.lms.app.v1.liveclass.model

import org.springframework.data.annotation.CreatedDate
import org.springframework.data.annotation.LastModifiedDate
import org.springframework.data.jpa.domain.support.AuditingEntityListener
import java.time.LocalDateTime
import jakarta.persistence.*
import uz.scorm.lms.app.common.BaseEntity

@Entity
@Table(name = "live_classes")
@EntityListeners(AuditingEntityListener::class)
data class LiveClass(

    @Column(name = "user_id")
    val userId: Long? = null,

    @Column(name = "course_id")
    val courseId: Long? = null,

    @Column(name = "class_topic")
    val classTopic: String? = null,

    @Column
    val provider: String? = null,

    @Column(name = "class_date_and_time")
    val classDateAndTime: LocalDateTime? = null,

    @Column(name = "additional_info", columnDefinition = "TEXT")
    val additionalInfo: String? = null,

    @Column(columnDefinition = "TEXT")
    val note: String? = null,
) : BaseEntity(){

}