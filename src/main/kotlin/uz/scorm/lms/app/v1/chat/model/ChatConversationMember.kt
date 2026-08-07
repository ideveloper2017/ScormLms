package uz.scorm.lms.app.v1.chat.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.FetchType
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import jakarta.persistence.UniqueConstraint
import uz.scorm.lms.app.common.BaseEntity
import uz.scorm.lms.app.v1.user.model.User
import java.time.Instant

enum class ChatMemberRole { OWNER, MEMBER }
enum class ChatMemberStatus { ACTIVE, LEFT }

@Entity
@Table(
    name = "chat_conversation_members",
    uniqueConstraints = [UniqueConstraint(
        name = "uk_chat_conversation_member",
        columnNames = ["conversation_id", "user_id"],
    )],
)
class ChatConversationMember(
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "conversation_id", nullable = false)
    var conversation: ChatConversation,

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    var user: User,

    @Enumerated(EnumType.STRING)
    @Column(name = "member_role", nullable = false, length = 20)
    var memberRole: ChatMemberRole = ChatMemberRole.MEMBER,

    @Enumerated(EnumType.STRING)
    @Column(name = "member_status", nullable = false, length = 20)
    var memberStatus: ChatMemberStatus = ChatMemberStatus.ACTIVE,

    @Column(name = "joined_at", nullable = false)
    var joinedAt: Instant = Instant.now(),

    @Column(name = "left_at")
    var leftAt: Instant? = null,
) : BaseEntity()
