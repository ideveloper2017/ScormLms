package uz.scorm.lms.app.v1.attestation.dto

import uz.scorm.lms.app.v1.attestation.model.AttestationSessionStatus
import uz.scorm.lms.app.v1.attestation.model.DefenseType
import java.time.Instant
import java.time.LocalDate
import java.time.LocalTime

// REQUEST DTOs

data class CreateAttestationSessionRequest(
    val courseId: Long,
    val semesterId: Long? = null,
    val title: String,
    val description: String? = null,
    val examDate: LocalDate,
    val examTime: LocalTime,
    val location: String,
    val commissionChairId: Long,
    val defenseType: DefenseType = DefenseType.BACHELOR,
    val minCommissionMembers: Int = 3,
    val minPassScore: Int = 60,
)

data class UpdateAttestationSessionRequest(
    val title: String? = null,
    val description: String? = null,
    val location: String? = null,
    val examDate: LocalDate? = null,
    val examTime: LocalTime? = null,
    val commissionChairId: Long? = null,
    val minCommissionMembers: Int? = null,
    val minPassScore: Int? = null,
)

data class PublishAttestationSessionRequest(
    val publishAt: Instant? = null,
)

data class CompleteAttestationSessionRequest(
    val completedAt: Instant? = null,
)

data class AddCommissionMemberRequest(
    val userId: Long,
    val role: String, // "CHAIR", "MEMBER", "SECRETARY"
)

data class RemoveCommissionMemberRequest(
    val memberId: Long,
)

// RESPONSE DTOs - TEACHER VIEW

data class TeacherAttestationSessionDto(
    val id: String,
    val courseId: String,
    val courseTitle: String,
    val title: String,
    val description: String?,
    val examDate: LocalDate,
    val examTime: LocalTime,
    val location: String,
    val defenseType: String,
    val commissionChairId: String,
    val chairName: String,
    val status: String,
    val minCommissionMembers: Int,
    val currentMemberCount: Int,
    val minPassScore: Int,
    val totalEnrolled: Int,
    val defenseCount: Int,
    val passedCount: Int,
    val failedCount: Int,
    val retakeCount: Int,
    val publishedAt: Instant?,
    val heldAt: Instant?,
    val resultPublishedAt: Instant?,
    val createdAt: Instant,
    val updatedAt: Instant,
)

data class AdminAttestationSessionDto(
    val id: String,
    val courseId: String,
    val courseTitle: String,
    val title: String,
    val description: String?,
    val examDate: LocalDate,
    val examTime: LocalTime,
    val location: String,
    val defenseType: String,
    val commissionChairId: String,
    val chairName: String,
    val chairEmail: String,
    val status: String,
    val minCommissionMembers: Int,
    val currentMemberCount: Int,
    val minPassScore: Int,
    val totalEnrolled: Int,
    val scheduledDefenses: Int,
    val completedDefenses: Int,
    val cancelledDefenses: Int,
    val passedCount: Int,
    val failedCount: Int,
    val retakeCount: Int,
    val certificatesIssued: Int,
    val certificatesPending: Int,
    val protocolStatus: String?, // PENDING, APPROVED
    val publishedAt: Instant?,
    val heldAt: Instant?,
    val resultPublishedAt: Instant?,
    val createdAt: Instant,
    val updatedAt: Instant,
)

// RESPONSE DTOs - STUDENT VIEW

data class StudentAttestationSessionDto(
    val id: String,
    val courseId: String,
    val courseTitle: String,
    val title: String,
    val description: String?,
    val examDate: LocalDate,
    val examTime: LocalTime,
    val location: String,
    val defenseType: String,
    val chairName: String,
    val status: String,
    val myDefenseStatus: String?,
    val myDefenseDecision: String?,
    val myScore: Double?,
    val myAverageScore: Double?,
    val certificateIssued: Boolean = false,
    val certificateNumber: String?,
    val resultPublished: Boolean = false,
)

// COMMISSION MEMBER DTOs

data class CommissionMemberDto(
    val id: String,
    val userId: String,
    val userName: String,
    val userEmail: String,
    val role: String,
    val appointedBy: String,
    val appointedAt: Instant,
)

data class CommissionDetailsDto(
    val sessionId: String,
    val chairName: String,
    val chairEmail: String,
    val members: List<CommissionMemberDto>,
    val totalMembers: Int,
    val membersByRole: Map<String, Int>, // {CHAIR: 1, MEMBER: 3, SECRETARY: 1}
)

// STATISTICS DTOs

data class AttestationSessionStatsDto(
    val sessionId: String,
    val totalEnrolled: Int,
    val defenseScheduled: Int,
    val defenseCompleted: Int,
    val defenceCancelled: Int,
    val passedCount: Int,
    val failedCount: Int,
    val retakeCount: Int,
    val passPercentage: Double,
    val averageScore: Double?,
    val highestScore: Double?,
    val lowestScore: Double?,
    val certificatesIssued: Int,
    val certificatesPending: Int,
    val protocolApproved: Boolean,
    val resultPublished: Boolean,
)

data class AttestationSessionDetailDto(
    val sessionId: String,
    val courseId: String,
    val courseTitle: String,
    val title: String,
    val examDate: LocalDate,
    val examTime: LocalTime,
    val location: String,
    val defenseType: String,
    val status: String,
    val commission: CommissionDetailsDto,
    val statistics: AttestationSessionStatsDto,
    val defenseList: List<StudentDefenseForSessionDto>,
)

data class StudentDefenseForSessionDto(
    val defenseId: String,
    val studentId: String,
    val studentName: String,
    val studentEmail: String,
    val defenseStatus: String,
    val defenseDate: LocalDate?,
    val defenseTime: LocalTime?,
    val commissionDecision: String?,
    val averageScore: Double?,
    val certificateIssued: Boolean,
)