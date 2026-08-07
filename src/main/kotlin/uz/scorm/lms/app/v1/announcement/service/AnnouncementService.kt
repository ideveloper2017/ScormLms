package uz.scorm.lms.app.v1.announcement.service

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.announcement.dto.*
import uz.scorm.lms.app.v1.announcement.model.*
import uz.scorm.lms.app.v1.announcement.repository.AnnouncementDeliveryRepository
import uz.scorm.lms.app.v1.announcement.repository.AnnouncementRepository
import uz.scorm.lms.app.v1.courses.model.Course
import uz.scorm.lms.app.v1.courses.model.CourseEnrollmentStatus
import uz.scorm.lms.app.v1.courses.model.CourseStatus
import uz.scorm.lms.app.v1.courses.repository.CourseEnrollmentRepository
import uz.scorm.lms.app.v1.courses.repository.CourseRepository
import uz.scorm.lms.app.v1.integration.service.IntegrationOutboxService
import uz.scorm.lms.app.v1.user.model.User
import uz.scorm.lms.app.v1.user.model.UserStatus
import uz.scorm.lms.app.v1.user.repository.UserRepository
import java.time.Instant

@Service
class AnnouncementService(
    private val announcementRepository: AnnouncementRepository,
    private val deliveryRepository: AnnouncementDeliveryRepository,
    private val courseRepository: CourseRepository,
    private val enrollmentRepository: CourseEnrollmentRepository,
    private val userRepository: UserRepository,
    private val deliveryGateway: AnnouncementDeliveryGateway,
    private val integrationOutboxService: IntegrationOutboxService,
) {
    @Transactional(readOnly = true)
    fun options(actorId: Long, mayManageAll: Boolean): AnnouncementManageOptionsDto {
        activeUser(actorId)
        val courses = if (mayManageAll) courseRepository.findAll().filter { !it.deleted }
        else courseRepository.findAllByUserIdAndDeletedFalseOrderByCreatedAtDesc(actorId)
        return AnnouncementManageOptionsDto(
            canPublishInstitution = mayManageAll,
            courses = courses.sortedBy { it.title.orEmpty().lowercase() }.map {
                AnnouncementCourseOptionDto(requireNotNull(it.id), it.title.orEmpty(), it.status)
            },
        )
    }

    @Transactional(readOnly = true)
    fun manage(actorId: Long, mayManageAll: Boolean): List<AnnouncementDto> {
        activeUser(actorId)
        val announcements = if (mayManageAll) announcementRepository.findAllByDeletedFalseOrderByCreatedAtDesc()
        else announcementRepository.findAllByAuthorIdAndDeletedFalseOrderByCreatedAtDesc(actorId)
        return announcements.map { dto(it, actorId, mayManageAll) }
    }

    @Transactional
    fun create(request: AnnouncementUpsertRequest, actorId: Long, mayManageAll: Boolean): AnnouncementDto {
        val actor = activeUser(actorId)
        val normalized = normalize(request, actorId, mayManageAll)
        val saved = announcementRepository.save(Announcement(
            title = normalized.title,
            body = normalized.body,
            audience = normalized.audience,
            course = normalized.course,
            category = normalized.category,
            priority = normalized.priority,
            channels = normalized.channels.joinToString(",") { it.name },
            actionUrl = normalized.actionUrl,
            author = actor,
        ))
        return dto(saved, actorId, mayManageAll)
    }

    @Transactional
    fun update(id: Long, request: AnnouncementUpsertRequest, actorId: Long, mayManageAll: Boolean): AnnouncementDto {
        val announcement = manageable(id, actorId, mayManageAll)
        require(announcement.status == AnnouncementStatus.DRAFT) { "Faqat qoralama e'lon tahrirlanadi" }
        val normalized = normalize(request, actorId, mayManageAll)
        announcement.title = normalized.title
        announcement.body = normalized.body
        announcement.audience = normalized.audience
        announcement.course = normalized.course
        announcement.category = normalized.category
        announcement.priority = normalized.priority
        announcement.channels = normalized.channels.joinToString(",") { it.name }
        announcement.actionUrl = normalized.actionUrl
        return dto(announcementRepository.save(announcement), actorId, mayManageAll)
    }

    @Transactional
    fun publish(id: Long, actorId: Long, mayManageAll: Boolean): AnnouncementDto {
        val actor = activeUser(actorId)
        val announcement = manageable(id, actorId, mayManageAll)
        require(announcement.status == AnnouncementStatus.DRAFT) { "Faqat qoralama e'lon chop etiladi" }
        if (announcement.audience == AnnouncementAudience.COURSE) {
            require(announcement.course?.status == CourseStatus.PUBLISHED.name) { "Faqat chop etilgan kursga e'lon yuboriladi" }
        }
        val recipients = recipients(announcement)
        require(recipients.isNotEmpty()) { "Tanlangan auditoriyada faol qabul qiluvchi yo'q" }
        val now = Instant.now()
        announcement.status = AnnouncementStatus.PUBLISHED
        announcement.publishedAt = now
        announcement.publishedBy = actor
        announcementRepository.save(announcement)

        val channels = parseChannels(announcement.channels)
        recipients.forEach { recipient ->
            channels.forEach { channel ->
                val delivery = deliveryRepository.save(AnnouncementDelivery(
                    announcement = announcement,
                    recipient = recipient,
                    channel = channel,
                ))
                if (channel == AnnouncementChannel.IN_APP) dispatchInApp(delivery)
                else integrationOutboxService.enqueueAnnouncementDelivery(delivery)
            }
        }
        return dto(announcement, actorId, mayManageAll)
    }

    @Transactional
    fun archive(id: Long, actorId: Long, mayManageAll: Boolean): AnnouncementDto {
        val actor = activeUser(actorId)
        val announcement = manageable(id, actorId, mayManageAll)
        require(announcement.status != AnnouncementStatus.ARCHIVED) { "E'lon avval arxivlangan" }
        announcement.status = AnnouncementStatus.ARCHIVED
        announcement.archivedAt = Instant.now()
        announcement.archivedBy = actor
        return dto(announcementRepository.save(announcement), actorId, mayManageAll)
    }

    @Transactional(readOnly = true)
    fun inbox(actorId: Long): List<AnnouncementInboxDto> {
        activeUser(actorId)
        return deliveryRepository.inbox(
            actorId,
            AnnouncementChannel.IN_APP,
            listOf(AnnouncementStatus.PUBLISHED, AnnouncementStatus.ARCHIVED),
        ).filter { it.status in setOf(AnnouncementDeliveryStatus.DELIVERED, AnnouncementDeliveryStatus.READ) }
            .map(::inboxDto)
    }

    @Transactional
    fun markRead(announcementId: Long, actorId: Long): AnnouncementInboxDto {
        activeUser(actorId)
        val delivery = deliveryRepository.findByAnnouncementIdAndRecipientIdAndChannelAndDeletedFalse(
            announcementId,
            actorId,
            AnnouncementChannel.IN_APP,
        ) ?: throw NoSuchElementException("E'lon qabul qiluvchiga yetkazilmagan")
        require(delivery.status in setOf(AnnouncementDeliveryStatus.DELIVERED, AnnouncementDeliveryStatus.READ)) {
            "Yetkazilmagan e'lonni o'qildi deb belgilab bo'lmaydi"
        }
        if (delivery.status != AnnouncementDeliveryStatus.READ) {
            delivery.status = AnnouncementDeliveryStatus.READ
            delivery.readAt = Instant.now()
            deliveryRepository.save(delivery)
        }
        return inboxDto(delivery)
    }

    @Transactional(readOnly = true)
    fun deliveryReport(id: Long, actorId: Long, mayManageAll: Boolean): AnnouncementDeliveryReportDto {
        manageable(id, actorId, mayManageAll)
        val deliveries = deliveryRepository.findAllByAnnouncementIdAndDeletedFalseOrderByRecipientFullNameAscChannelAsc(id)
        return AnnouncementDeliveryReportDto(id, stats(deliveries), deliveries.map(::deliveryDto))
    }

    @Transactional
    fun retry(id: Long, actorId: Long, mayManageAll: Boolean): AnnouncementRetryResultDto {
        val announcement = manageable(id, actorId, mayManageAll)
        require(announcement.status != AnnouncementStatus.DRAFT) { "Chop etilmagan e'lon yetkazilishi qayta urinilmaydi" }
        val deliveries = deliveryRepository.findAllByAnnouncementIdAndDeletedFalseOrderByRecipientFullNameAscChannelAsc(id)
            .filter { it.channel != AnnouncementChannel.IN_APP }
            .filter { it.status in setOf(AnnouncementDeliveryStatus.PENDING, AnnouncementDeliveryStatus.FAILED, AnnouncementDeliveryStatus.SKIPPED) }
        val selected = integrationOutboxService.retryAnnouncementDeliveries(deliveries, actorId)
        return AnnouncementRetryResultDto(
            attempted = selected,
            delivered = 0,
            failed = deliveries.count { it.status == AnnouncementDeliveryStatus.FAILED },
            skipped = deliveries.count { it.status == AnnouncementDeliveryStatus.SKIPPED },
        )
    }

    private fun dispatchInApp(delivery: AnnouncementDelivery) {
        require(delivery.channel == AnnouncementChannel.IN_APP)
        delivery.attemptCount += 1
        delivery.lastAttemptAt = Instant.now()
        val result = deliveryGateway.dispatch(
            delivery.channel,
            requireNotNull(delivery.id),
            delivery.announcement,
            delivery.recipient,
        )
        delivery.destinationMasked = result.destinationMasked
        delivery.providerReference = result.providerReference
        delivery.lastError = result.error?.take(1000)
        delivery.status = when {
            result.delivered -> AnnouncementDeliveryStatus.DELIVERED
            result.skipped -> AnnouncementDeliveryStatus.SKIPPED
            else -> AnnouncementDeliveryStatus.FAILED
        }
        delivery.deliveredAt = if (result.delivered) Instant.now() else null
        deliveryRepository.save(delivery)
    }

    private fun recipients(announcement: Announcement): List<User> = when (announcement.audience) {
        AnnouncementAudience.INSTITUTION -> userRepository.findAllByStatus(UserStatus.ACTIVE)
            .filter { !it.deleted && it.id != null }
        AnnouncementAudience.COURSE -> enrollmentRepository
            .findAllByCourseIdAndDeletedFalseOrderByEnrolledAtDesc(requireNotNull(announcement.course?.id))
            .filter { it.status == CourseEnrollmentStatus.ACTIVE }
            .map { it.student.user }
            .filter { !it.deleted && it.status == UserStatus.ACTIVE && it.id != null }
            .distinctBy { it.id }
    }

    private fun normalize(
        request: AnnouncementUpsertRequest,
        actorId: Long,
        mayManageAll: Boolean,
    ): NormalizedAnnouncement {
        val title = requiredText(request.title, "Sarlavha", 3, 250)
        val body = requiredText(request.body, "E'lon matni", 3, 10000)
        val audience = enumValue<AnnouncementAudience>(request.audience, "Auditoriya")
        val category = enumValue<AnnouncementCategory>(request.category, "Kategoriya")
        val priority = enumValue<AnnouncementPriority>(request.priority, "Muhimlik")
        val channels = request.channels.map { enumValue<AnnouncementChannel>(it, "Kanal") }.toSet()
        require(channels.isNotEmpty() && AnnouncementChannel.IN_APP in channels) { "IN_APP kanali majburiy" }
        val course = when (audience) {
            AnnouncementAudience.COURSE -> course(request.courseId, actorId, mayManageAll)
            AnnouncementAudience.INSTITUTION -> {
                require(mayManageAll) { "Tashkilot e'lonini faqat administrator/metodist yaratadi" }
                require(request.courseId == null) { "Tashkilot e'lonida kurs tanlanmaydi" }
                null
            }
        }
        val actionUrl = request.actionUrl?.trim()?.takeUnless(String::isBlank)?.also {
            require(it.length <= 500 && it.startsWith("/") && !it.startsWith("//")) { "Havola ichki / yo'l bo'lishi kerak" }
        }
        return NormalizedAnnouncement(title, body, audience, course, category, priority, channels.sortedBy { it.ordinal }, actionUrl)
    }

    private fun course(courseId: Long?, actorId: Long, mayManageAll: Boolean): Course {
        val course = courseRepository.findById(requireNotNull(courseId) { "Kurs tanlanishi shart" })
            .filter { !it.deleted }
            .orElseThrow { NoSuchElementException("Kurs topilmadi") }
        require(mayManageAll || course.userId == actorId) { "Faqat o'zingizga tegishli kurs uchun e'lon yaratasiz" }
        return course
    }

    private fun manageable(id: Long, actorId: Long, mayManageAll: Boolean): Announcement {
        val announcement = announcementRepository.findByIdAndDeletedFalse(id)
            ?: throw NoSuchElementException("E'lon topilmadi: $id")
        require(mayManageAll || announcement.author.id == actorId) { "E'lonni boshqarish ruxsati yo'q" }
        return announcement
    }

    private fun dto(announcement: Announcement, actorId: Long, mayManageAll: Boolean): AnnouncementDto {
        val deliveries = announcement.id?.let {
            deliveryRepository.findAllByAnnouncementIdAndDeletedFalseOrderByRecipientFullNameAscChannelAsc(it)
        }.orEmpty()
        val deliveryStats = stats(deliveries)
        val canManage = mayManageAll || announcement.author.id == actorId
        return AnnouncementDto(
            id = requireNotNull(announcement.id),
            title = announcement.title,
            body = announcement.body,
            audience = announcement.audience.name,
            courseId = announcement.course?.id,
            courseTitle = announcement.course?.title,
            category = announcement.category.name,
            priority = announcement.priority.name,
            status = announcement.status.name,
            channels = parseChannels(announcement.channels).map { it.name }.toSet(),
            actionUrl = announcement.actionUrl,
            authorId = requireNotNull(announcement.author.id),
            authorName = announcement.author.displayName(),
            publishedAt = announcement.publishedAt,
            archivedAt = announcement.archivedAt,
            createdAt = announcement.createdAt,
            recipientCount = deliveries.filter { it.channel == AnnouncementChannel.IN_APP }.map { it.recipient.id }.distinct().size.toLong(),
            readCount = deliveries.count { it.channel == AnnouncementChannel.IN_APP && it.status == AnnouncementDeliveryStatus.READ }.toLong(),
            deliveryStats = deliveryStats,
            canEdit = canManage && announcement.status == AnnouncementStatus.DRAFT,
            canPublish = canManage && announcement.status == AnnouncementStatus.DRAFT,
            canArchive = canManage && announcement.status != AnnouncementStatus.ARCHIVED,
            canRetry = canManage && deliveryStats.any { it.pending + it.failed + it.skipped > 0 },
        )
    }

    private fun inboxDto(delivery: AnnouncementDelivery): AnnouncementInboxDto {
        val announcement = delivery.announcement
        return AnnouncementInboxDto(
            id = requireNotNull(announcement.id),
            deliveryId = requireNotNull(delivery.id),
            title = announcement.title,
            body = announcement.body,
            audience = announcement.audience.name,
            courseId = announcement.course?.id,
            courseTitle = announcement.course?.title,
            category = announcement.category.name,
            priority = announcement.priority.name,
            actionUrl = announcement.actionUrl,
            authorName = announcement.author.displayName(),
            publishedAt = requireNotNull(announcement.publishedAt),
            read = delivery.status == AnnouncementDeliveryStatus.READ,
            readAt = delivery.readAt,
        )
    }

    private fun deliveryDto(delivery: AnnouncementDelivery) = AnnouncementDeliveryDto(
        id = requireNotNull(delivery.id),
        recipientId = requireNotNull(delivery.recipient.id),
        recipientName = delivery.recipient.displayName(),
        channel = delivery.channel.name,
        status = delivery.status.name,
        attemptCount = delivery.attemptCount,
        destinationMasked = delivery.destinationMasked,
        providerReference = delivery.providerReference,
        lastAttemptAt = delivery.lastAttemptAt,
        deliveredAt = delivery.deliveredAt,
        readAt = delivery.readAt,
        lastError = delivery.lastError,
    )

    private fun stats(deliveries: List<AnnouncementDelivery>): List<AnnouncementDeliveryStatDto> =
        AnnouncementChannel.entries.map { channel ->
            val values = deliveries.filter { it.channel == channel }
            AnnouncementDeliveryStatDto(
                channel = channel.name,
                pending = values.count { it.status == AnnouncementDeliveryStatus.PENDING }.toLong(),
                delivered = values.count { it.status == AnnouncementDeliveryStatus.DELIVERED }.toLong(),
                read = values.count { it.status == AnnouncementDeliveryStatus.READ }.toLong(),
                failed = values.count { it.status == AnnouncementDeliveryStatus.FAILED }.toLong(),
                skipped = values.count { it.status == AnnouncementDeliveryStatus.SKIPPED }.toLong(),
            )
        }

    private fun parseChannels(csv: String): Set<AnnouncementChannel> = csv.split(',')
        .filter(String::isNotBlank)
        .map { AnnouncementChannel.valueOf(it) }
        .toSet()

    private inline fun <reified T : Enum<T>> enumValue(value: String, label: String): T =
        runCatching { enumValueOf<T>(value.trim().uppercase()) }
            .getOrElse { throw IllegalArgumentException("$label noto'g'ri") }

    private fun requiredText(value: String, label: String, min: Int, max: Int): String = value.trim().also {
        require(it.length in min..max) { "$label uzunligi $min dan $max gacha bo'lishi kerak" }
    }

    private fun activeUser(userId: Long): User = userRepository.findById(userId)
        .filter { !it.deleted && it.status == UserStatus.ACTIVE }
        .orElseThrow { IllegalArgumentException("Faol foydalanuvchi topilmadi: $userId") }

    private fun User.displayName(): String = fullName?.trim().takeUnless { it.isNullOrBlank() } ?: username

    private data class NormalizedAnnouncement(
        val title: String,
        val body: String,
        val audience: AnnouncementAudience,
        val course: Course?,
        val category: AnnouncementCategory,
        val priority: AnnouncementPriority,
        val channels: List<AnnouncementChannel>,
        val actionUrl: String?,
    )

}
