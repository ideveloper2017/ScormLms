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

enum class ChatReceiptStatus { DELIVERED, READ }

@Entity
@Table(
    name = "chat_message_receipts",
    uniqueConstraints = [UniqueConstraint(
        name = "uk_chat_message_receipt",
        columnNames = ["message_id", "user_id"],
    )],
)
class ChatMessageReceipt(
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "message_id", nullable = false)
    var message: ChatMessage,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    var user: User,

    @Enumerated(EnumType.STRING)
    @Column(name = "receipt_status", nullable = false, length = 20)
    var receiptStatus: ChatReceiptStatus = ChatReceiptStatus.DELIVERED,

    @Column(name = "delivered_at", nullable = false)
    var deliveredAt: Instant = Instant.now(),

    @Column(name = "read_at")
    var readAt: Instant? = null,
) : BaseEntity()
