package uz.scorm.lms.app.v1.academicdocument.dto

import uz.scorm.lms.app.v1.academicdocument.model.CallLetterStatus
import java.time.Instant
import java.time.LocalDate

data class DocumentStudentDto(
    val id: Long,
    val fullName: String,
    val studentNumber: String,
    val educationForm: String,
    val program: String,
    val group: String,
    val academicYear: String?,
    val semester: Int?,
)

data class CallLetterDto(
    val id: Long,
    val studentId: Long,
    val fullName: String,
    val studentNumber: String,
    val semester: Int,
    val documentNumber: String,
    val orderNumber: String,
    val orderDate: LocalDate,
    val startDate: LocalDate,
    val endDate: LocalDate,
    val status: CallLetterStatus,
    val generatedAt: Instant?,
    val createdAt: Instant?,
)

data class SaveCallLetterRequest(
    val studentId: Long,
    val semester: Int,
    val orderNumber: String,
    val orderDate: LocalDate,
    val startDate: LocalDate,
    val endDate: LocalDate,
)

data class TranscriptDto(
    val id: Long,
    val studentId: Long,
    val fullName: String,
    val studentNumber: String,
    val educationForm: String,
    val program: String,
    val group: String,
    val documentNumber: String,
    val academicYear: String,
    val semester: Int,
    val generatedAt: Instant?,
    val createdAt: Instant?,
)

data class SaveTranscriptRequest(
    val studentId: Long,
    val documentNumber: String? = null,
    val academicYear: String,
    val semester: Int,
)
