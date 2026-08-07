package uz.scorm.lms.app.v1.chat.dto

import java.time.Instant

data class ChatContactDto(
    val userId: Long,
    val fullName: String,
    val username: String,
    val roleName: String?,
)

data class ChatMemberDto(
    val userId: Long,
    val fullName: String,
    val role: String,
    val joinedAt: Instant,
)

data class ChatConversationDto(
    val id: Long,
    val type: String,
    val title: String,
    val status: String,
    val members: List<ChatMemberDto>,
    val lastMessage: String?,
    val lastMessageAt: Instant?,
    val unreadCount: Long,
    val canManage: Boolean,
)

data class ChatMessageDto(
    val id: Long,
    val conversationId: Long,
    val senderId: Long,
    val senderName: String,
    val replyToId: Long?,
    val replyToSenderName: String?,
    val body: String?,
    val hidden: Boolean,
    val hiddenReason: String?,
    val sentAt: Instant,
    val deliveredCount: Int,
    val readCount: Int,
    val recipientCount: Int,
    val mine: Boolean,
    val canHide: Boolean,
)

data class ChatMessagePageDto(
    val conversation: ChatConversationDto,
    val messages: List<ChatMessageDto>,
    val page: Int,
    val size: Int,
    val totalElements: Long,
    val totalPages: Int,
    val canSend: Boolean,
)

data class DirectConversationRequest(val userId: Long)
data class GroupConversationRequest(val title: String, val memberIds: Set<Long>)
data class GroupMembersRequest(
    val addMemberIds: Set<Long> = emptySet(),
    val removeMemberIds: Set<Long> = emptySet(),
)
data class ChatMessageCreateRequest(val body: String, val replyToId: Long? = null)
data class ChatReadRequest(val throughMessageId: Long)
data class ChatMessageHideRequest(val reason: String)
