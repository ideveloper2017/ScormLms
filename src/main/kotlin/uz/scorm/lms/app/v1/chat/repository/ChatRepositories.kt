package uz.scorm.lms.app.v1.chat.repository

import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.EntityGraph
import org.springframework.data.jpa.repository.JpaRepository
import uz.scorm.lms.app.v1.chat.model.ChatConversation
import uz.scorm.lms.app.v1.chat.model.ChatConversationMember
import uz.scorm.lms.app.v1.chat.model.ChatMemberStatus
import uz.scorm.lms.app.v1.chat.model.ChatMessage
import uz.scorm.lms.app.v1.chat.model.ChatMessageReceipt
import uz.scorm.lms.app.v1.chat.model.ChatReceiptStatus

interface ChatConversationRepository : JpaRepository<ChatConversation, Long> {
    fun countByDeletedFalse(): Long

    @EntityGraph(attributePaths = ["createdByUser"])
    fun findByDirectKeyAndDeletedFalse(directKey: String): ChatConversation?

    @EntityGraph(attributePaths = ["createdByUser"])
    fun findByIdAndDeletedFalse(id: Long): ChatConversation?
}

interface ChatConversationMemberRepository : JpaRepository<ChatConversationMember, Long> {
    @EntityGraph(attributePaths = ["conversation", "conversation.createdByUser", "user", "user.role"])
    fun findAllByUserIdAndMemberStatusAndDeletedFalseOrderByConversationLastMessageAtDesc(
        userId: Long,
        status: ChatMemberStatus,
    ): List<ChatConversationMember>

    @EntityGraph(attributePaths = ["conversation", "user", "user.role"])
    fun findAllByConversationIdAndMemberStatusAndDeletedFalseOrderByJoinedAtAsc(
        conversationId: Long,
        status: ChatMemberStatus,
    ): List<ChatConversationMember>

    @EntityGraph(attributePaths = ["conversation", "conversation.createdByUser", "user", "user.role"])
    fun findByConversationIdAndUserIdAndDeletedFalse(conversationId: Long, userId: Long): ChatConversationMember?
}

interface ChatMessageRepository : JpaRepository<ChatMessage, Long> {
    @EntityGraph(attributePaths = ["sender", "replyTo", "replyTo.sender"])
    fun findAllByConversationIdAndDeletedFalseOrderBySentAtDesc(
        conversationId: Long,
        pageable: Pageable,
    ): Page<ChatMessage>

    @EntityGraph(attributePaths = ["conversation", "sender", "replyTo", "replyTo.sender"])
    fun findByIdAndDeletedFalse(id: Long): ChatMessage?

    fun findFirstByConversationIdAndDeletedFalseOrderBySentAtDesc(conversationId: Long): ChatMessage?
}

interface ChatMessageReceiptRepository : JpaRepository<ChatMessageReceipt, Long> {
    @EntityGraph(attributePaths = ["message", "message.conversation"])
    fun findAllByUserIdAndReceiptStatusAndMessageConversationIdAndDeletedFalse(
        userId: Long,
        status: ChatReceiptStatus,
        conversationId: Long,
    ): List<ChatMessageReceipt>

    fun countByUserIdAndReceiptStatusAndMessageConversationIdAndDeletedFalse(
        userId: Long,
        status: ChatReceiptStatus,
        conversationId: Long,
    ): Long

    fun findAllByMessageIdInAndDeletedFalse(messageIds: Collection<Long>): List<ChatMessageReceipt>
}
