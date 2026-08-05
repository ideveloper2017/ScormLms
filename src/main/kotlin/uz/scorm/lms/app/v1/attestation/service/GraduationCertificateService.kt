package uz.scorm.lms.app.v1.attestation.service

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.attestation.dto.BulkGenerateCertificatesRequest
import uz.scorm.lms.app.v1.attestation.dto.BatchCertificateResultDto
import uz.scorm.lms.app.v1.attestation.dto.BatchCertificateErrorDto
import uz.scorm.lms.app.v1.attestation.dto.CertificateVerificationResultDto
import uz.scorm.lms.app.v1.attestation.dto.GenerateCertificateRequest
import uz.scorm.lms.app.v1.attestation.dto.GraduationCertificateDetailsDto
import uz.scorm.lms.app.v1.attestation.dto.IssueCertificateRequest
import uz.scorm.lms.app.v1.attestation.dto.StudentCertificateDto
import uz.scorm.lms.app.v1.attestation.dto.VerifyCertificateRequest
import uz.scorm.lms.app.v1.attestation.model.DefenseDecision
import uz.scorm.lms.app.v1.attestation.model.GraduationCertificate
import uz.scorm.lms.app.v1.attestation.repository.GraduationCertificateRepository
import uz.scorm.lms.app.v1.attestation.repository.StudentDefenseRepository
import uz.scorm.lms.app.v1.audit.service.AuditService
import uz.scorm.lms.app.v1.courses.service.CourseAccessService
import uz.scorm.lms.app.v1.user.repository.UserRepository
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

@Service
class GraduationCertificateService(
    private val certificateRepository: GraduationCertificateRepository,
    private val defenseRepository: StudentDefenseRepository,
    private val userRepository: UserRepository,
    private val courseAccessService: CourseAccessService,
    private val auditService: AuditService,
) {

    @Transactional
    fun generateCertificate(
        request: GenerateCertificateRequest,
        userId: Long,
        mayManageAll: Boolean,
    ): GraduationCertificateDetailsDto {
        val defense = defenseRepository.findByIdAndDeletedFalse(request.studentDefenseId)
            ?: throw IllegalArgumentException("Himoya topilmadi")

        courseAccessService.requireManage(defense.attestationSession.course.id, userId, mayManageAll)
        require(defense.commissionDecision == DefenseDecision.PASS) { "Faqat o'tgan talabalar uchun sertifikat berilishi mumkin" }

        val existingCertificate = certificateRepository.findByStudentDefenseIdAndDeletedFalse(request.studentDefenseId)
        if (existingCertificate != null) {
            return toCertificateDetailsDto(existingCertificate)
        }

        val issuer = userRepository.findById(request.issuedByUserId)
            .orElseThrow { IllegalArgumentException("Sertifikat beruvchi topilmadi") }

        val certificateNumber = generateCertificateNumber(request.issueDate.year)
        val verificationToken = UUID.randomUUID().toString()

        val certificate = GraduationCertificate(
            studentDefense = defense,
            certificateNumber = certificateNumber,
            issueDate = request.issueDate,
            issuedBy = issuer,
            specialization = request.specialization,
            gpaFinal = request.gpaFinal,
            verificationToken = verificationToken,
        )

        val saved = certificateRepository.save(certificate)
        auditService.logAction(
            "CERTIFICATE_GENERATED",
            userId,
            "Sertifikat yaratildi: ${defense.enrollment.student.fullName} - $certificateNumber"
        )
        return toCertificateDetailsDto(saved)
    }

    @Transactional
    fun issueCertificate(
        certificateId: Long,
        userId: Long,
        mayManageAll: Boolean,
    ): GraduationCertificateDetailsDto {
        val certificate = certificateRepository.findByIdAndDeletedFalse(certificateId)
            ?: throw IllegalArgumentException("Sertifikat topilmadi")

        courseAccessService.requireManage(certificate.studentDefense.attestationSession.course.id, userId, mayManageAll)

        val issuer = userRepository.findById(userId)
            .orElseThrow { IllegalArgumentException("Foydalanuvchi topilmadi") }

        certificate.issuedBy = issuer
        certificate.issueDate = LocalDate.now()

        val saved = certificateRepository.save(certificate)
        auditService.logAction(
            "CERTIFICATE_ISSUED",
            userId,
            "Sertifikat berildi: ${certificate.studentDefense.enrollment.student.fullName}"
        )
        return toCertificateDetailsDto(saved)
    }

    @Transactional(readOnly = true)
    fun verifyCertificate(
        request: VerifyCertificateRequest,
    ): CertificateVerificationResultDto {
        val certificate = when {
            request.certificateNumber != null -> {
                certificateRepository.findByCertificateNumberAndDeletedFalse(request.certificateNumber)
            }
            request.verificationToken != null -> {
                certificateRepository.findByVerificationTokenAndDeletedFalse(request.verificationToken)
            }
            else -> throw IllegalArgumentException("Sertifikat raqami yoki token majburiy")
        } ?: return CertificateVerificationResultDto(
            isValid = false,
            certificateNumber = request.certificateNumber ?: "Unknown",
            studentName = "Unknown",
            programName = "Unknown",
            issueDate = LocalDate.now(),
            issuedBy = "Unknown",
            specialization = null,
            gpa = null,
            verifiedAt = null,
            errorMessage = "Sertifikat topilmadi",
        )

        return CertificateVerificationResultDto(
            isValid = true,
            certificateNumber = certificate.certificateNumber,
            studentName = certificate.studentDefense.enrollment.student.fullName ?: "Unknown",
            programName = certificate.studentDefense.attestationSession.course.name,
            issueDate = certificate.issueDate,
            issuedBy = certificate.issuedBy.fullName ?: certificate.issuedBy.username,
            specialization = certificate.specialization,
            gpa = certificate.gpaFinal?.toDouble(),
            verifiedAt = Instant.now(),
        )
    }

    @Transactional
    fun bulkGenerateCertificates(
        request: BulkGenerateCertificatesRequest,
        userId: Long,
        mayManageAll: Boolean,
    ): BatchCertificateResultDto {
        val defenses = defenseRepository.findAllByAttestationSessionIdAndCommissionDecisionAndDeletedFalse(
            request.sessionId,
            DefenseDecision.PASS,
        )

        val issuer = userRepository.findById(request.issuedByUserId)
            .orElseThrow { IllegalArgumentException("Sertifikat beruvchi topilmadi") }

        var generated = 0
        var failed = 0
        val errors = mutableListOf<BatchCertificateErrorDto>()

        for (defense in defenses) {
            try {
                val existing = certificateRepository.findByStudentDefenseIdAndDeletedFalse(defense.id!!)
                if (existing == null) {
                    val certificateNumber = generateCertificateNumber(request.issueDate.year)
                    val verificationToken = UUID.randomUUID().toString()

                    val certificate = GraduationCertificate(
                        studentDefense = defense,
                        certificateNumber = certificateNumber,
                        issueDate = request.issueDate,
                        issuedBy = issuer,
                        verificationToken = verificationToken,
                    )
                    certificateRepository.save(certificate)
                    generated++
                }
            } catch (e: Exception) {
                failed++
                errors.add(
                    BatchCertificateErrorDto(
                        studentId = defense.enrollment.student.id.toString(),
                        studentName = defense.enrollment.student.fullName ?: "Unknown",
                        errorMessage = e.message ?: "Noma'lum xato",
                    )
                )
            }
        }

        auditService.logAction(
            "CERTIFICATES_BULK_GENERATED",
            userId,
            "Sertifikatlar ommaviy yaratildi: $generated yaratildi, $failed muvaffaqiyatsiz"
        )

        return BatchCertificateResultDto(
            totalRequested = defenses.size,
            totalGenerated = generated,
            totalFailed = failed,
            failedStudents = errors,
        )
    }

    @Transactional(readOnly = true)
    fun getCertificateDetails(
        certificateId: Long,
        userId: Long,
    ): GraduationCertificateDetailsDto {
        val certificate = certificateRepository.findByIdAndDeletedFalse(certificateId)
            ?: throw IllegalArgumentException("Sertifikat topilmadi")

        courseAccessService.requireView(certificate.studentDefense.attestationSession.course.id, userId, false)
        return toCertificateDetailsDto(certificate)
    }

    @Transactional(readOnly = true)
    fun getStudentCertificate(
        enrollmentId: Long,
        userId: Long,
    ): StudentCertificateDto? {
        val defense = defenseRepository.findAllByEnrollmentIdAndDeletedFalseOrderByAttestationSessionIdDesc(enrollmentId)
            .firstOrNull { it.commissionDecision == DefenseDecision.PASS }
            ?: return null

        val certificate = certificateRepository.findByStudentDefenseIdAndDeletedFalse(defense.id!!)
            ?: return null

        return StudentCertificateDto(
            id = certificate.id.toString(),
            certificateNumber = certificate.certificateNumber,
            issueDate = certificate.issueDate,
            programName = defense.attestationSession.course.name,
            specialization = certificate.specialization,
            gpaFinal = certificate.gpaFinal?.toDouble(),
            courseTitle = defense.attestationSession.course.name,
            defenseScore = defense.commissionScore.toDouble(),
            certificateFileUrl = certificate.certificateFileUrl,
            qrCodeUrl = certificate.qrCodeUrl,
            verificationUrl = "https://lms.uz/verify/${certificate.verificationToken}",
            downloadUrl = "/api/certificates/${certificate.id}/download",
        )
    }

    @Transactional(readOnly = true)
    fun getCertificateStatistics(
        courseId: Long,
        userId: Long,
        mayManageAll: Boolean,
    ): uz.scorm.lms.app.v1.attestation.dto.CertificateStatisticsDto {
        courseAccessService.requireView(courseId, userId, mayManageAll)

        // This would typically query statistics from database
        return uz.scorm.lms.app.v1.attestation.dto.CertificateStatisticsDto(
            totalGenerated = 0,
            totalIssued = 0,
            totalPending = 0,
            issuedThisMonth = 0,
            issuedThisYear = 0,
            verifiedCount = 0,
            verificationRate = 0.0,
            averageDaysToIssue = 0.0,
        )
    }

    private fun toCertificateDetailsDto(certificate: GraduationCertificate): GraduationCertificateDetailsDto {
        return GraduationCertificateDetailsDto(
            id = certificate.id.toString(),
            certificateNumber = certificate.certificateNumber,
            issueDate = certificate.issueDate,
            issuedByName = certificate.issuedBy.fullName ?: certificate.issuedBy.username,
            issuedByEmail = certificate.issuedBy.email,
            studentId = certificate.studentDefense.enrollment.student.id.toString(),
            studentName = certificate.studentDefense.enrollment.student.fullName ?: certificate.studentDefense.enrollment.student.username,
            studentEmail = certificate.studentDefense.enrollment.student.email,
            courseId = certificate.studentDefense.attestationSession.course.id.toString(),
            courseName = certificate.studentDefense.attestationSession.course.name,
            programName = certificate.studentDefense.attestationSession.course.name,
            specialization = certificate.specialization,
            gpaFinal = certificate.gpaFinal?.toDouble(),
            defenseScore = certificate.studentDefense.commissionScore.toDouble(),
            defenseType = certificate.studentDefense.attestationSession.defenseType.name,
            certificateFileUrl = certificate.certificateFileUrl,
            qrCodeUrl = certificate.qrCodeUrl,
            verificationUrl = "https://lms.uz/verify/${certificate.verificationToken}",
            verified = false,
            verificationDate = null,
            issuedAt = certificate.createdAt!!,
        )
    }

    private fun generateCertificateNumber(year: Int): String {
        val lastCertificate = certificateRepository.findDistinctYears().firstOrNull()
        val yearPrefix = "$year-"

        // In production, this would get the highest number for the year from database
        // For now, we'll use a simple sequential number
        val sequenceNumber = String.format("%05d", 1)
        return "$yearPrefix$sequenceNumber"
    }
}