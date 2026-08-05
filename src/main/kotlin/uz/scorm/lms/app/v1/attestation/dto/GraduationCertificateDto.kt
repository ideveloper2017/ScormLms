package uz.scorm.lms.app.v1.attestation.dto

import java.math.BigDecimal
import java.time.Instant
import java.time.LocalDate

// REQUEST DTOs

data class GenerateCertificateRequest(
    val studentDefenseId: Long,
    val issuedByUserId: Long,
    val issueDate: LocalDate = LocalDate.now(),
    val specialization: String? = null,
    val gpaFinal: BigDecimal? = null,
)

data class IssueCertificateRequest(
    val studentDefenseId: Long,
    val issueDate: LocalDate = LocalDate.now(),
)

data class VerifyCertificateRequest(
    val certificateNumber: String? = null,
    val verificationToken: String? = null,
)

data class BulkGenerateCertificatesRequest(
    val sessionId: Long,
    val issuedByUserId: Long,
    val issueDate: LocalDate = LocalDate.now(),
)

data class RevokeCertificateRequest(
    val reason: String,
)

// RESPONSE DTOs - CERTIFICATE DETAILS

data class GraduationCertificateDetailsDto(
    val id: String,
    val certificateNumber: String,
    val issueDate: LocalDate,
    val issuedByName: String,
    val issuedByEmail: String,
    val studentId: String,
    val studentName: String,
    val studentEmail: String,
    val courseId: String,
    val courseName: String,
    val programName: String,
    val specialization: String?,
    val gpaFinal: Double?,
    val defenseScore: Double,
    val defenseType: String, // BACHELOR, MASTER
    val certificateFileUrl: String?,
    val qrCodeUrl: String?,
    val verificationUrl: String?, // URL to verify certificate
    val verified: Boolean = false,
    val verificationDate: Instant?,
    val issuedAt: Instant,
)

data class StudentCertificateDto(
    val id: String,
    val certificateNumber: String,
    val issueDate: LocalDate,
    val programName: String,
    val specialization: String?,
    val gpaFinal: Double?,
    val courseTitle: String,
    val defenseScore: Double,
    val certificateFileUrl: String?,
    val qrCodeUrl: String?,
    val verificationUrl: String?,
    val downloadUrl: String?,
)

// VERIFICATION DTOs

data class CertificateVerificationResultDto(
    val isValid: Boolean,
    val certificateNumber: String,
    val studentName: String,
    val programName: String,
    val issueDate: LocalDate,
    val issuedBy: String,
    val specialization: String?,
    val gpa: Double?,
    val verifiedAt: Instant?,
    val errorMessage: String? = null,
)

data class VerificationQrCodeDto(
    val certificateNumber: String,
    val verificationToken: String,
    val verificationUrl: String,
    val expiresAt: Instant? = null,
)

// ADMIN VIEW

data class AdminCertificateDto(
    val id: String,
    val certificateNumber: String,
    val issueDate: LocalDate,
    val issuedById: String,
    val issuedByName: String,
    val studentId: String,
    val studentName: String,
    val enrollmentId: String,
    val courseId: String,
    val courseTitle: String,
    val defenseStatus: String,
    val defenseScore: Double,
    val specialization: String?,
    val gpaFinal: Double?,
    val certificateFileSize: Long?,
    val certificateFileUrl: String?,
    val qrCodeUrl: String?,
    val verifiedCount: Int = 0,
    val lastVerificationDate: Instant?,
    val isActive: Boolean = true,
    val createdAt: Instant,
    val updatedAt: Instant,
)

data class AdminCertificateListDto(
    val sessionId: String,
    val sessionTitle: String,
    val issueDate: LocalDate,
    val totalCertificates: Int,
    val totalGenerated: Int,
    val totalIssued: Int,
    val totalPending: Int,
    val certificates: List<AdminCertificateDto>,
)

// STATISTICS DTOs

data class CertificateStatisticsDto(
    val totalGenerated: Int,
    val totalIssued: Int,
    val totalPending: Int,
    val issuedThisMonth: Int,
    val issuedThisYear: Int,
    val verifiedCount: Int,
    val verificationRate: Double, // percentage of certificates verified
    val averageDaysToIssue: Double,
)

data class CertificateByYearDto(
    val year: Int,
    val january: Int,
    val february: Int,
    val march: Int,
    val april: Int,
    val may: Int,
    val june: Int,
    val july: Int,
    val august: Int,
    val september: Int,
    val october: Int,
    val november: Int,
    val december: Int,
    val total: Int,
)

data class CertificateIssuanceReportDto(
    val reportDate: LocalDate,
    val totalCertificatesIssued: Int,
    val byProgram: Map<String, Int>,
    val bySpecialization: Map<String, Int>,
    val byDefenseType: Map<String, Int>,
    val avgGpa: Double?,
    val avgDefenseScore: Double?,
)

// BATCH OPERATIONS

data class BatchCertificateResultDto(
    val totalRequested: Int,
    val totalGenerated: Int,
    val totalFailed: Int,
    val failedStudents: List<BatchCertificateErrorDto>,
)

data class BatchCertificateErrorDto(
    val studentId: String,
    val studentName: String,
    val errorMessage: String,
)

data class CertificateDownloadDto(
    val certificateNumber: String,
    val studentName: String,
    val fileContent: ByteArray,
    val fileName: String,
    val contentType: String = "application/pdf",
)

// AUDIT & COMPLIANCE

data class CertificateAuditLogDto(
    val id: String,
    val certificateNumber: String,
    val action: String, // GENERATED, ISSUED, DOWNLOADED, VERIFIED, REVOKED
    val performedBy: String,
    val performedByEmail: String,
    val details: String?,
    val ipAddress: String?,
    val actionTime: Instant,
)

data class CertificateComplianceReportDto(
    val reportDate: LocalDate,
    val totalCertificates: Int,
    val certificatesWithQrCode: Int,
    val certificatesWithFile: Int,
    val certificatesVerified: Int,
    val certificatesActive: Int,
    val certificatesRevoked: Int,
    val compliancePercentage: Double,
    val issues: List<String>,
)

// DIPLOMA/CERTIFICATE PREVIEW

data class CertificatePreviewDto(
    val certificateNumber: String,
    val studentName: String,
    val programName: String,
    val specialization: String?,
    val defenseType: String,
    val gpa: Double?,
    val issueDate: LocalDate,
    val issuedByName: String,
    val universityName: String = "O'zbekiston Davlat Universiteti",
    val language: String = "UZ", // UZ, EN, RU
)

// TRACKING

data class CertificateTrackingDto(
    val certificateNumber: String,
    val studentName: String,
    val statusHistory: List<CertificateStatusHistoryDto>,
    val currentStatus: String,
    val estimatedCompletionDate: LocalDate?,
)

data class CertificateStatusHistoryDto(
    val status: String, // GENERATED, IN_PROCESS, READY_FOR_ISSUANCE, ISSUED, DISTRIBUTED
    val timestamp: Instant,
    val notes: String?,
    val performedBy: String?,
)