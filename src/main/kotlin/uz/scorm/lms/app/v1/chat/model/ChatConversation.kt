package uz.scorm.lms.app.v1.chat.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.FetchType
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import uz.scorm.lms.app.common.BaseEntity
import uz.scorm.lms.app.v1.user.model.User
import java.time.Instant

enum class ChatConversationType { DIRECT, GROUP }
enum class ChatConversationStatus { ACTIVE, ARCHIVED }

@Entity
@Table(name = "chat_conversations")
class ChatConversation(
    @Enumerated(EnumType.STRING)
    @Column(name = "conversation_type", nullable = false, length = 20)
    var conversationType: ChatConversationType,

    @Column(length = 200)
    var title: String? = null,

    @Column(name = "direct_key", length = 100, unique = true)
    var directKey: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    var status: ChatConversationStatus = ChatConversationStatus.ACTIVE,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by_user_id", nullable = false)
    var createdByUser: User,

    @Column(name = "last_message_at")
    var lastMessageAt: Instant? = null,

    @Column(name = "archived_at")
    var archivedAt: Instant? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "archived_by_user_id")
    var archivedByUser: User? = null,
) : BaseEntity()
