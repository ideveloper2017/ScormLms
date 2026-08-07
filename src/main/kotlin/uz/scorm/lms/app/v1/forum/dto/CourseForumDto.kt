package uz.scorm.lms.app.v1.forum.dto

import uz.scorm.lms.app.v1.forum.model.ForumTopicStatus
import java.time.Instant

data class ForumTopicDto(
    val id: Long,
    val courseId: Long,
    val title: String,
    val body: String,
    val status: String,
    val pinned: Boolean,
    val replyCount: Int,
    val authorId: Long,
    val authorName: String,
    val createdAt: Instant?,
    val lastActivityAt: Instant,
    val canModerate: Boolean,
)

data class ForumPostDto(
    val id: Long,
    val topicId: Long,
    val authorId: Long,
    val authorName: String,
    val replyToId: Long?,
    val replyToAuthorName: String?,
    val body: String?,
    val revisionNumber: Int,
    val editedAt: Instant?,
    val hidden: Boolean,
    val hiddenAt: Instant?,
    val hiddenReason: String?,
    val createdAt: Instant?,
    val canEdit: Boolean,
    val canHide: Boolean,
)

data class ForumTopicPageDto(
    val items: List<ForumTopicDto>,
    val page: Int,
    val size: Int,
    val totalElements: Long,
    val totalPages: Int,
    val canCreateTopic: Boolean,
    val canModerate: Boolean,
)

data class ForumPostPageDto(
    val topic: ForumTopicDto,
    val posts: List<ForumPostDto>,
    val page: Int,
    val size: Int,
    val totalElements: Long,
    val totalPages: Int,
    val canReply: Boolean,
)

data class ForumPostRevisionDto(
    val revisionNumber: Int,
    val body: String,
    val changedAt: Instant,
    val changedBy: Long,
    val changedByName: String,
)

data class ForumTopicCreateRequest(val title: String, val body: String)
data class ForumPostCreateRequest(val body: String, val replyToId: Long? = null)
data class ForumPostUpdateRequest(val body: String)
data class ForumTopicModerationRequest(val status: ForumTopicStatus? = null, val pinned: Boolean? = null)
data class ForumPostHideRequest(val reason: String)
