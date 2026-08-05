package uz.scorm.lms.app.v1.attestation.dto

import java.math.BigDecimal
import java.time.Instant
import java.time.LocalDate
import java.time.LocalTime

// REQUEST DTOs

data class ScheduleDefenseRequest(
    val defenseDate: LocalDate? = null,
    val defenseTime: LocalTime? = null,
    val presentationFileUrl: String? = null,
)

data class RecordDefenseRequest(
    val defenseDate: LocalDate? = null,
    val defenseTime: LocalTime? = null,
    val presentationFileUrl: String? = null,
    val presentationFileName: String? = null,
    val defenseNotes: String? = null,
    val defenseStatus: String, // "DEFENDED", "CANCELLED", "RESCHEDULED"
)

data class SubmitCommissionDecisionRequest(
    val commissionDecision: String, // "PASS", "FAIL", "RETAKE"
    val commissionScore: BigDecimal,
    val notes: String? = null,
)

data class SubmitGradeRequest(
    val score: BigDecimal,
    val criteriaScores: String? = null, // JSON format
    val comments: String? = null,
)

data class CancelDefenseRequest(
    val reason: String? = null,
)

data class RescheduleDefenseRequest(
    val newDefenseDate: LocalDate,
    val newDefenseTime: LocalTime,
    val reason: String? = null,
)

// RESPONSE DTOs - TEACHER/PROCTOR VIEW

data class TeacherStudentDefenseDto(
    val id: String,
    val sessionId: String,
    val sessionTitle: String,
    val enrollmentId: String,
    val studentId: String,
    val studentName: String,
    val studentEmail: String,
    val defenseStatus: String,
    val defenseDate: LocalDate?,
    val defenseTime: LocalTime?,
    val location: String,
    val presentationFileName: String?,
    val presentationFileUrl: String?,
    val defenseNotes: String?,
    val commissionDecision: String?,
    val commissionScore: Double?,
    val gradeCount: Int,
    val allGradesSubmitted: Boolean,
    val grades: List<DefenseGradeDto>,
    val createdAt: Instant,
    val updatedAt: Instant,
)

data class DefenseGradeDto(
    val id: String,
    val gradedByName: String,
    val gradedByEmail: String,
    val score: Double,
    val criteriaScores: String?,
    val comments: String?,
    val gradingDate: Instant,
)

data class TeacherDefenseListDto(
    val sessionId: String,
    val sessionTitle: String,
    val examDate: LocalDate,
    val location: String,
    val totalDefenses: Int,
    val scheduledDefenses: Int,
    val completedDefenses: Int,
    val cancelledDefenses: Int,
    val rescheduledDefenses: Int,
    val defenses: List<TeacherStudentDefenseDto>,
)

// RESPONSE DTOs - STUDENT VIEW

data class StudentDefenseDetailsDto(
    val id: String,
    val sessionId: String,
    val sessionTitle: String,
    val courseId: String,
    val courseName: String,
    val examDate: LocalDate,
    val examTime: LocalTime,
    val location: String,
    val defenseType: String,
    val defenseStatus: String,
    val defenseDate: LocalDate?,
    val defenseTime: LocalTime?,
    val presentationFileName: String?,
    val presentationFileUrl: String?,
    val commissionDecision: String?,
    val averageScore: Double?,
    val myGrades: List<StudentGradeDto>,
    val certificateIssued: Boolean = false,
    val certificateNumber: String?,
    val createdAt: Instant,
    val updatedAt: Instant,
)

data class StudentGradeDto(
    val gradedByName: String,
    val gradedByEmail: String,
    val score: Double,
    val comments: String?,
    val gradingDate: Instant,
)

data class StudentDefenseHistoryDto(
    val courseId: String,
    val courseName: String,
    val sessionTitle: String,
    val defenseStatus: String,
    val defenseDate: LocalDate?,
    val defenseDecision: String?,
    val averageScore: Double?,
    val certificateIssued: Boolean,
)

data class StudentUpcomingDefenseDto(
    val id: String,
    val sessionId: String,
    val sessionTitle: String,
    val courseId: String,
    val courseName: String,
    val scheduledDate: LocalDate?,
    val scheduledTime: LocalTime?,
    val location: String?,
    val chairName: String,
    val daysUntilDefense: Int?,
    val preparationRequired: Boolean,
    val presentationRequired: Boolean,
)

// ADMIN VIEW

data class AdminDefenseMonitoringDto(
    val id: String,
    val sessionId: String,
    val sessionTitle: String,
    val studentId: String,
    val studentName: String,
    val studentEmail: String,
    val enrollmentStatus: String,
    val defenseStatus: String,
    val defenseDate: LocalDate?,
    val defenseTime: LocalTime?,
    val commissionDecision: String?,
    val commissionScore: Double?,
    val gradeSubmissionCount: Int,
    val gradeSubmissionRequired: Int,
    val allGradesReceived: Boolean,
    val certificateStatus: String?, // NOT_ISSUED, PENDING, ISSUED
    val certificateNumber: String?,
    val lastUpdated: Instant,
)

// STATISTICS DTOs

data class DefenseStatisticsDto(
    val sessionId: String,
    val totalScheduled: Int,
    val totalCompleted: Int,
    val totalCancelled: Int,
    val totalRescheduled: Int,
    val passedCount: Int,
    val failedCount: Int,
    val retakeCount: Int,
    val averageScore: Double?,
    val highestScore: Double?,
    val lowestScore: Double?,
    val gradeSubmissionRate: Double, // percentage of grades received
)

data class DefenseScoreDistributionDto(
    val sessionId: String,
    val scoreRanges: Map<String, Int>, // "90-100": 5, "80-89": 12, etc
    val medianScore: Double?,
    val modeScore: Double?,
    val standardDeviation: Double?,
)

data class DefenseTimelineDto(
    val sessionId: String,
    val scheduledDefenseCount: Int,
    val defensesByDate: Map<LocalDate, Int>, // Date -> count of defenses
    val averageDefensePerDay: Double,
    val busyDates: List<LocalDate>,
)