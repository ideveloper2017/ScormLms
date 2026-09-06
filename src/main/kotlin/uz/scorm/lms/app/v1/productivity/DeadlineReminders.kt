package uz.scorm.lms.app.v1.productivity

import jakarta.persistence.*
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import mu.KotlinLogging
import uz.scorm.lms.app.v1.assignment.model.AssignmentStatus
import uz.scorm.lms.app.v1.assignment.model.CourseAssignment
import uz.scorm.lms.app.v1.assignment.model.SubmissionStatus
import uz.scorm.lms.app.v1.assignment.repository.AssignmentSubmissionRepository
import uz.scorm.lms.app.v1.courses.model.CourseEnrollmentStatus
import uz.scorm.lms.app.v1.courses.model.CourseStatus
import uz.scorm.lms.app.v1.courses.repository.CourseEnrollmentRepository
import uz.scorm.lms.app.v1.notification.dto.CreateNotificationRequest
import uz.scorm.lms.app.v1.notification.service.NotificationService
import uz.scorm.lms.app.v1.user.model.UserStatus
import java.time.Instant

@Entity
@Table(name = "deadline_reminder_deliveries")
class DeadlineReminderDelivery(
    @Id @Column(length = 180) var id: String = "",
    @Column(name = "sent_at", nullable = false) var sentAt: Instant = Instant.now(),
)

@Service
class DeadlineReminderService(
    private val em: EntityManager,
    private val enrollments: CourseEnrollmentRepository,
    private val submissions: AssignmentSubmissionRepository,
    private val notifications: NotificationService,
) {
    @Transactional(readOnly = true)
    fun dueIds(afterId: Long, now: Instant): List<Long> = em.createQuery("""
        select a.id from CourseAssignment a where a.deleted = false and a.id > :afterId
        and a.status = :status and a.dueAt > :now and a.dueAt <= :until order by a.id
    """.trimIndent(), java.lang.Long::class.java).setParameter("afterId", afterId)
        .setParameter("status", AssignmentStatus.PUBLISHED).setParameter("now", now)
        .setParameter("until", now.plusSeconds(86_400)).setMaxResults(100).resultList.map { it.toLong() }

    @Transactional
    fun deliver(assignmentId: Long, now: Instant = Instant.now()): Int {
        // Serialize delivery for this assignment across workers. The ledger survives
        // notification deletion and uses the deadline so rescheduling is supported.
        val assignment = em.find(CourseAssignment::class.java, assignmentId, LockModeType.PESSIMISTIC_WRITE) ?: return 0
        if (assignment.deleted || assignment.status != AssignmentStatus.PUBLISHED || assignment.course.deleted ||
            assignment.course.status != CourseStatus.PUBLISHED.name || assignment.dueAt <= now || assignment.dueAt > now.plusSeconds(86_400)) return 0
        val completed = submissions.findAllByAssignmentIdAndDeletedFalseOrderBySubmittedAtDesc(assignmentId)
            .distinctBy { it.enrollment.id }.filter { it.status in setOf(SubmissionStatus.SUBMITTED, SubmissionStatus.GRADED) }
            .map { it.enrollment.id }.toSet()
        var sent = 0
        enrollments.findAllByCourseIdAndDeletedFalseOrderByEnrolledAtDesc(requireNotNull(assignment.course.id))
            .filter { it.status == CourseEnrollmentStatus.ACTIVE && it.id !in completed &&
                !it.student.user.deleted && it.student.user.status == UserStatus.ACTIVE }
            .forEach { enrollment ->
                val userId = requireNotNull(enrollment.student.user.id)
                val key = "assignment:$assignmentId:user:$userId:due:${assignment.dueAt}"
                if (em.find(DeadlineReminderDelivery::class.java, key) == null) {
                    em.persist(DeadlineReminderDelivery(key, now))
                    notifications.create(CreateNotificationRequest(userId = userId, title = "Topshiriq muddati yaqinlashmoqda",
                        message = "${assignment.title} — topshirishga 24 soatdan kam vaqt qoldi.", type = "assignment", priority = "high",
                        relatedId = assignmentId.toString(), actionUrl = "/student/assignments?assignment=$assignmentId"))
                    sent++
                }
            }
        return sent
    }
}

@Component
class DeadlineReminderWorker(private val service: DeadlineReminderService) {
    private val logger = KotlinLogging.logger {}
    @Scheduled(fixedDelay = 300_000, initialDelay = 60_000)
    fun run() {
        val now = Instant.now()
        var after = 0L
        while (true) {
            val ids = service.dueIds(after, now)
            if (ids.isEmpty()) return
            ids.forEach { id -> runCatching { service.deliver(id) }.onFailure { logger.warn { "Muddat eslatmasi yuborilmadi: assignment=$id" } } }
            after = ids.last()
        }
    }
}
