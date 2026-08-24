package uz.scorm.lms.app.v1.forum.repository

import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.EntityGraph
import org.springframework.data.jpa.repository.JpaRepository
import uz.scorm.lms.app.v1.forum.model.CourseForumPost
import uz.scorm.lms.app.v1.forum.model.CourseForumPostRevision
import uz.scorm.lms.app.v1.forum.model.CourseForumTopic
import uz.scorm.lms.app.v1.forum.model.ForumTopicStatus

interface CourseForumTopicRepository : JpaRepository<CourseForumTopic, Long> {
    @EntityGraph(attributePaths = ["course", "author"])
    fun findAllByCourseIdAndDeletedFalseOrderByPinnedDescLastActivityAtDesc(
        courseId: Long,
        pageable: Pageable,
    ): Page<CourseForumTopic>

    @EntityGraph(attributePaths = ["course", "author"])
    fun findAllByCourseIdAndStatusInAndDeletedFalseOrderByPinnedDescLastActivityAtDesc(
        courseId: Long,
        statuses: Collection<ForumTopicStatus>,
        pageable: Pageable,
    ): Page<CourseForumTopic>

    @EntityGraph(attributePaths = ["course", "author"])
    fun findByIdAndDeletedFalse(id: Long): CourseForumTopic?
}

interface CourseForumPostRepository : JpaRepository<CourseForumPost, Long> {
    @EntityGraph(attributePaths = ["topic", "topic.course", "author", "replyTo"])
    fun findAllByDeletedFalseOrderByCreatedAtDesc(): List<CourseForumPost>

    @EntityGraph(attributePaths = ["author", "replyTo", "replyTo.author"])
    fun findAllByTopicIdAndDeletedFalseOrderByCreatedAtAsc(
        topicId: Long,
        pageable: Pageable,
    ): Page<CourseForumPost>

    @EntityGraph(attributePaths = ["topic", "topic.course", "author", "replyTo"])
    fun findByIdAndDeletedFalse(id: Long): CourseForumPost?
}

interface CourseForumPostRevisionRepository : JpaRepository<CourseForumPostRevision, Long> {
    @EntityGraph(attributePaths = ["changedBy"])
    fun findAllByPostIdAndDeletedFalseOrderByRevisionNumberDesc(postId: Long): List<CourseForumPostRevision>
}
