package uz.scorm.lms.app.v1.announcement.repository

import jakarta.persistence.LockModeType
import org.springframework.data.jpa.repository.EntityGraph
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Lock
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import uz.scorm.lms.app.v1.announcement.model.*

interface AnnouncementRepository : JpaRepository<Announcement, Long> {
    fun countByStatusAndDeletedFalse(status: AnnouncementStatus): Long

    @EntityGraph(attributePaths = ["author", "course"])
    fun findAllByAuthorIdAndDeletedFalseOrderByCreatedAtDesc(authorId: Long): List<Announcement>

    @EntityGraph(attributePaths = ["author", "course"])
    fun findAllByDeletedFalseOrderByCreatedAtDesc(): List<Announcement>

    @EntityGraph(attributePaths = ["author", "course"])
    fun findByIdAndDeletedFalse(id: Long): Announcement?
}

interface AnnouncementDeliveryRepository : JpaRepository<AnnouncementDelivery, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @EntityGraph(attributePaths = ["announcement", "recipient"])
    @Query("SELECT d FROM AnnouncementDelivery d WHERE d.id = :id AND d.deleted = false")
    fun lockByIdAndDeletedFalse(@Param("id") id: Long): AnnouncementDelivery?

    @EntityGraph(attributePaths = ["announcement", "announcement.author", "announcement.course", "recipient"])
    fun findAllByAnnouncementIdAndDeletedFalseOrderByRecipientFullNameAscChannelAsc(
        announcementId: Long,
    ): List<AnnouncementDelivery>

    @EntityGraph(attributePaths = ["announcement", "announcement.author", "announcement.course", "recipient"])
    @Query("""
        SELECT d FROM AnnouncementDelivery d
        WHERE d.recipient.id = :userId AND d.channel = :channel AND d.deleted = false
          AND d.announcement.deleted = false AND d.announcement.status IN :statuses
        ORDER BY d.announcement.publishedAt DESC
    """)
    fun inbox(
        @Param("userId") userId: Long,
        @Param("channel") channel: AnnouncementChannel,
        @Param("statuses") statuses: Collection<AnnouncementStatus>,
    ): List<AnnouncementDelivery>

    fun findByAnnouncementIdAndRecipientIdAndChannelAndDeletedFalse(
        announcementId: Long,
        recipientId: Long,
        channel: AnnouncementChannel,
    ): AnnouncementDelivery?

    @EntityGraph(attributePaths = ["announcement", "recipient"])
    fun findAllByAnnouncementIdAndStatusInAndAttemptCountLessThanAndDeletedFalse(
        announcementId: Long,
        statuses: Collection<AnnouncementDeliveryStatus>,
        attemptCount: Int,
    ): List<AnnouncementDelivery>
}
