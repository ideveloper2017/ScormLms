package uz.scorm.lms.app.v1.forum.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import jakarta.persistence.UniqueConstraint
import uz.scorm.lms.app.common.BaseEntity
import uz.scorm.lms.app.v1.user.model.User
import java.time.Instant

@Entity
@Table(
    name = "course_forum_post_revisions",
    uniqueConstraints = [UniqueConstraint(
        name = "uk_forum_post_revision", columnNames = ["post_id", "revision_number"],
    )],
)
class CourseForumPostRevision(
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "post_id", nullable = false)
    var post: CourseForumPost,

    @Column(name = "revision_number", nullable = false)
    var revisionNumber: Int,

    @Column(nullable = false, columnDefinition = "TEXT")
    var body: String,

    @Column(name = "changed_at", nullable = false)
    var changedAt: Instant,

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "changed_by", nullable = false)
    var changedBy: User,
) : BaseEntity()
