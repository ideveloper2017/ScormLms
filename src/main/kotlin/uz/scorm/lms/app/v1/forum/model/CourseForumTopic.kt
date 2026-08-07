package uz.scorm.lms.app.v1.forum.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.FetchType
import jakarta.persistence.Index
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import jakarta.persistence.Version
import uz.scorm.lms.app.common.BaseEntity
import uz.scorm.lms.app.v1.courses.model.Course
import uz.scorm.lms.app.v1.user.model.User
import java.time.Instant

enum class ForumTopicStatus { OPEN, LOCKED, ARCHIVED }

@Entity
@Table(
    name = "course_forum_topics",
    indexes = [Index(name = "idx_forum_topic_course_activity", columnList = "course_id,pinned,last_activity_at")],
)
class CourseForumTopic(
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "course_id", nullable = false)
    var course: Course,

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "author_id", nullable = false)
    var author: User,

    @Column(nullable = false, length = 200)
    var title: String,

    @Column(nullable = false, columnDefinition = "TEXT")
    var body: String,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    var status: ForumTopicStatus = ForumTopicStatus.OPEN,

    @Column(nullable = false)
    var pinned: Boolean = false,

    @Column(name = "reply_count", nullable = false)
    var replyCount: Int = 0,

    @Column(name = "last_activity_at", nullable = false)
    var lastActivityAt: Instant = Instant.now(),

    @Column(name = "status_updated_at")
    var statusUpdatedAt: Instant? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "status_updated_by")
    var statusUpdatedBy: User? = null,

    @Version
    @Column(name = "version", nullable = false)
    var entityVersion: Long = 0,
) : BaseEntity()
