package uz.scorm.lms.app.v1.forum.service

import org.springframework.data.domain.PageRequest
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.courses.model.Course
import uz.scorm.lms.app.v1.courses.model.CourseEnrollmentStatus
import uz.scorm.lms.app.v1.courses.repository.CourseEnrollmentRepository
import uz.scorm.lms.app.v1.courses.service.CourseAccessService
import uz.scorm.lms.app.v1.forum.dto.ForumPostCreateRequest
import uz.scorm.lms.app.v1.forum.dto.ForumPostDto
import uz.scorm.lms.app.v1.forum.dto.ForumPostHideRequest
import uz.scorm.lms.app.v1.forum.dto.ForumPostPageDto
import uz.scorm.lms.app.v1.forum.dto.ForumPostRevisionDto
import uz.scorm.lms.app.v1.forum.dto.ForumPostUpdateRequest
import uz.scorm.lms.app.v1.forum.dto.ForumTopicCreateRequest
import uz.scorm.lms.app.v1.forum.dto.ForumTopicDto
import uz.scorm.lms.app.v1.forum.dto.ForumTopicModerationRequest
import uz.scorm.lms.app.v1.forum.dto.ForumTopicPageDto
import uz.scorm.lms.app.v1.forum.model.CourseForumPost
import uz.scorm.lms.app.v1.forum.model.CourseForumPostRevision
import uz.scorm.lms.app.v1.forum.model.CourseForumTopic
import uz.scorm.lms.app.v1.forum.model.ForumTopicStatus
import uz.scorm.lms.app.v1.forum.repository.CourseForumPostRepository
import uz.scorm.lms.app.v1.forum.repository.CourseForumPostRevisionRepository
import uz.scorm.lms.app.v1.forum.repository.CourseForumTopicRepository
import uz.scorm.lms.app.v1.user.model.User
import uz.scorm.lms.app.v1.user.model.UserStatus
import uz.scorm.lms.app.v1.user.repository.UserRepository
import java.time.Instant

@Service
class CourseForumService(
    private val accessService: CourseAccessService,
    private val enrollmentRepository: CourseEnrollmentRepository,
    private val userRepository: UserRepository,
    private val topicRepository: CourseForumTopicRepository,
    private val postRepository: CourseForumPostRepository,
    private val revisionRepository: CourseForumPostRevisionRepository,
) {
    @Transactional(readOnly = true)
    fun topics(
        courseId: Long,
        actorId: Long,
        mayManageAll: Boolean,
        page: Int,
        size: Int,
    ): ForumTopicPageDto {
        val course = accessService.requireRead(courseId, actorId, mayManageAll)
        val moderator = isModerator(course, actorId, mayManageAll)
        val pageable = pageRequest(page, size)
        val result = if (moderator) {
            topicRepository.findAllByCourseIdAndDeletedFalseOrderByPinnedDescLastActivityAtDesc(courseId, pageable)
        } else {
            topicRepository.findAllByCourseIdAndStatusInAndDeletedFalseOrderByPinnedDescLastActivityAtDesc(
                courseId,
                setOf(ForumTopicStatus.OPEN, ForumTopicStatus.LOCKED),
                pageable,
            )
        }
        return ForumTopicPageDto(
            items = result.content.map { it.toDto(moderator) },
            page = result.number,
            size = result.size,
            totalElements = result.totalElements,
            totalPages = result.totalPages,
            canCreateTopic = canWrite(course, actorId, moderator),
            canModerate = moderator,
        )
    }

    @Transactional(readOnly = true)
    fun posts(
        courseId: Long,
        topicId: Long,
        actorId: Long,
        mayManageAll: Boolean,
        page: Int,
        size: Int,
    ): ForumPostPageDto {
        val course = accessService.requireRead(courseId, actorId, mayManageAll)
        val moderator = isModerator(course, actorId, mayManageAll)
        val topic = requireTopic(courseId, topicId)
        require(moderator || topic.status != ForumTopicStatus.ARCHIVED) { "Arxivlangan forum mavzusiga kirish ruxsati yo'q" }
        val writer = canWrite(course, actorId, moderator)
        val result = postRepository.findAllByTopicIdAndDeletedFalseOrderByCreatedAtAsc(topicId, pageRequest(page, size))
        return ForumPostPageDto(
            topic = topic.toDto(moderator),
            posts = result.content.map { it.toDto(actorId, moderator, writer) },
            page = result.number,
            size = result.size,
            totalElements = result.totalElements,
            totalPages = result.totalPages,
            canReply = topic.status == ForumTopicStatus.OPEN && writer,
        )
    }

    @Transactional
    fun createTopic(
        courseId: Long,
        request: ForumTopicCreateRequest,
        actorId: Long,
        mayManageAll: Boolean,
    ): ForumTopicDto {
        val course = accessService.requireRead(courseId, actorId, mayManageAll)
        val moderator = isModerator(course, actorId, mayManageAll)
        require(canWrite(course, actorId, moderator)) { "Forum mavzusini yaratish uchun faol biriktirish talab qilinadi" }
        val title = requiredText(request.title, "Mavzu nomi", 5, 200)
        val body = requiredText(request.body, "Mavzu matni", 10, 5000)
        val actor = activeUser(actorId)
        return topicRepository.save(
            CourseForumTopic(
                course = course,
                author = actor,
                title = title,
                body = body,
            ),
        ).toDto(moderator)
    }

    @Transactional
    fun createPost(
        courseId: Long,
        topicId: Long,
        request: ForumPostCreateRequest,
        actorId: Long,
        mayManageAll: Boolean,
    ): ForumPostDto {
        val course = accessService.requireRead(courseId, actorId, mayManageAll)
        val moderator = isModerator(course, actorId, mayManageAll)
        require(canWrite(course, actorId, moderator)) { "Forumga yozish uchun faol biriktirish talab qilinadi" }
        val topic = requireTopic(courseId, topicId)
        require(topic.status == ForumTopicStatus.OPEN) { "Forum mavzusi javoblar uchun yopilgan" }
        val replyTo = request.replyToId?.let { replyId ->
            val parent = requirePost(topicId, replyId)
            require(parent.hiddenAt == null) { "Yashirilgan postga javob berib bo'lmaydi" }
            parent
        }
        val saved = postRepository.save(
            CourseForumPost(
                topic = topic,
                author = activeUser(actorId),
                replyTo = replyTo,
                body = requiredText(request.body, "Javob matni", 2, 5000),
            ),
        )
        topic.replyCount += 1
        topic.lastActivityAt = Instant.now()
        topicRepository.save(topic)
        return saved.toDto(actorId, moderator, true)
    }

    @Transactional
    fun editPost(
        courseId: Long,
        topicId: Long,
        postId: Long,
        request: ForumPostUpdateRequest,
        actorId: Long,
        mayManageAll: Boolean,
    ): ForumPostDto {
        val course = accessService.requireRead(courseId, actorId, mayManageAll)
        val moderator = isModerator(course, actorId, mayManageAll)
        val writer = canWrite(course, actorId, moderator)
        require(writer) { "Tugallangan kurs forumidagi postni tahrirlab bo'lmaydi" }
        val post = requirePost(topicId, postId)
        require(post.topic.course.id == course.id) { "Post bu kursga tegishli emas" }
        require(post.author.id == actorId) { "Faqat post muallifi matnni tahrirlay oladi" }
        require(post.hiddenAt == null) { "Yashirilgan postni tahrirlab bo'lmaydi" }
        require(post.topic.status == ForumTopicStatus.OPEN) { "Yopilgan mavzudagi postni tahrirlab bo'lmaydi" }
        val newBody = requiredText(request.body, "Javob matni", 2, 5000)
        require(newBody != post.body) { "Yangi matn avvalgisidan farq qilishi kerak" }
        val actor = activeUser(actorId)
        val changedAt = Instant.now()
        revisionRepository.save(
            CourseForumPostRevision(
                post = post,
                revisionNumber = post.revisionNumber,
                body = post.body,
                changedAt = changedAt,
                changedBy = actor,
            ),
        )
        post.body = newBody
        post.revisionNumber += 1
        post.editedAt = changedAt
        post.editedBy = actor
        return postRepository.save(post).toDto(actorId, moderator, writer)
    }

    @Transactional
    fun hidePost(
        courseId: Long,
        topicId: Long,
        postId: Long,
        request: ForumPostHideRequest,
        actorId: Long,
        mayManageAll: Boolean,
    ): ForumPostDto {
        val course = accessService.requireRead(courseId, actorId, mayManageAll)
        val moderator = isModerator(course, actorId, mayManageAll)
        val writer = canWrite(course, actorId, moderator)
        val post = requirePost(topicId, postId)
        require(post.topic.course.id == course.id) { "Post bu kursga tegishli emas" }
        require(moderator || (writer && post.author.id == actorId)) { "Postni yashirish ruxsati yo'q" }
        require(post.hiddenAt == null) { "Post avval yashirilgan" }
        val actor = activeUser(actorId)
        post.hiddenAt = Instant.now()
        post.hiddenBy = actor
        post.hiddenReason = requiredText(request.reason, "Yashirish sababi", 5, 1000)
        return postRepository.save(post).toDto(actorId, moderator, writer)
    }

    @Transactional
    fun moderateTopic(
        courseId: Long,
        topicId: Long,
        request: ForumTopicModerationRequest,
        actorId: Long,
        mayManageAll: Boolean,
    ): ForumTopicDto {
        val course = accessService.requireRead(courseId, actorId, mayManageAll)
        val moderator = isModerator(course, actorId, mayManageAll)
        require(moderator) { "Forum mavzusini boshqarish ruxsati yo'q" }
        require(request.status != null || request.pinned != null) { "Status yoki mahkamlash qiymati berilishi kerak" }
        val topic = requireTopic(courseId, topicId)
        request.status?.let {
            if (topic.status != it) {
                topic.status = it
                topic.statusUpdatedAt = Instant.now()
                topic.statusUpdatedBy = activeUser(actorId)
            }
        }
        request.pinned?.let { topic.pinned = it }
        if (topic.status == ForumTopicStatus.ARCHIVED) topic.pinned = false
        return topicRepository.save(topic).toDto(true)
    }

    @Transactional(readOnly = true)
    fun revisions(
        courseId: Long,
        topicId: Long,
        postId: Long,
        actorId: Long,
        mayManageAll: Boolean,
    ): List<ForumPostRevisionDto> {
        val course = accessService.requireRead(courseId, actorId, mayManageAll)
        val moderator = isModerator(course, actorId, mayManageAll)
        val post = requirePost(topicId, postId)
        require(post.topic.course.id == course.id) { "Post bu kursga tegishli emas" }
        require(moderator || post.author.id == actorId) { "Post tarixini ko'rish ruxsati yo'q" }
        return revisionRepository.findAllByPostIdAndDeletedFalseOrderByRevisionNumberDesc(postId).map {
            ForumPostRevisionDto(
                revisionNumber = it.revisionNumber,
                body = it.body,
                changedAt = it.changedAt,
                changedBy = requireNotNull(it.changedBy.id),
                changedByName = it.changedBy.displayName(),
            )
        }
    }

    private fun requireTopic(courseId: Long, topicId: Long): CourseForumTopic =
        topicRepository.findByIdAndDeletedFalse(topicId)
            ?.also { require(it.course.id == courseId) { "Forum mavzusi bu kursga tegishli emas" } }
            ?: throw NoSuchElementException("Forum mavzusi topilmadi: $topicId")

    private fun requirePost(topicId: Long, postId: Long): CourseForumPost =
        postRepository.findByIdAndDeletedFalse(postId)
            ?.also { require(it.topic.id == topicId) { "Post bu mavzuga tegishli emas" } }
            ?: throw NoSuchElementException("Forum posti topilmadi: $postId")

    private fun activeUser(userId: Long): User = userRepository.findById(userId)
        .filter { !it.deleted && it.status == UserStatus.ACTIVE }
        .orElseThrow { IllegalArgumentException("Faol foydalanuvchi topilmadi: $userId") }

    private fun isModerator(course: Course, actorId: Long, mayManageAll: Boolean): Boolean =
        mayManageAll || course.userId == actorId

    private fun canWrite(course: Course, actorId: Long, moderator: Boolean): Boolean = moderator ||
        enrollmentRepository.existsByCourseIdAndStudentUserIdAndStatusInAndDeletedFalse(
            requireNotNull(course.id),
            actorId,
            setOf(CourseEnrollmentStatus.ACTIVE),
        )

    private fun pageRequest(page: Int, size: Int): PageRequest {
        require(page >= 0) { "Sahifa raqami manfiy bo'lmasligi kerak" }
        require(size in 1..100) { "Sahifa hajmi 1 dan 100 gacha bo'lishi kerak" }
        return PageRequest.of(page, size)
    }

    private fun requiredText(value: String, label: String, min: Int, max: Int): String = value.trim().also {
        require(it.length in min..max) { "$label uzunligi $min dan $max gacha bo'lishi kerak" }
    }

    private fun CourseForumTopic.toDto(moderator: Boolean) = ForumTopicDto(
        id = requireNotNull(id),
        courseId = requireNotNull(course.id),
        title = title,
        body = body,
        status = status.name,
        pinned = pinned,
        replyCount = replyCount,
        authorId = requireNotNull(author.id),
        authorName = author.displayName(),
        createdAt = createdAt,
        lastActivityAt = lastActivityAt,
        canModerate = moderator,
    )

    private fun CourseForumPost.toDto(actorId: Long, moderator: Boolean, writer: Boolean) = ForumPostDto(
        id = requireNotNull(id),
        topicId = requireNotNull(topic.id),
        authorId = requireNotNull(author.id),
        authorName = author.displayName(),
        replyToId = replyTo?.id,
        replyToAuthorName = replyTo?.author?.displayName(),
        body = body.takeIf { hiddenAt == null },
        revisionNumber = revisionNumber,
        editedAt = editedAt,
        hidden = hiddenAt != null,
        hiddenAt = hiddenAt,
        hiddenReason = hiddenReason,
        createdAt = createdAt,
        canEdit = writer && hiddenAt == null && author.id == actorId && topic.status == ForumTopicStatus.OPEN,
        canHide = hiddenAt == null && (moderator || (writer && author.id == actorId)),
    )

    private fun User.displayName(): String = fullName?.trim().takeUnless { it.isNullOrEmpty() } ?: username
}
