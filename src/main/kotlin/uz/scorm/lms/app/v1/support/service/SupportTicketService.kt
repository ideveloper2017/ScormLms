package uz.scorm.lms.app.v1.support.service

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.audit.service.AuditService
import uz.scorm.lms.app.v1.courses.model.Course
import uz.scorm.lms.app.v1.courses.model.CourseEnrollmentStatus
import uz.scorm.lms.app.v1.courses.repository.CourseEnrollmentRepository
import uz.scorm.lms.app.v1.courses.repository.CourseRepository
import uz.scorm.lms.app.v1.notification.dto.CreateNotificationRequest
import uz.scorm.lms.app.v1.notification.service.NotificationService
import uz.scorm.lms.app.v1.support.dto.*
import uz.scorm.lms.app.v1.support.model.*
import uz.scorm.lms.app.v1.support.repository.SupportTicketEventRepository
import uz.scorm.lms.app.v1.support.repository.SupportTicketRepository
import uz.scorm.lms.app.v1.user.model.User
import uz.scorm.lms.app.v1.user.model.UserStatus
import uz.scorm.lms.app.v1.user.repository.UserRepository
import java.time.Duration
import java.time.Instant
import java.util.UUID
import kotlin.math.round

@Service
class SupportTicketService(
    private val ticketRepository: SupportTicketRepository,
    private val eventRepository: SupportTicketEventRepository,
    private val userRepository: UserRepository,
    private val courseRepository: CourseRepository,
    private val enrollmentRepository: CourseEnrollmentRepository,
    private val auditService: AuditService,
    private val notificationService: NotificationService,
    private val slaPolicy: SupportSlaPolicy,
) {
    @Transactional(readOnly = true)
    fun myTickets(actorId: Long): List<SupportTicketSummaryDto> {
        activeUser(actorId)
        return ticketRepository.findAllByRequesterIdAndDeletedFalseOrderByLastActivityAtDesc(actorId).map(::summary)
    }

    @Transactional(readOnly = true)
    fun queue(
        actorId: Long,
        status: String?,
        assigneeId: Long?,
        breachedOnly: Boolean,
    ): List<SupportTicketSummaryDto> {
        activeUser(actorId)
        val normalizedStatus = status?.takeUnless(String::isBlank)?.let { enumValue<SupportTicketStatus>(it, "Holat") }
        return ticketRepository.findAllByDeletedFalseOrderByLastActivityAtDesc().asSequence()
            .filter { normalizedStatus == null || it.status == normalizedStatus }
            .filter { assigneeId == null || it.assignee?.id == assigneeId }
            .filter { !breachedOnly || sla(it).let { value -> value.responseBreached || value.resolutionBreached } }
            .map(::summary)
            .toList()
    }

    @Transactional(readOnly = true)
    fun assignees(): List<SupportAssigneeDto> = userRepository.findAllByStatus(UserStatus.ACTIVE).asSequence()
        .filter { !it.deleted && it.role?.name?.lowercase() in SUPPORT_ROLES }
        .sortedBy { it.displayName().lowercase() }
        .map { SupportAssigneeDto(requireNotNull(it.id), it.displayName(), it.username, it.role?.name) }
        .toList()

    @Transactional(readOnly = true)
    fun detail(id: Long, actorId: Long, manager: Boolean, mayOverride: Boolean): SupportTicketDetailDto {
        val ticket = find(id)
        require(manager || ticket.requester.id == actorId) { "Murojaatni ko'rish ruxsati yo'q" }
        val canManage = manager && (ticket.assignee == null || ticket.assignee?.id == actorId || mayOverride)
        val events = eventRepository.findAllByTicketIdAndDeletedFalseOrderBySequenceNoAsc(id)
            .filter { manager || it.visibility == SupportEventVisibility.PUBLIC }
            .map(::eventDto)
        return detailDto(ticket, actorId, manager, canManage, events)
    }

    @Transactional
    fun create(request: CreateSupportTicketRequest, actorId: Long): SupportTicketDetailDto {
        val actor = activeUser(actorId)
        val subject = requiredText(request.subject, "Mavzu", 5, 250)
        val description = requiredText(request.description, "Tavsif", 10, 10000)
        val category = enumValue<SupportCategory>(request.category, "Kategoriya")
        val impact = enumValue<SupportImpact>(request.impact, "Ta'sir")
        val priority = priority(impact)
        val course = request.courseId?.let { relatedCourse(it, actorId) }
        val now = Instant.now()
        val policy = slaPolicy.target(priority)
        val ticket = ticketRepository.save(SupportTicket(
            ticketCode = "SUP-${UUID.randomUUID().toString().replace("-", "").take(12).uppercase()}",
            requester = actor,
            course = course,
            subject = subject,
            description = description,
            category = category,
            impact = impact,
            priority = priority,
            slaPolicyVersion = slaPolicy.version,
            responseDueAt = now.plus(policy.response),
            resolutionDueAt = now.plus(policy.resolution),
            lastActivityAt = now,
        ))
        addEvent(ticket, actor, SupportEventType.CREATED, "Murojaat yaratildi")
        auditService.logAction("SUPPORT_TICKET_CREATED", actorId, "ticket=${ticket.id}; category=$category; impact=$impact; priority=$priority")
        return detail(requireNotNull(ticket.id), actorId, false, false)
    }

    @Transactional
    fun assign(id: Long, request: SupportAssignRequest, actorId: Long): SupportTicketDetailDto {
        val actor = activeUser(actorId)
        val ticket = locked(id)
        require(ticket.status !in TERMINAL) { "Yakunlangan murojaatga mas'ul biriktirilmaydi" }
        val assignee = activeUser(request.assigneeId)
        require(assignee.role?.name?.lowercase() in SUPPORT_ROLES) { "Tanlangan foydalanuvchi support mas'uli emas" }
        ticket.assignee = assignee
        ticket.lastActivityAt = Instant.now()
        ticketRepository.save(ticket)
        addEvent(ticket, actor, SupportEventType.ASSIGNED, "Mas'ul: ${assignee.displayName()}")
        auditService.logAction("SUPPORT_TICKET_ASSIGNED", actorId, "ticket=$id; assignee=${assignee.id}")
        notify(assignee, ticket, "Sizga support murojaati biriktirildi", "${ticket.ticketCode}: ${ticket.subject}")
        return detail(id, actorId, true, true)
    }

    @Transactional
    fun comment(
        id: Long,
        request: SupportCommentRequest,
        actorId: Long,
        manager: Boolean,
        mayOverride: Boolean,
    ): SupportTicketDetailDto {
        val actor = activeUser(actorId)
        val ticket = locked(id)
        require(ticket.status !in TERMINAL) { "Yakunlangan murojaatga izoh yozilmaydi" }
        val body = requiredText(request.body, "Izoh", 2, 5000)
        if (manager) {
            require(ticket.assignee == null || ticket.assignee?.id == actorId || mayOverride) { "Murojaat boshqa mas'ulga biriktirilgan" }
            if (ticket.assignee == null) ticket.assignee = actor
            if (!request.internal && ticket.firstRespondedAt == null) ticket.firstRespondedAt = Instant.now()
        } else {
            require(ticket.requester.id == actorId) { "Murojaatga izoh yozish ruxsati yo'q" }
            require(!request.internal) { "Ichki izoh faqat support xodimiga ruxsat" }
            if (ticket.status == SupportTicketStatus.WAITING_REQUESTER) {
                changeStatusState(ticket, SupportTicketStatus.IN_PROGRESS, actor)
            }
        }
        ticket.lastActivityAt = Instant.now()
        ticketRepository.save(ticket)
        addEvent(
            ticket,
            actor,
            SupportEventType.COMMENT,
            body,
            if (request.internal) SupportEventVisibility.INTERNAL else SupportEventVisibility.PUBLIC,
        )
        auditService.logAction("SUPPORT_TICKET_COMMENTED", actorId, "ticket=$id; internal=${request.internal}")
        if (!request.internal) {
            val recipient = if (manager) ticket.requester else ticket.assignee
            recipient?.takeIf { it.id != actorId }?.let { notify(it, ticket, "Support murojaatida yangi javob", "${ticket.ticketCode}: ${ticket.subject}") }
        }
        return detail(id, actorId, manager, mayOverride)
    }

    @Transactional
    fun changeStatus(
        id: Long,
        request: SupportStatusRequest,
        actorId: Long,
        mayOverride: Boolean,
    ): SupportTicketDetailDto {
        val actor = activeUser(actorId)
        val ticket = locked(id)
        require(ticket.assignee?.id == actorId || mayOverride) { "Faqat biriktirilgan mas'ul holatni o'zgartiradi" }
        val target = enumValue<SupportTicketStatus>(request.status, "Holat")
        require(target in allowedManagerStatuses(ticket.status)) { "${ticket.status} holatidan $target holatiga o'tib bo'lmaydi" }
        if (target == SupportTicketStatus.RESOLVED) {
            ticket.resolutionSummary = requiredText(request.resolutionSummary.orEmpty(), "Yechim", 5, 5000)
        }
        if (ticket.firstRespondedAt == null) ticket.firstRespondedAt = Instant.now()
        changeStatusState(ticket, target, actor)
        ticket.lastActivityAt = Instant.now()
        ticketRepository.save(ticket)
        auditService.logAction("SUPPORT_TICKET_STATUS_CHANGED", actorId, "ticket=$id; status=$target")
        notify(ticket.requester, ticket, "Support murojaati holati yangilandi", "${ticket.ticketCode}: $target")
        return detail(id, actorId, true, mayOverride)
    }

    @Transactional
    fun cancel(id: Long, actorId: Long): SupportTicketDetailDto {
        val actor = activeUser(actorId)
        val ticket = locked(id)
        require(ticket.requester.id == actorId) { "Faqat murojaat egasi bekor qiladi" }
        require(ticket.status in setOf(SupportTicketStatus.OPEN, SupportTicketStatus.IN_PROGRESS, SupportTicketStatus.WAITING_REQUESTER)) {
            "Bu holatdagi murojaat bekor qilinmaydi"
        }
        changeStatusState(ticket, SupportTicketStatus.CANCELLED, actor)
        ticket.lastActivityAt = Instant.now()
        ticketRepository.save(ticket)
        auditService.logAction("SUPPORT_TICKET_CANCELLED", actorId, "ticket=$id")
        return detail(id, actorId, false, false)
    }

    @Transactional
    fun reopen(id: Long, actorId: Long): SupportTicketDetailDto {
        val actor = activeUser(actorId)
        val ticket = locked(id)
        require(ticket.requester.id == actorId) { "Faqat murojaat egasi qayta ochadi" }
        require(ticket.status == SupportTicketStatus.RESOLVED) { "Faqat yechilgan murojaat qayta ochiladi" }
        require(ticket.resolvedAt?.plus(REOPEN_WINDOW)?.isAfter(Instant.now()) == true) { "Qayta ochish uchun 7 kunlik muddat tugagan" }
        val from = ticket.status
        ticket.status = SupportTicketStatus.OPEN
        ticket.resolvedAt = null
        ticket.resolutionSummary = null
        ticket.resolutionDueAt = Instant.now().plus(slaPolicy.target(ticket.priority).resolution)
        ticket.lastActivityAt = Instant.now()
        ticketRepository.save(ticket)
        addEvent(ticket, actor, SupportEventType.REOPENED, "Murojaat qayta ochildi", from = from, to = ticket.status)
        auditService.logAction("SUPPORT_TICKET_REOPENED", actorId, "ticket=$id")
        ticket.assignee?.let { notify(it, ticket, "Support murojaati qayta ochildi", "${ticket.ticketCode}: ${ticket.subject}") }
        return detail(id, actorId, false, false)
    }

    @Transactional(readOnly = true)
    fun metrics(actorId: Long): SupportQueueMetricsDto {
        activeUser(actorId)
        val now = Instant.now()
        val tickets = ticketRepository.findAllByDeletedFalseOrderByLastActivityAtDesc()
        val active = tickets.filter { it.status !in TERMINAL && it.status != SupportTicketStatus.RESOLVED }
        val sla = active.associateWith(::sla)
        val responded = tickets.filter { it.firstRespondedAt != null && it.createdAt != null }
        val resolved = tickets.filter { it.resolvedAt != null && it.createdAt != null }
        return SupportQueueMetricsDto(
            totalActive = active.size.toLong(),
            unassigned = active.count { it.assignee == null }.toLong(),
            responseBreached = sla.values.count { it.responseBreached }.toLong(),
            resolutionBreached = sla.values.count { it.resolutionBreached }.toLong(),
            dueWithinFourHours = active.count {
                !sla.getValue(it).resolutionBreached && Duration.between(now, it.resolutionDueAt).seconds in 0..14_400
            }.toLong(),
            resolved = tickets.count { it.status in setOf(SupportTicketStatus.RESOLVED, SupportTicketStatus.CLOSED) }.toLong(),
            averageFirstResponseMinutes = averageMinutes(responded.map { Duration.between(it.createdAt, it.firstRespondedAt).seconds }),
            averageResolutionMinutes = averageMinutes(resolved.map { Duration.between(it.createdAt, it.resolvedAt).seconds }),
            byStatus = SupportTicketStatus.entries.associate { status -> status.name to tickets.count { it.status == status }.toLong() },
            measuredAt = now,
        )
    }

    private fun changeStatusState(ticket: SupportTicket, target: SupportTicketStatus, actor: User) {
        val from = ticket.status
        if (from == SupportTicketStatus.WAITING_REQUESTER && target != SupportTicketStatus.WAITING_REQUESTER) resumeSla(ticket)
        if (target == SupportTicketStatus.WAITING_REQUESTER && from != SupportTicketStatus.WAITING_REQUESTER) ticket.slaPausedAt = Instant.now()
        when (target) {
            SupportTicketStatus.RESOLVED -> {
                if (ticket.slaPausedAt != null) resumeSla(ticket)
                ticket.resolvedAt = Instant.now()
            }
            SupportTicketStatus.CLOSED -> ticket.closedAt = Instant.now()
            SupportTicketStatus.CANCELLED -> {
                ticket.cancelledAt = Instant.now()
                if (ticket.slaPausedAt != null) resumeSla(ticket)
            }
            SupportTicketStatus.IN_PROGRESS -> if (from == SupportTicketStatus.RESOLVED) {
                ticket.resolvedAt = null
                ticket.resolutionSummary = null
                ticket.resolutionDueAt = Instant.now().plus(slaPolicy.target(ticket.priority).resolution)
            }
            else -> Unit
        }
        ticket.status = target
        val type = when (target) {
            SupportTicketStatus.RESOLVED -> SupportEventType.RESOLVED
            SupportTicketStatus.CLOSED -> SupportEventType.CLOSED
            SupportTicketStatus.CANCELLED -> SupportEventType.CANCELLED
            else -> SupportEventType.STATUS_CHANGED
        }
        addEvent(ticket, actor, type, ticket.resolutionSummary ?: "Holat: $target", from = from, to = target)
    }

    private fun resumeSla(ticket: SupportTicket) {
        val pausedAt = ticket.slaPausedAt ?: return
        val seconds = Duration.between(pausedAt, Instant.now()).seconds.coerceAtLeast(0)
        ticket.slaPausedSeconds += seconds
        ticket.responseDueAt = ticket.responseDueAt.plusSeconds(seconds)
        ticket.resolutionDueAt = ticket.resolutionDueAt.plusSeconds(seconds)
        ticket.slaPausedAt = null
    }

    private fun addEvent(
        ticket: SupportTicket,
        actor: User,
        type: SupportEventType,
        body: String?,
        visibility: SupportEventVisibility = SupportEventVisibility.PUBLIC,
        from: SupportTicketStatus? = null,
        to: SupportTicketStatus? = null,
    ) {
        val id = requireNotNull(ticket.id)
        val sequence = (eventRepository.findFirstByTicketIdAndDeletedFalseOrderBySequenceNoDesc(id)?.sequenceNo ?: 0) + 1
        eventRepository.save(SupportTicketEvent(ticket, sequence, actor, type, visibility, body, from, to))
    }

    private fun summary(ticket: SupportTicket) = SupportTicketSummaryDto(
        id = requireNotNull(ticket.id),
        ticketCode = ticket.ticketCode,
        subject = ticket.subject,
        category = ticket.category.name,
        impact = ticket.impact.name,
        priority = ticket.priority.name,
        status = ticket.status.name,
        requesterId = requireNotNull(ticket.requester.id),
        requesterName = ticket.requester.displayName(),
        assigneeId = ticket.assignee?.id,
        assigneeName = ticket.assignee?.displayName(),
        courseId = ticket.course?.id,
        courseTitle = ticket.course?.title,
        sla = sla(ticket),
        lastActivityAt = ticket.lastActivityAt,
        createdAt = ticket.createdAt,
    )

    private fun detailDto(
        ticket: SupportTicket,
        actorId: Long,
        manager: Boolean,
        canManage: Boolean,
        events: List<SupportTicketEventDto>,
    ) = SupportTicketDetailDto(
        ticket = summary(ticket),
        description = ticket.description,
        resolutionSummary = ticket.resolutionSummary,
        events = events,
        canComment = ticket.status !in TERMINAL && (manager || ticket.requester.id == actorId),
        canCancel = !manager && ticket.requester.id == actorId && ticket.status in setOf(SupportTicketStatus.OPEN, SupportTicketStatus.IN_PROGRESS, SupportTicketStatus.WAITING_REQUESTER),
        canReopen = !manager && ticket.requester.id == actorId && ticket.status == SupportTicketStatus.RESOLVED && ticket.resolvedAt?.plus(REOPEN_WINDOW)?.isAfter(Instant.now()) == true,
        canManage = canManage,
        allowedStatuses = if (canManage) allowedManagerStatuses(ticket.status).map { it.name }.sorted() else emptyList(),
    )

    private fun eventDto(event: SupportTicketEvent) = SupportTicketEventDto(
        id = requireNotNull(event.id), sequenceNo = event.sequenceNo, actorId = requireNotNull(event.actor.id),
        actorName = event.actor.displayName(), eventType = event.eventType.name, visibility = event.visibility.name,
        body = event.body, fromStatus = event.fromStatus?.name, toStatus = event.toStatus?.name, occurredAt = event.occurredAt,
    )

    private fun sla(ticket: SupportTicket): SupportSlaDto {
        val evaluation = ticket.slaPausedAt ?: Instant.now()
        val responseReference = ticket.firstRespondedAt ?: evaluation
        val resolutionReference = ticket.resolvedAt ?: evaluation
        val active = ticket.status !in TERMINAL
        return SupportSlaDto(
            policyVersion = ticket.slaPolicyVersion,
            responseDueAt = ticket.responseDueAt,
            resolutionDueAt = ticket.resolutionDueAt,
            firstRespondedAt = ticket.firstRespondedAt,
            resolvedAt = ticket.resolvedAt,
            paused = ticket.slaPausedAt != null,
            pausedSeconds = ticket.slaPausedSeconds + (ticket.slaPausedAt?.let { Duration.between(it, Instant.now()).seconds.coerceAtLeast(0) } ?: 0),
            responseBreached = responseReference.isAfter(ticket.responseDueAt),
            resolutionBreached = ticket.status != SupportTicketStatus.CANCELLED && resolutionReference.isAfter(ticket.resolutionDueAt),
            responseRemainingSeconds = if (ticket.firstRespondedAt == null && active) Duration.between(evaluation, ticket.responseDueAt).seconds else null,
            resolutionRemainingSeconds = if (ticket.resolvedAt == null && active) Duration.between(evaluation, ticket.resolutionDueAt).seconds else null,
        )
    }

    private fun relatedCourse(courseId: Long, actorId: Long): Course {
        val course = courseRepository.findById(courseId).filter { !it.deleted }.orElseThrow { NoSuchElementException("Kurs topilmadi") }
        val related = course.userId == actorId || enrollmentRepository.existsByCourseIdAndStudentUserIdAndStatusInAndDeletedFalse(
            courseId, actorId, listOf(CourseEnrollmentStatus.ACTIVE, CourseEnrollmentStatus.COMPLETED),
        )
        require(related) { "Faqat aloqador kurs bo'yicha murojaat yuboriladi" }
        return course
    }

    private fun notify(user: User, ticket: SupportTicket, title: String, message: String) {
        notificationService.create(CreateNotificationRequest(
            userId = requireNotNull(user.id), title = title, message = message, type = "system",
            priority = if (ticket.priority == SupportPriority.URGENT) "urgent" else "normal",
            relatedId = ticket.id.toString(), actionUrl = "/support?ticket=${ticket.id}",
        ))
    }

    private fun allowedManagerStatuses(status: SupportTicketStatus): Set<SupportTicketStatus> = when (status) {
        SupportTicketStatus.OPEN -> setOf(SupportTicketStatus.IN_PROGRESS, SupportTicketStatus.WAITING_REQUESTER, SupportTicketStatus.RESOLVED)
        SupportTicketStatus.IN_PROGRESS -> setOf(SupportTicketStatus.WAITING_REQUESTER, SupportTicketStatus.RESOLVED)
        SupportTicketStatus.WAITING_REQUESTER -> setOf(SupportTicketStatus.IN_PROGRESS, SupportTicketStatus.RESOLVED)
        SupportTicketStatus.RESOLVED -> setOf(SupportTicketStatus.IN_PROGRESS, SupportTicketStatus.CLOSED)
        SupportTicketStatus.CLOSED, SupportTicketStatus.CANCELLED -> emptySet()
    }

    private fun priority(impact: SupportImpact) = when (impact) {
        SupportImpact.LIMITED -> SupportPriority.LOW
        SupportImpact.MULTIPLE_USERS -> SupportPriority.NORMAL
        SupportImpact.SERVICE_BLOCKED -> SupportPriority.HIGH
        SupportImpact.SECURITY -> SupportPriority.URGENT
    }

    private fun find(id: Long) = ticketRepository.findByIdAndDeletedFalse(id) ?: throw NoSuchElementException("Murojaat topilmadi: $id")
    private fun locked(id: Long) = ticketRepository.findFirstByIdAndDeletedFalse(id) ?: throw NoSuchElementException("Murojaat topilmadi: $id")
    private fun activeUser(id: Long): User = userRepository.findById(id).filter { !it.deleted && it.status == UserStatus.ACTIVE }
        .orElseThrow { IllegalArgumentException("Faol foydalanuvchi topilmadi: $id") }
    private fun User.displayName(): String = fullName?.trim().takeUnless { it.isNullOrBlank() } ?: username
    private fun requiredText(value: String, label: String, min: Int, max: Int): String = value.trim().also { require(it.length in min..max) { "$label uzunligi $min dan $max gacha bo'lishi kerak" } }
    private inline fun <reified T : Enum<T>> enumValue(value: String, label: String): T = runCatching { enumValueOf<T>(value.trim().uppercase()) }
        .getOrElse { throw IllegalArgumentException("$label noto'g'ri") }
    private fun averageMinutes(seconds: List<Long>): Double? = seconds.takeIf { it.isNotEmpty() }?.average()?.div(60.0)?.let { round(it * 10) / 10 }

    companion object {
        private val TERMINAL = setOf(SupportTicketStatus.CLOSED, SupportTicketStatus.CANCELLED)
        private val SUPPORT_ROLES = setOf("super_admin", "admin", "metodist")
        private val REOPEN_WINDOW: Duration = Duration.ofDays(7)
    }
}
