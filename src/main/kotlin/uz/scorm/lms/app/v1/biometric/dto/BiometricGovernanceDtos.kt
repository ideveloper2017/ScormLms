package uz.scorm.lms.app.v1.biometric.dto

import uz.scorm.lms.app.v1.biometric.model.BiometricPolicyStatus
import java.time.Instant
import java.time.LocalDate

data class SaveBiometricPolicyRequest(
    val versionCode: String,
    val title: String,
    val purposeText: String,
    val legalBasis: String,
    val consentText: String,
    val privacyNotice: String,
    val documentNumber: String,
    val documentDate: LocalDate,
    val documentReference: String,
    val faceTemplateRetentionDays: Int,
    val proctoringEvidenceRetentionDays: Int,
)

data class PublishBiometricPolicyRequest(val approvalNote: String)
data class AcceptBiometricConsentRequest(val policyId: Long, val statementHash: String)
data class WithdrawBiometricConsentRequest(val reason: String)

data class BiometricPolicyDto(
    val id: Long,
    val versionCode: String,
    val title: String,
    val purposeText: String,
    val legalBasis: String,
    val consentText: String,
    val privacyNotice: String,
    val documentNumber: String,
    val documentDate: LocalDate,
    val documentReference: String,
    val faceTemplateRetentionDays: Int,
    val proctoringEvidenceRetentionDays: Int,
    val statementHash: String,
    val status: BiometricPolicyStatus,
    val createdByName: String,
    val publishedAt: Instant?,
    val publishedByName: String?,
    val approvalNote: String?,
    val archivedAt: Instant?,
)

data class MyBiometricStatusDto(
    val policy: BiometricPolicyDto?,
    val consentGranted: Boolean,
    val consentedAt: Instant?,
    val withdrawnAt: Instant?,
    val faceRegistered: Boolean,
    val faceUploadedAt: java.time.LocalDateTime?,
    val faceExpiresAt: Instant?,
)

data class BiometricRetentionRunDto(val faceTemplatesPurged: Int, val proctoringEvidencePurged: Int, val executedAt: Instant)
