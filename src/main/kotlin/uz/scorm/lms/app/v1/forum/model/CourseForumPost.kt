package uz.scorm.lms.app.v1.forum.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.Index
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import uz.scorm.lms.app.common.BaseEntity
import uz.scorm.lms.app.v1.user.model.User
import java.time.Instant

@Entity
@Table(
    name = "course_forum_posts",
    indexes = [
        Index(name = "idx_forum_post_topic_created", columnList = "topic_id,created_at"),
        Index(name = "idx_forum_post_reply_to", columnList = "reply_to_id"),
    ],
)
class CourseForumPost(
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "topic_id", nullable = false)
    var topic: CourseForumTopic,

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "author_id", nullable = false)
    var author: User,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reply_to_id")
    var replyTo: CourseForumPost? = null,

    @Column(nullable = false, columnDefinition = "TEXT")
    var body: String,

    @Column(name = "revision_number", nullable = false)
    var revisionNumber: Int = 1,

    @Column(name = "edited_at")
    var editedAt: Instant? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "edited_by")
    var editedBy: User? = null,

    @Column(name = "hidden_at")
    var hiddenAt: Instant? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hidden_by")
    var hiddenBy: User? = null,

    @Column(name = "hidden_reason", length = 1000)
    var hiddenReason: String? = null,
) : BaseEntity()
