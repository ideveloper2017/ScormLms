package uz.scorm.lms.app.v1.quiz.service

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.audit.service.AuditService
import uz.scorm.lms.app.v1.quiz.dto.CreateProctoringAppealRequest
import uz.scorm.lms.app.v1.quiz.dto.ProctoringAppealContextDto
import uz.scorm.lms.app.v1.quiz.dto.ProctoringAppealDto
import uz.scorm.lms.app.v1.quiz.dto.ProctoringAppealEventDto
import uz.scorm.lms.app.v1.quiz.dto.ReviewProctoringAppealRequest
import uz.scorm.lms.app.v1.quiz.model.ProctoringAppeal
import uz.scorm.lms.app.v1.quiz.model.ProctoringAppealStatus
import uz.scorm.lms.app.v1.quiz.model.ProctoringEvent
import uz.scorm.lms.app.v1.quiz.model.ProctoringEventSeverity
import uz.scorm.lms.app.v1.quiz.model.QuizAttempt
import uz.scorm.lms.app.v1.quiz.model.QuizAttemptStatus
import uz.scorm.lms.app.v1.quiz.repository.ProctoringAppealRepository
import uz.scorm.lms.app.v1.quiz.repository.ProctoringEventRepository
import uz.scorm.lms.app.v1.quiz.repository.QuizAttemptRepository
import uz.scorm.lms.app.v1.user.repository.UserRepository
import java.time.Instant
import java.time.temporal.ChronoUnit

@Service
class ProctoringAppealService(
    private val appealRepository: ProctoringAppealRepository,
    private val attemptRepository: QuizAttemptRepository,
    private val eventRepository: ProctoringEventRepository,
    private val userRepository: UserRepository,
    private val scopeService: ProctorScopeService,
    private val auditService: AuditService,
) {
    @Transactional(readOnly = true)
    fun context(quizId: Long, attemptId: Long, studentUserId: Long): ProctoringAppealContextDto {
        val attempt = studentAttempt(quizId, attemptId, studentUserId)
        val deadline = deadline(attempt)
        val appeal = appealRepository.findByAttemptIdAndDeletedFalse(attemptId)
        return ProctoringAppealContextDto(
            attemptId = attemptId.toString(),
            quizId = quizId.toString(),
            eligible = attempt.status != QuizAttemptStatus.IN_PROGRESS && !Instant.now().isAfter(deadline) && appeal == null,
            deadline = deadline,
            riskEvents = riskEvents(attemptId).map(::eventDto),
            appeal = appeal?.let(::dto),
        )
    }

    @Transactional
    fun create(
        quizId: Long,
        attemptId: Long,
        studentUserId: Long,
        request: CreateProctoringAppealRequest,
    ): ProctoringAppealDto {
        val attempt = studentAttempt(quizId, attemptId, studentUserId)
        require(attempt.status != QuizAttemptStatus.IN_PROGRESS) { "Faol urinish bo'yicha apellyatsiya berilmaydi" }
        require(!Instant.now().isAfter(deadline(attempt))) { "Proktoring apellyatsiyasi uchun 10 kunlik muddat tugagan" }
        require(request.reason.trim().length in 10..2000) { "Apellyatsiya sababi 10 dan 2000 belgigacha bo'lishi kerak" }
        require(request.eventIds.isNotEmpty() && request.eventIds.size <= 50) { "1 dan 50 tagacha risk hodisasi tanlanishi kerak" }
        require(!appealRepository.existsByAttemptIdAndDeletedFalse(attemptId)) { "Ushbu urinish bo'yicha apellyatsiya allaqachon mavjud" }

        val availableEvents = riskEvents(attemptId).associateBy { requireNotNull(it.id) }
        require(request.eventIds.all(availableEvents::containsKey)) { "Faqat shu urinishning risk hodisalari tanlanadi" }
        val appeal = ProctoringAppeal(
            attempt = attempt,
            student = userRepository.findById(studentUserId).orElseThrow(),
            reason = request.reason.trim(),
            requestedAt = Instant.now(),
            disputedEvents = request.eventIds.mapTo(linkedSetOf()) { requireNotNull(availableEvents[it]) },
        )
        val saved = appealRepository.save(appeal)
        auditService.logAction(
            "PROCTORING_APPEAL_CREATED",
            studentUserId,
            "appeal=${saved.id} attempt=$attemptId events=${request.eventIds.size}",
        )
        return dto(saved)
    }

    @Transactional(readOnly = true)
    fun studentAppeals(studentUserId: Long): List<ProctoringAppealDto> = appealRepository
        .findAllByStudentIdAndDeletedFalseOrderByRequestedAtDesc(studentUserId)
        .map(::dto)

    @Transactional(readOnly = true)
    fun reviewerAppeals(userId: Long, mayManageAll: Boolean): List<ProctoringAppealDto> {
        val quizIds = scopeService.quizzes(userId, mayManageAll).mapNotNull { it.id }
        if (quizIds.isEmpty()) return emptyList()
        return appealRepository.findAllByAttemptQuizIdInAndDeletedFalseOrderByRequestedAtAsc(quizIds).map(::dto)
    }

    @Transactional
    fun review(
        appealId: Long,
        userId: Long,
        mayManageAll: Boolean,
        request: ReviewProctoringAppealRequest,
    ): ProctoringAppealDto {
        val appeal = appealRepository.findByIdAndDeletedFalse(appealId)
            ?: throw NoSuchElementException("Proktoring apellyatsiyasi topilmadi")
        scopeService.requireQuiz(requireNotNull(appeal.attempt.quiz.id), userId, mayManageAll)
        require(appeal.status == ProctoringAppealStatus.PENDING) { "Apellyatsiya allaqachon ko'rib chiqilgan" }
        require(request.status in FINAL_STATUSES) { "Yakuniy review holati noto'g'ri" }
        require(request.decision.trim().length in 10..2000) { "Review qarori 10 dan 2000 belgigacha bo'lishi kerak" }

        appeal.status = request.status
        appeal.decision = request.decision.trim()
        appeal.reviewedAt = Instant.now()
        appeal.reviewedBy = userRepository.findById(userId).orElseThrow()
        val saved = appealRepository.save(appeal)
        auditService.logAction(
            "PROCTORING_APPEAL_REVIEWED",
            userId,
            "appeal=$appealId attempt=${appeal.attempt.id} status=${request.status}",
        )
        return dto(saved)
    }

    private fun studentAttempt(quizId: Long, attemptId: Long, studentUserId: Long): QuizAttempt {
        val attempt = attemptRepository.findByIdAndDeletedFalse(attemptId)
            ?: throw NoSuchElementException("Test urinish topilmadi")
        require(attempt.quiz.id == quizId && attempt.quiz.proctoring) { "Bu proktorli test urinishi emas" }
        require(attempt.enrollment.student.user.id == studentUserId) { "Boshqa talabaning urinishiga kirish mumkin emas" }
        return attempt
    }

    private fun deadline(attempt: QuizAttempt): Instant =
        (attempt.submittedAt ?: attempt.expiresAt).plus(APPEAL_DAYS, ChronoUnit.DAYS)

    private fun riskEvents(attemptId: Long): List<ProctoringEvent> = eventRepository
        .findAllByAttemptIdAndDeletedFalseOrderByOccurredAtAsc(attemptId)
        .filter { it.severity in RISK_SEVERITIES }

    private fun dto(appeal: ProctoringAppeal) = ProctoringAppealDto(
        id = requireNotNull(appeal.id).toString(),
        attemptId = requireNotNull(appeal.attempt.id).toString(),
        quizId = requireNotNull(appeal.attempt.quiz.id).toString(),
        examTitle = appeal.attempt.quiz.title,
        course = appeal.attempt.quiz.course.title.orEmpty(),
        studentName = studentName(appeal),
        reason = appeal.reason,
        requestedAt = appeal.requestedAt,
        status = appeal.status.name.lowercase(),
        disputedEvents = appeal.disputedEvents.sortedBy { it.occurredAt }.map(::eventDto),
        reviewedAt = appeal.reviewedAt,
        reviewedBy = appeal.reviewedBy?.fullName ?: appeal.reviewedBy?.username,
        decision = appeal.decision,
    )

    private fun studentName(appeal: ProctoringAppeal): String {
        val profile = appeal.attempt.enrollment.student
        return appeal.student.fullName?.takeIf(String::isNotBlank) ?: "${profile.lastName} ${profile.firstName}"
    }

    private fun eventDto(event: ProctoringEvent) = ProctoringAppealEventDto(
        id = requireNotNull(event.id).toString(),
        type = event.type.name.lowercase(),
        severity = event.severity.name.lowercase(),
        occurredAt = event.occurredAt,
    )

    companion object {
        private const val APPEAL_DAYS = 10L
        private val RISK_SEVERITIES = setOf(
            ProctoringEventSeverity.MEDIUM,
            ProctoringEventSeverity.HIGH,
            ProctoringEventSeverity.CRITICAL,
        )
        private val FINAL_STATUSES = setOf(
            ProctoringAppealStatus.APPROVED,
            ProctoringAppealStatus.PARTIAL,
            ProctoringAppealStatus.REJECTED,
        )
    }
}
