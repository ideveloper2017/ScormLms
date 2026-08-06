package uz.scorm.lms.app.v1.exam.dto

import java.math.BigDecimal
import java.time.Instant
import uz.scorm.lms.app.v1.exam.model.AppealStatus

data class RecordExamResultRequest(
    val enrollmentId: Long,
    val score: BigDecimal,
    val totalScore: BigDecimal = BigDecimal("100"),
    val grade: String? = null,
    val comments: String? = null,
)

data class BulkRecordExamResultRequest(
    val results: List<RecordExamResultRequest>,
)

data class UpdateExamResultRequest(
    val score: BigDecimal? = null,
    val grade: String? = null,
    val comments: String? = null,
)

data class TeacherExamResultDto(
    val id: String,
    val examSessionId: String,
    val examTitle: String,
    val enrollmentId: String,
    val studentId: String,
    val studentName: String,
    val studentEmail: String,
    val score: Double,
    val totalScore: Double,
    val percentage: Double,
    val passed: Boolean,
    val grade: String?,
    val comments: String?,
    val gradedBy: String,
    val gradingDate: Instant,
)

data class StudentExamResultDto(
    val id: String,
    val examSessionId: String,
    val examTitle: String,
    val examDate: String,
    val score: Double,
    val totalScore: Double,
    val percentage: Double,
    val passed: Boolean,
    val grade: String?,
    val comments: String?,
    val attendanceStatus: String,
    val gradingDate: Instant,
)

data class ExamResultsStatisticsDto(
    val examSessionId: String,
    val examTitle: String,
    val totalStudents: Int,
    val submittedCount: Int,
    val passedCount: Int,
    val failedCount: Int,
    val averageScore: Double,
    val highestScore: Double,
    val lowestScore: Double,
    val gradeDistribution: Map<String, Int> = emptyMap(),
    val passPercentage: Double,
)

data class ExamAppealRequestDto(
    val examResultId: Long,
    val reason: String,
)

data class ReviewExamAppealRequest(
    val status: AppealStatus,
    val decision: String,
    val newScore: BigDecimal? = null,
)

data class ExamAppealResponseDto(
    val id: String,
    val examResultId: String,
    val studentName: String,
    val appealDate: Instant,
    val reason: String,
    val status: String,
    val reviewDate: Instant?,
    val reviewedBy: String?,
    val decision: String?,
    val newScore: Double?,
)
