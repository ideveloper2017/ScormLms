package uz.scorm.lms.app.v1.notification.service

import mu.KotlinLogging
import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.notification.dto.CreateNotificationRequest
import uz.scorm.lms.app.v1.notification.dto.NotificationCountDto
import uz.scorm.lms.app.v1.notification.dto.NotificationDto
import uz.scorm.lms.app.v1.notification.dto.toDto
import uz.scorm.lms.app.v1.notification.model.Notification
import uz.scorm.lms.app.v1.notification.model.NotificationPriority
import uz.scorm.lms.app.v1.notification.model.NotificationType
import uz.scorm.lms.app.v1.notification.repository.NotificationRepository
import uz.scorm.lms.app.v1.user.repository.UserRepository

private val logger = KotlinLogging.logger {}

@Service
class NotificationService(
    private val notificationRepository: NotificationRepository,
    private val userRepository: UserRepository,
    private val messagingTemplate: SimpMessagingTemplate,
) {

    /** Foydalanuvchining barcha bildirishnomalarini qaytaradi (eng yangi — birinchi) */
    @Transactional(readOnly = true)
    fun getForUser(userId: Long): List<NotificationDto> =
        notificationRepository.findByUserIdOrderByCreatedAtDesc(userId).map { it.toDto() }

    /** O'qilmagan bildirishnomalar sonini qaytaradi */
    @Transactional(readOnly = true)
    fun getUnreadCount(userId: Long): NotificationCountDto =
        NotificationCountDto(notificationRepository.countByUserIdAndIsReadFalse(userId))

    /** Bitta bildirishnomani o'qildi deb belgilaydi */
    @Transactional
    fun markAsRead(id: String, userId: Long) {
        val notif = notificationRepository.findById(id).orElseThrow {
            IllegalArgumentException("Bildirishnoma topilmadi: $id")
        }
        require(notif.user?.id == userId) { "Ruxsat yo'q" }
        notif.isRead = true
        notificationRepository.save(notif)
    }

    /** Barcha bildirishnomalarni o'qildi deb belgilaydi */
    @Transactional
    fun markAllAsRead(userId: Long) {
        notificationRepository.markAllReadByUserId(userId)
    }

    /** Bildirishnomani o'chiradi */
    @Transactional
    fun delete(id: String, userId: Long) {
        val notif = notificationRepository.findById(id).orElseThrow {
            IllegalArgumentException("Bildirishnoma topilmadi: $id")
        }
        require(notif.user?.id == userId) { "Ruxsat yo'q" }
        notificationRepository.delete(notif)
    }

    /**
     * Yangi bildirishnoma yaratadi va foydalanuvchiga WebSocket orqali darhol yetkazadi.
     * Boshqa servislardan chaqiriladi (AssignmentService, GradeService va h.k.).
     */
    @Transactional
    fun create(req: CreateNotificationRequest): NotificationDto {
        val user = userRepository.findById(req.userId).orElseThrow {
            IllegalArgumentException("Foydalanuvchi topilmadi: ${req.userId}")
        }
        val type = runCatching {
            NotificationType.valueOf(req.type.uppercase())
        }.getOrDefault(NotificationType.SYSTEM)

        val priority = runCatching {
            NotificationPriority.valueOf(req.priority.uppercase())
        }.getOrDefault(NotificationPriority.NORMAL)

        val saved = notificationRepository.save(
            Notification(
                title     = req.title,
                message   = req.message,
                type      = type,
                priority  = priority,
                relatedId = req.relatedId,
                actionUrl = req.actionUrl,
                user      = user,
            )
        )

        val dto = saved.toDto()

        // WebSocket orqali foydalanuvchiga real-time yuboramiz
        try {
            messagingTemplate.convertAndSendToUser(
                user.username,
                "/queue/notifications",
                dto,
            )
            logger.debug { "WebSocket push: ${user.username} → ${dto.title}" }
        } catch (e: Exception) {
            // WS ulanish bo'lmasa ham xatolik ko'tarmayiz — polling fallback ishleydi
            logger.warn { "WebSocket push bajarilmadi (${user.username}): ${e.message}" }
        }

        return dto
    }

    /** Tizim bildirishnomasi barcha foydalanuvchilarga */
    @Transactional
    fun broadcast(title: String, message: String, priority: NotificationPriority = NotificationPriority.NORMAL) {
        userRepository.findAll().forEach { user ->
            create(CreateNotificationRequest(
                userId   = user.id!!,
                title    = title,
                message  = message,
                type     = "system",
                priority = priority.name.lowercase(),
            ))
        }
    }
}
