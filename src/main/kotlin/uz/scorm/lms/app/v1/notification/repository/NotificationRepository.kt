package uz.scorm.lms.app.v1.notification.repository

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import uz.scorm.lms.app.v1.notification.model.Notification

@Repository
interface NotificationRepository : JpaRepository<Notification, String> {

    fun findByUserIdOrderByCreatedAtDesc(userId: Long): List<Notification>

    fun countByUserIdAndIsReadFalse(userId: Long): Long

    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.user.id = :userId AND n.isRead = false")
    fun markAllReadByUserId(@Param("userId") userId: Long): Int
}
