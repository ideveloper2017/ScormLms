package uz.scorm.lms.app.v1.foreignteacher.dto

import java.time.Instant
import java.time.LocalDate

data class SaveForeignTeacherEngagementRequest(
    val teacherId: Long,
    val academicYear: String,
    val citizenshipCountryCode: String,
    val citizenshipEvidenceReference: String,
    val qualificationReference: String,
    val contractNumber: String,
    val contractDate: LocalDate,
    val engagementOrderNumber: String,
    val engagementOrderDate: LocalDate,
    val engagementStartDate: LocalDate,
    val engagementEndDate: LocalDate,
    val remoteTeachingConfirmed: Boolean,
    val evidenceReference: String,
    val courseIds: Set<Long>,
)

data class VerifyForeignTeacherEngagementRequest(val verificationNote: String)
data class RejectForeignTeacherEngagementRequest(val reason: String)

data class ForeignTeacherOptionDto(val id: Long, val fullName: String, val academicDegree: String?, val position: String?)
data class ForeignTeacherCourseOptionDto(val id: Long, val title: String, val subjectName: String, val programName: String)
data class ForeignTeacherCourseDto(val id: Long, val title: String, val subjectName: String, val programName: String)

data class ForeignTeacherEngagementDto(
    val id: Long,
    val teacherId: Long,
    val teacherName: String,
    val academicYear: String,
    val citizenshipCountryCode: String,
    val citizenshipEvidenceReference: String,
    val qualificationReference: String,
    val contractNumber: String,
    val contractDate: LocalDate,
    val engagementOrderNumber: String,
    val engagementOrderDate: LocalDate,
    val engagementStartDate: LocalDate,
    val engagementEndDate: LocalDate,
    val remoteTeachingConfirmed: Boolean,
    val evidenceReference: String,
    val courses: List<ForeignTeacherCourseDto>,
    val status: String,
    val createdBy: String,
    val verifiedAt: Instant?,
    val verifiedBy: String?,
    val verificationNote: String?,
    val rejectedAt: Instant?,
    val rejectedBy: String?,
    val rejectionReason: String?,
)
