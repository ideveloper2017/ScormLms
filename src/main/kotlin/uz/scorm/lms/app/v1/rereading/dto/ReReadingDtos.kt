package uz.scorm.lms.app.v1.rereading.dto

import uz.scorm.lms.app.v1.academicresult.dto.StudentAcademicResultDto
import uz.scorm.lms.app.v1.rereading.model.ReReadingApplicationStatus
import uz.scorm.lms.app.v1.rereading.model.ReReadingPlanStatus
import java.math.BigDecimal
import java.time.Instant
import java.time.LocalDate

data class ReReadingPlanDto(
    val id: Long, val title: String, val applicationDeadline: LocalDate, val description: String,
    val status: ReReadingPlanStatus, val createdAt: Instant?, val updatedAt: Instant?,
)
data class SaveReReadingPlanRequest(
    val title: String, val applicationDeadline: LocalDate, val description: String,
    val status: ReReadingPlanStatus = ReReadingPlanStatus.OPEN,
)
data class ReReadingStudentDto(
    val id: Long, val fullName: String, val studentNumber: String, val group: String,
    val academicYear: String?, val semester: Int?,
)
data class ReReadingApplicationDto(
    val id: Long, val planId: Long, val planTitle: String, val studentId: Long, val fullName: String,
    val studentNumber: String, val group: String, val contractNumber: String, val totalCredits: Int,
    val totalAmount: BigDecimal, val paidAmount: BigDecimal, val debtAmount: BigDecimal,
    val status: ReReadingApplicationStatus, val submittedAt: Instant?, val createdAt: Instant?,
)
data class SaveReReadingApplicationRequest(
    val planId: Long, val studentId: Long, val contractNumber: String? = null,
    val totalCredits: Int = 0, val totalAmount: BigDecimal, val paidAmount: BigDecimal = BigDecimal.ZERO,
)
data class ChangeReReadingStatusRequest(val status: ReReadingApplicationStatus)
data class ReReadingRecoveryDto(
    val applicationId: Long, val fullName: String, val studentNumber: String, val group: String,
    val contractNumber: String, val status: ReReadingApplicationStatus,
    val results: List<StudentAcademicResultDto>,
)
data class ReReadingTeacherReportDto(
    val teacherId: Long, val teacherName: String, val subjects: List<String>,
    val studentCount: Int, val totalCredits: Int,
)
data class ReReadingStudentReportDto(
    val application: ReReadingApplicationDto, val assessedSubjects: Int,
    val passedSubjects: Int, val debtSubjects: Int, val averageScore: Double?,
)
