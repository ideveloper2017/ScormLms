package uz.scorm.lms.app.v1.quiz.dto

import java.time.Instant

data class ProctorStatsDto(
    val activeExams: Int,
    val totalStudents: Int,
    val violations: Long,
    val flaggedStudents: Int,
    val completedToday: Int,
    val avgScore: Int,
)

data class ProctorActiveExamDto(
    val id: String,
    val title: String,
    val course: String,
    val startTime: Instant,
    val duration: Int,
    val totalStudents: Int,
    val activeStudents: Int,
    val violations: Long,
    val status: String,
)

data class ProctorSessionSummaryDto(
    val attemptId: String,
    val quizId: String,
    val examTitle: String,
    val course: String,
    val studentName: String,
    val startedAt: Instant,
    val expiresAt: Instant,
    val status: String,
    val riskEvents: Long,
    val lastEventAt: Instant?,
    val lastHeartbeatAt: Instant?,
)

data class ProctorViolationDto(
    val id: String,
    val attemptId: String,
    val studentName: String,
    val examTitle: String,
    val type: String,
    val timestamp: Instant,
    val severity: String,
    val source: String,
)

data class ProctorEvidenceEventDto(
    val id: String,
    val type: String,
    val severity: String,
    val source: String,
    val occurredAt: Instant,
)

data class ProctorAttemptEvidenceDto(
    val attemptId: String,
    val quizId: String,
    val examTitle: String,
    val course: String,
    val studentName: String,
    val attemptStatus: String,
    val startedAt: Instant,
    val expiresAt: Instant,
    val submittedAt: Instant?,
    val score: Int,
    val totalPoints: Int,
    val identitySimilarity: Double?,
    val movementDelta: Double?,
    val challengeDirection: String,
    val verifiedAt: Instant?,
    val consumedAt: Instant?,
    val centerFrameHash: String?,
    val challengeFrameHash: String?,
    val events: List<ProctorEvidenceEventDto>,
)
