package uz.scorm.lms.app.v1.quiz.service

import org.springframework.data.domain.PageRequest
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.quiz.dto.ProctorActiveExamDto
import uz.scorm.lms.app.v1.quiz.dto.ProctorAttemptEvidenceDto
import uz.scorm.lms.app.v1.quiz.dto.ProctorEvidenceEventDto
import uz.scorm.lms.app.v1.quiz.dto.ProctorSessionSummaryDto
import uz.scorm.lms.app.v1.quiz.dto.ProctorStatsDto
import uz.scorm.lms.app.v1.quiz.dto.ProctorViolationDto
import uz.scorm.lms.app.v1.quiz.model.ProctoringEventSeverity
import uz.scorm.lms.app.v1.quiz.model.ProctoringEventType
import uz.scorm.lms.app.v1.quiz.model.ProctoringSession
import uz.scorm.lms.app.v1.quiz.model.ProctoringSessionStatus
import uz.scorm.lms.app.v1.quiz.model.QuizAttemptStatus
import uz.scorm.lms.app.v1.quiz.repository.ProctoringEventRepository
import uz.scorm.lms.app.v1.quiz.repository.ProctoringSessionRepository
import java.time.Instant
import java.time.ZoneId
import kotlin.math.roundToInt

@Service
class ProctorDashboardService(
    private val scopeService: ProctorScopeService,
    private val sessionRepository: ProctoringSessionRepository,
    private val eventRepository: ProctoringEventRepository,
) {
    @Transactional(readOnly = true)
    fun stats(userId: Long, mayManageAll: Boolean): ProctorStatsDto {
        val sessions = scopedSessions(userId, mayManageAll)
        val summaries = summaries(sessions)
        val attempts = sessions.mapNotNull { it.attempt }
        val active = attempts.filter { it.status == QuizAttemptStatus.IN_PROGRESS && Instant.now().isBefore(it.expiresAt) }
        val completed = attempts.filter { it.status != QuizAttemptStatus.IN_PROGRESS }
        val today = Instant.now().atZone(ZoneId.systemDefault()).toLocalDate()
        return ProctorStatsDto(
            activeExams = active.mapNotNull { it.quiz.id }.distinct().size,
            totalStudents = sessions.mapNotNull { it.enrollment.student.id }.distinct().size,
            violations = summaries.values.sumOf { it.getRiskEvents() },
            flaggedStudents = sessions.filter { summaries[it.attempt?.id]?.getRiskEvents()?.let { count -> count > 0 } == true }
                .mapNotNull { it.enrollment.student.id }.distinct().size,
            completedToday = completed.count { it.submittedAt?.atZone(ZoneId.systemDefault())?.toLocalDate() == today },
            avgScore = completed.takeIf { it.isNotEmpty() }?.map { it.percentage }?.average()?.roundToInt() ?: 0,
        )
    }

    @Transactional(readOnly = true)
    fun activeExams(userId: Long, mayManageAll: Boolean): List<ProctorActiveExamDto> {
        val sessions = scopedSessions(userId, mayManageAll)
        val summaryByAttempt = summaries(sessions)
        return sessions.groupBy { requireNotNull(it.quiz.id) }.values.map { group ->
            val quiz = group.first().quiz
            val active = group.count { it.attempt?.status == QuizAttemptStatus.IN_PROGRESS && Instant.now().isBefore(it.attempt!!.expiresAt) }
            ProctorActiveExamDto(
                id = requireNotNull(quiz.id).toString(),
                title = quiz.title,
                course = quiz.course.title.orEmpty(),
                startTime = quiz.opensAt,
                duration = quiz.durationMinutes,
                totalStudents = group.mapNotNull { it.enrollment.student.id }.distinct().size,
                activeStudents = active,
                violations = group.sumOf { summaryByAttempt[it.attempt?.id]?.getRiskEvents() ?: 0L },
                status = if (active > 0) "active" else "completed",
            )
        }.sortedByDescending { it.startTime }
    }

    @Transactional(readOnly = true)
    fun sessions(userId: Long, mayManageAll: Boolean): List<ProctorSessionSummaryDto> {
        val quizIds = scopeService.quizzes(userId, mayManageAll).mapNotNull { it.id }
        if (quizIds.isEmpty()) return emptyList()
        val sessions = sessionRepository.findAllByQuizIdInAndAttemptIsNotNullAndDeletedFalseOrderByConsumedAtDesc(
            quizIds,
            PageRequest.of(0, 100),
        )
        val summaryByAttempt = summaries(sessions)
        return sessions.map { session -> sessionSummary(session, summaryByAttempt[session.attempt?.id]) }
    }

    @Transactional(readOnly = true)
    fun violations(userId: Long, mayManageAll: Boolean): List<ProctorViolationDto> {
        val quizIds = scopeService.quizzes(userId, mayManageAll).mapNotNull { it.id }
        if (quizIds.isEmpty()) return emptyList()
        return eventRepository.findAllByAttemptQuizIdInAndSeverityInAndDeletedFalseOrderByOccurredAtDesc(
            quizIds,
            RISK_SEVERITIES,
            PageRequest.of(0, 100),
        ).map { event ->
            ProctorViolationDto(
                id = requireNotNull(event.id).toString(),
                attemptId = requireNotNull(event.attempt.id).toString(),
                studentName = studentName(event.attempt.enrollment.student.user.fullName,
                    event.attempt.enrollment.student.lastName, event.attempt.enrollment.student.firstName),
                examTitle = event.attempt.quiz.title,
                type = event.type.name.lowercase(),
                timestamp = event.occurredAt,
                severity = event.severity.name.lowercase(),
                source = event.source.name.lowercase(),
            )
        }
    }

    @Transactional(readOnly = true)
    fun evidence(attemptId: Long, userId: Long, mayManageAll: Boolean): ProctorAttemptEvidenceDto {
        val session = sessionRepository.findByAttemptIdAndDeletedFalse(attemptId)
            ?: throw NoSuchElementException("Proktoring dalili topilmadi")
        require(requireNotNull(session.quiz.id) in scopeService.quizzes(userId, mayManageAll).mapNotNull { it.id }.toSet()) {
            "Bu proktoring sessiyasini ko'rish vakolati yo'q"
        }
        val attempt = requireNotNull(session.attempt)
        val events = eventRepository.findAllByAttemptIdAndDeletedFalseOrderByOccurredAtDesc(
            attemptId,
            PageRequest.of(0, 200),
        ).map { event ->
            ProctorEvidenceEventDto(
                id = requireNotNull(event.id).toString(),
                type = event.type.name.lowercase(),
                severity = event.severity.name.lowercase(),
                source = event.source.name.lowercase(),
                occurredAt = event.occurredAt,
            )
        }
        return ProctorAttemptEvidenceDto(
            attemptId = attemptId.toString(),
            quizId = requireNotNull(session.quiz.id).toString(),
            examTitle = session.quiz.title,
            course = session.quiz.course.title.orEmpty(),
            studentName = studentName(session.enrollment.student.user.fullName,
                session.enrollment.student.lastName, session.enrollment.student.firstName),
            attemptStatus = attempt.status.name.lowercase(),
            startedAt = attempt.startedAt,
            expiresAt = attempt.expiresAt,
            submittedAt = attempt.submittedAt,
            score = attempt.score,
            totalPoints = attempt.totalPoints,
            identitySimilarity = session.identitySimilarity,
            movementDelta = session.movementDelta,
            challengeDirection = session.challengeDirection.name.lowercase(),
            verifiedAt = session.verifiedAt,
            consumedAt = session.consumedAt,
            centerFrameHash = session.centerFrameHash,
            challengeFrameHash = session.challengeFrameHash,
            events = events,
        )
    }

    private fun scopedSessions(userId: Long, mayManageAll: Boolean): List<ProctoringSession> {
        val quizIds = scopeService.quizzes(userId, mayManageAll).mapNotNull { it.id }
        if (quizIds.isEmpty()) return emptyList()
        return sessionRepository.findAllByQuizIdInAndAttemptIsNotNullAndDeletedFalse(quizIds)
    }

    private fun summaries(sessions: List<ProctoringSession>) = sessions.mapNotNull { it.attempt?.id }.let { ids ->
        if (ids.isEmpty()) emptyMap()
        else eventRepository.summarizeAttempts(ids, RISK_SEVERITIES, ProctoringEventType.HEARTBEAT)
            .associateBy { it.getAttemptId() }
    }

    private fun sessionSummary(
        session: ProctoringSession,
        summary: uz.scorm.lms.app.v1.quiz.repository.ProctorAttemptEventSummary?,
    ): ProctorSessionSummaryDto {
        val attempt = requireNotNull(session.attempt)
        return ProctorSessionSummaryDto(
            attemptId = requireNotNull(attempt.id).toString(),
            quizId = requireNotNull(session.quiz.id).toString(),
            examTitle = session.quiz.title,
            course = session.quiz.course.title.orEmpty(),
            studentName = studentName(session.enrollment.student.user.fullName,
                session.enrollment.student.lastName, session.enrollment.student.firstName),
            startedAt = attempt.startedAt,
            expiresAt = attempt.expiresAt,
            status = when {
                session.status == ProctoringSessionStatus.CONSUMED && attempt.status == QuizAttemptStatus.IN_PROGRESS -> "active"
                attempt.status == QuizAttemptStatus.TIMED_OUT -> "timed_out"
                else -> "completed"
            },
            riskEvents = summary?.getRiskEvents() ?: 0,
            lastEventAt = summary?.getLastEventAt(),
            lastHeartbeatAt = summary?.getLastHeartbeatAt(),
        )
    }

    private fun studentName(fullName: String?, lastName: String, firstName: String): String =
        fullName?.takeIf(String::isNotBlank) ?: "$lastName $firstName"

    companion object {
        private val RISK_SEVERITIES = setOf(
            ProctoringEventSeverity.MEDIUM,
            ProctoringEventSeverity.HIGH,
            ProctoringEventSeverity.CRITICAL,
        )
    }
}
