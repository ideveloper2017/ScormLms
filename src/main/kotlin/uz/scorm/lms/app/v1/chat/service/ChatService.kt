package uz.scorm.lms.app.v1.chat.service

import org.springframework.data.domain.PageRequest
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.chat.dto.ChatContactDto
import uz.scorm.lms.app.v1.chat.dto.ChatConversationDto
import uz.scorm.lms.app.v1.chat.dto.ChatMemberDto
import uz.scorm.lms.app.v1.chat.dto.ChatMessageCreateRequest
import uz.scorm.lms.app.v1.chat.dto.ChatMessageDto
import uz.scorm.lms.app.v1.chat.dto.ChatMessageHideRequest
import uz.scorm.lms.app.v1.chat.dto.ChatMessagePageDto
import uz.scorm.lms.app.v1.chat.dto.ChatReadRequest
import uz.scorm.lms.app.v1.chat.dto.DirectConversationRequest
import uz.scorm.lms.app.v1.chat.dto.GroupConversationRequest
import uz.scorm.lms.app.v1.chat.dto.GroupMembersRequest
import uz.scorm.lms.app.v1.chat.model.ChatConversation
import uz.scorm.lms.app.v1.chat.model.ChatConversationMember
import uz.scorm.lms.app.v1.chat.model.ChatConversationStatus
import uz.scorm.lms.app.v1.chat.model.ChatConversationType
import uz.scorm.lms.app.v1.chat.model.ChatMemberRole
import uz.scorm.lms.app.v1.chat.model.ChatMemberStatus
import uz.scorm.lms.app.v1.chat.model.ChatMessage
import uz.scorm.lms.app.v1.chat.model.ChatMessageReceipt
import uz.scorm.lms.app.v1.chat.model.ChatReceiptStatus
import uz.scorm.lms.app.v1.chat.repository.ChatConversationMemberRepository
import uz.scorm.lms.app.v1.chat.repository.ChatConversationRepository
import uz.scorm.lms.app.v1.chat.repository.ChatMessageReceiptRepository
import uz.scorm.lms.app.v1.chat.repository.ChatMessageRepository
import uz.scorm.lms.app.v1.courses.model.CourseEnrollmentStatus
import uz.scorm.lms.app.v1.courses.repository.CourseEnrollmentRepository
import uz.scorm.lms.app.v1.user.model.User
import uz.scorm.lms.app.v1.user.model.UserStatus
import uz.scorm.lms.app.v1.user.repository.UserRepository
import java.time.Instant

@Service
class ChatService(
    private val userRepository: UserRepository,
    private val enrollmentRepository: CourseEnrollmentRepository,
    private val conversationRepository: ChatConversationRepository,
    private val memberRepository: ChatConversationMemberRepository,
    private val messageRepository: ChatMessageRepository,
    private val receiptRepository: ChatMessageReceiptRepository,
) {
    @Transactional(readOnly = true)
    fun contacts(actorId: Long, mayManageAll: Boolean, query: String?): List<ChatContactDto> {
        activeUser(actorId)
        val normalized = query?.trim()?.lowercase().orEmpty()
        require(normalized.length <= 100) { "Qidiruv matni 100 belgidan oshmasligi kerak" }
        val allowedIds = contactIds(actorId, mayManageAll)
        return userRepository.findAllById(allowedIds).asSequence()
            .filter { !it.deleted && it.status == UserStatus.ACTIVE }
            .filter { normalized.isBlank() || it.displayName().lowercase().contains(normalized) || it.username.lowercase().contains(normalized) }
            .sortedBy { it.displayName().lowercase() }
            .take(50)
            .map { ChatContactDto(requireNotNull(it.id), it.displayName(), it.username, it.role?.name) }
            .toList()
    }

    @Transactional(readOnly = true)
    fun conversations(actorId: Long): List<ChatConversationDto> {
        activeUser(actorId)
        return memberRepository.findAllByUserIdAndMemberStatusAndDeletedFalseOrderByConversationLastMessageAtDesc(
            actorId,
            ChatMemberStatus.ACTIVE,
        ).map { member -> conversationDto(member.conversation, actorId) }
    }

    @Transactional
    fun direct(
        request: DirectConversationRequest,
        actorId: Long,
        mayManageAll: Boolean,
    ): ChatConversationDto {
        require(request.userId != actorId) { "O'zingiz bilan chat ochib bo'lmaydi" }
        require(request.userId in contactIds(actorId, mayManageAll)) { "Bu foydalanuvchi bilan chat ochish ruxsati yo'q" }
        val actor = activeUser(actorId)
        val peer = activeUser(request.userId)
        val key = listOf(actorId, request.userId).sorted().joinToString(":")
        val existing = conversationRepository.findByDirectKeyAndDeletedFalse(key)
        if (existing != null) {
            requireMember(requireNotNull(existing.id), actorId)
            return conversationDto(existing, actorId)
        }
        val conversation = conversationRepository.save(ChatConversation(
            conversationType = ChatConversationType.DIRECT,
            directKey = key,
            createdByUser = actor,
        ))
        memberRepository.saveAll(listOf(
            ChatConversationMember(conversation, actor, ChatMemberRole.OWNER),
            ChatConversationMember(conversation, peer, ChatMemberRole.MEMBER),
        ))
        return conversationDto(conversation, actorId)
    }

    @Transactional
    fun group(
        request: GroupConversationRequest,
        actorId: Long,
        mayManageAll: Boolean,
    ): ChatConversationDto {
        val title = requiredText(request.title, "Guruh nomi", 3, 200)
        val memberIds = request.memberIds - actorId
        require(memberIds.size in 2..49) { "Guruhga yaratuvchidan tashqari 2 dan 49 gacha a'zo tanlang" }
        require(memberIds.all { it in contactIds(actorId, mayManageAll) }) { "Guruhda ruxsat etilmagan kontakt mavjud" }
        val actor = activeUser(actorId)
        val members = userRepository.findAllById(memberIds).also {
            require(it.size == memberIds.size && it.all { user -> !user.deleted && user.status == UserStatus.ACTIVE }) {
                "Guruh a'zolaridan biri faol emas"
            }
        }
        val conversation = conversationRepository.save(ChatConversation(
            conversationType = ChatConversationType.GROUP,
            title = title,
            createdByUser = actor,
        ))
        memberRepository.save(ChatConversationMember(conversation, actor, ChatMemberRole.OWNER))
        memberRepository.saveAll(members.map { ChatConversationMember(conversation, it) })
        return conversationDto(conversation, actorId)
    }

    @Transactional
    fun updateGroupMembers(
        conversationId: Long,
        request: GroupMembersRequest,
        actorId: Long,
        mayManageAll: Boolean,
    ): ChatConversationDto {
        val ownerMember = requireMember(conversationId, actorId)
        val conversation = ownerMember.conversation
        require(conversation.conversationType == ChatConversationType.GROUP) { "Faqat guruh a'zolari boshqariladi" }
        require(ownerMember.memberRole == ChatMemberRole.OWNER) { "Faqat guruh egasi a'zolarni boshqaradi" }
        require(request.addMemberIds.intersect(request.removeMemberIds).isEmpty()) { "Bir foydalanuvchini bir vaqtda qo'shib va olib tashlab bo'lmaydi" }
        require(actorId !in request.removeMemberIds) { "Guruh egasini olib tashlab bo'lmaydi" }
        require(request.addMemberIds.all { it in contactIds(actorId, mayManageAll) }) { "Ruxsat etilmagan kontaktni qo'shib bo'lmaydi" }
        val existing = memberRepository.findAllByConversationIdAndMemberStatusAndDeletedFalseOrderByJoinedAtAsc(
            conversationId,
            ChatMemberStatus.ACTIVE,
        )
        require(existing.size - request.removeMemberIds.size + request.addMemberIds.size <= 50) { "Guruh 50 a'zodan oshmasligi kerak" }
        request.removeMemberIds.forEach { userId ->
            val member = memberRepository.findByConversationIdAndUserIdAndDeletedFalse(conversationId, userId)
                ?: throw NoSuchElementException("Guruh a'zosi topilmadi: $userId")
            require(member.memberStatus == ChatMemberStatus.ACTIVE) { "Guruh a'zosi allaqachon chiqqan" }
            member.memberStatus = ChatMemberStatus.LEFT
            member.leftAt = Instant.now()
            memberRepository.save(member)
        }
        request.addMemberIds.forEach { userId ->
            val user = activeUser(userId)
            val previous = memberRepository.findByConversationIdAndUserIdAndDeletedFalse(conversationId, userId)
            if (previous == null) {
                memberRepository.save(ChatConversationMember(conversation, user))
            } else {
                require(previous.memberStatus == ChatMemberStatus.LEFT) { "Foydalanuvchi allaqachon guruhda" }
                previous.memberStatus = ChatMemberStatus.ACTIVE
                previous.leftAt = null
                previous.joinedAt = Instant.now()
                memberRepository.save(previous)
            }
        }
        return conversationDto(conversation, actorId)
    }

    @Transactional(readOnly = true)
    fun messages(conversationId: Long, actorId: Long, page: Int, size: Int): ChatMessagePageDto {
        val member = requireMember(conversationId, actorId)
        require(page >= 0) { "Sahifa raqami manfiy bo'lmasligi kerak" }
        require(size in 1..100) { "Sahifa hajmi 1 dan 100 gacha bo'lishi kerak" }
        val result = messageRepository.findAllByConversationIdAndDeletedFalseOrderBySentAtDesc(
            conversationId,
            PageRequest.of(page, size),
        )
        val messages = result.content.reversed()
        val receiptMap = receiptRepository.findAllByMessageIdInAndDeletedFalse(messages.mapNotNull { it.id })
            .groupBy { requireNotNull(it.message.id) }
        return ChatMessagePageDto(
            conversation = conversationDto(member.conversation, actorId),
            messages = messages.map { messageDto(it, actorId, receiptMap[requireNotNull(it.id)].orEmpty()) },
            page = result.number,
            size = result.size,
            totalElements = result.totalElements,
            totalPages = result.totalPages,
            canSend = member.conversation.status == ChatConversationStatus.ACTIVE,
        )
    }

    @Transactional
    fun send(conversationId: Long, request: ChatMessageCreateRequest, actorId: Long): ChatMessageDto {
        val member = requireMember(conversationId, actorId)
        require(member.conversation.status == ChatConversationStatus.ACTIVE) { "Arxivlangan chatga xabar yuborib bo'lmaydi" }
        val replyTo = request.replyToId?.let { id -> requireMessage(conversationId, id) }
        val now = Instant.now()
        val saved = messageRepository.save(ChatMessage(
            conversation = member.conversation,
            sender = activeUser(actorId),
            replyTo = replyTo,
            body = requiredText(request.body, "Xabar", 1, 5000),
            sentAt = now,
        ))
        val recipients = memberRepository.findAllByConversationIdAndMemberStatusAndDeletedFalseOrderByJoinedAtAsc(
            conversationId,
            ChatMemberStatus.ACTIVE,
        ).filter { it.user.id != actorId }
        val receipts = receiptRepository.saveAll(recipients.map {
            ChatMessageReceipt(saved, it.user, deliveredAt = now)
        })
        member.conversation.lastMessageAt = now
        conversationRepository.save(member.conversation)
        return messageDto(saved, actorId, receipts)
    }

    @Transactional
    fun markRead(conversationId: Long, request: ChatReadRequest, actorId: Long): ChatConversationDto {
        val member = requireMember(conversationId, actorId)
        requireMessage(conversationId, request.throughMessageId)
        val now = Instant.now()
        receiptRepository.findAllByUserIdAndReceiptStatusAndMessageConversationIdAndDeletedFalse(
            actorId,
            ChatReceiptStatus.DELIVERED,
            conversationId,
        ).filter { requireNotNull(it.message.id) <= request.throughMessageId }.forEach {
            it.receiptStatus = ChatReceiptStatus.READ
            it.readAt = now
            receiptRepository.save(it)
        }
        return conversationDto(member.conversation, actorId)
    }

    @Transactional
    fun hideMessage(
        conversationId: Long,
        messageId: Long,
        request: ChatMessageHideRequest,
        actorId: Long,
    ): ChatMessageDto {
        requireMember(conversationId, actorId)
        val message = requireMessage(conversationId, messageId)
        require(message.sender.id == actorId) { "Faqat xabar muallifi uni yashira oladi" }
        require(message.hiddenAt == null) { "Xabar avval yashirilgan" }
        message.hiddenAt = Instant.now()
        message.hiddenByUser = activeUser(actorId)
        message.hiddenReason = requiredText(request.reason, "Yashirish sababi", 5, 1000)
        val saved = messageRepository.save(message)
        val receipts = receiptRepository.findAllByMessageIdInAndDeletedFalse(listOf(messageId))
        return messageDto(saved, actorId, receipts)
    }

    @Transactional
    fun archive(conversationId: Long, actorId: Long): ChatConversationDto {
        val member = requireMember(conversationId, actorId)
        require(member.conversation.conversationType == ChatConversationType.GROUP) { "Shaxsiy chat umumiy arxivga o'tkazilmaydi" }
        require(member.memberRole == ChatMemberRole.OWNER) { "Faqat chat egasi uni arxivlaydi" }
        require(member.conversation.status == ChatConversationStatus.ACTIVE) { "Chat avval arxivlangan" }
        member.conversation.status = ChatConversationStatus.ARCHIVED
        member.conversation.archivedAt = Instant.now()
        member.conversation.archivedByUser = activeUser(actorId)
        return conversationDto(conversationRepository.save(member.conversation), actorId)
    }

    private fun contactIds(actorId: Long, mayManageAll: Boolean): Set<Long> {
        if (mayManageAll) return userRepository.findAll().asSequence()
            .filter { !it.deleted && it.status == UserStatus.ACTIVE && it.id != actorId }
            .mapNotNull { it.id }
            .toSet()
        val valid = setOf(CourseEnrollmentStatus.ACTIVE, CourseEnrollmentStatus.COMPLETED)
        val enrollments = enrollmentRepository.findAll().filter {
            !it.deleted && it.status in valid && !it.course.deleted
        }
        val actorCourseIds = enrollments.filter { it.student.user.id == actorId }.mapNotNull { it.course.id }.toSet()
        val result = mutableSetOf<Long>()
        enrollments.forEach { enrollment ->
            if (enrollment.course.userId == actorId) enrollment.student.user.id?.let(result::add)
            if (enrollment.course.id in actorCourseIds) {
                enrollment.course.userId?.let(result::add)
                enrollment.student.user.id?.let(result::add)
            }
        }
        result.remove(actorId)
        return result
    }

    private fun requireMember(conversationId: Long, actorId: Long): ChatConversationMember =
        memberRepository.findByConversationIdAndUserIdAndDeletedFalse(conversationId, actorId)
            ?.takeIf { it.memberStatus == ChatMemberStatus.ACTIVE && !it.conversation.deleted }
            ?: throw IllegalArgumentException("Chat a'zoligi topilmadi")

    private fun requireMessage(conversationId: Long, messageId: Long): ChatMessage =
        messageRepository.findByIdAndDeletedFalse(messageId)
            ?.also { require(it.conversation.id == conversationId) { "Xabar bu chatga tegishli emas" } }
            ?: throw NoSuchElementException("Xabar topilmadi: $messageId")

    private fun activeUser(userId: Long): User = userRepository.findById(userId)
        .filter { !it.deleted && it.status == UserStatus.ACTIVE }
        .orElseThrow { IllegalArgumentException("Faol foydalanuvchi topilmadi: $userId") }

    private fun conversationDto(conversation: ChatConversation, actorId: Long): ChatConversationDto {
        val members = memberRepository.findAllByConversationIdAndMemberStatusAndDeletedFalseOrderByJoinedAtAsc(
            requireNotNull(conversation.id),
            ChatMemberStatus.ACTIVE,
        )
        val actorMember = members.firstOrNull { it.user.id == actorId }
            ?: throw IllegalArgumentException("Chat a'zoligi topilmadi")
        val latest = messageRepository.findFirstByConversationIdAndDeletedFalseOrderBySentAtDesc(requireNotNull(conversation.id))
        val title = if (conversation.conversationType == ChatConversationType.DIRECT) {
            members.firstOrNull { it.user.id != actorId }?.user?.displayName() ?: "Shaxsiy chat"
        } else conversation.title.orEmpty()
        return ChatConversationDto(
            id = requireNotNull(conversation.id),
            type = conversation.conversationType.name,
            title = title,
            status = conversation.status.name,
            members = members.map {
                ChatMemberDto(requireNotNull(it.user.id), it.user.displayName(), it.memberRole.name, it.joinedAt)
            },
            lastMessage = latest?.body?.takeIf { latest.hiddenAt == null },
            lastMessageAt = conversation.lastMessageAt,
            unreadCount = receiptRepository.countByUserIdAndReceiptStatusAndMessageConversationIdAndDeletedFalse(
                actorId,
                ChatReceiptStatus.DELIVERED,
                requireNotNull(conversation.id),
            ),
            canManage = actorMember.memberRole == ChatMemberRole.OWNER && conversation.conversationType == ChatConversationType.GROUP,
        )
    }

    private fun messageDto(message: ChatMessage, actorId: Long, receipts: List<ChatMessageReceipt>): ChatMessageDto =
        ChatMessageDto(
            id = requireNotNull(message.id),
            conversationId = requireNotNull(message.conversation.id),
            senderId = requireNotNull(message.sender.id),
            senderName = message.sender.displayName(),
            replyToId = message.replyTo?.id,
            replyToSenderName = message.replyTo?.sender?.displayName(),
            body = message.body.takeIf { message.hiddenAt == null },
            hidden = message.hiddenAt != null,
            hiddenReason = message.hiddenReason,
            sentAt = message.sentAt,
            deliveredCount = receipts.size,
            readCount = receipts.count { it.receiptStatus == ChatReceiptStatus.READ },
            recipientCount = receipts.size,
            mine = message.sender.id == actorId,
            canHide = message.sender.id == actorId && message.hiddenAt == null,
        )

    private fun requiredText(value: String, label: String, min: Int, max: Int): String = value.trim().also {
        require(it.length in min..max) { "$label uzunligi $min dan $max gacha bo'lishi kerak" }
    }

    private fun User.displayName(): String = fullName?.trim().takeUnless { it.isNullOrBlank() } ?: username
}
