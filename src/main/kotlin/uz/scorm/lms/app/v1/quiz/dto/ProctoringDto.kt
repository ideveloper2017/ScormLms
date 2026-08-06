package uz.scorm.lms.app.v1.quiz.dto

import java.time.Instant

data class ProctoringChallengeDto(
    val sessionId: String,
    val nonce: String,
    val direction: String,
    val expiresAt: Instant,
)

data class ProctoringVerificationDto(
    val sessionId: String,
    val verified: Boolean,
    val verifiedAt: Instant,
)
