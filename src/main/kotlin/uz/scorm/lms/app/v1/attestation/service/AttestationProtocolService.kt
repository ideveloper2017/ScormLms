package uz.scorm.lms.app.v1.attestation.service

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.attestation.model.DefenseDecision
import uz.scorm.lms.app.v1.attestation.model.AttestationProtocol
import uz.scorm.lms.app.v1.attestation.repository.AttestationProtocolRepository
import uz.scorm.lms.app.v1.attestation.repository.AttestationSessionRepository
import uz.scorm.lms.app.v1.attestation.repository.StudentDefenseRepository
import uz.scorm.lms.app.v1.audit.service.AuditService
import uz.scorm.lms.app.v1.courses.service.CourseAccessService
import uz.scorm.lms.app.v1.user.repository.UserRepository
import java.time.LocalDate
import java.time.Instant

@Service
class AttestationProtocolService(
    private val protocolRepository: AttestationProtocolRepository,
    private val sessionRepository: AttestationSessionRepository,
    private val defenseRepository: StudentDefenseRepository,
    private val userRepository: UserRepository,
    private val courseAccessService: CourseAccessService,
    private val auditService: AuditService,
) {

    @Transactional
    fun generateProtocol(
        sessionId: Long,
        userId: Long,
        mayManageAll: Boolean,
    ): uz.scorm.lms.app.v1.attestation.dto.AttestationSessionStatsDto {
        val session = sessionRepository.findByIdAndDeletedFalse(sessionId)
            ?: throw IllegalArgumentException("Attestatsiya sessiyasi topilmadi")

        courseAccessService.requireManage(session.course.id, userId, mayManageAll)

        val existingProtocol = protocolRepository.findByAttestationSessionIdAndDeletedFalse(sessionId)
        require(existingProtocol == null) { "Bu sessiya uchun protocol allaqachon yaratilgan" }

        val defenses = defenseRepository.findAllByAttestationSessionIdAndDeletedFalseOrderByDefenseDateAsc(sessionId)
        val passedCount = defenses.count { it.commissionDecision == DefenseDecision.PASS }
        val failedCount = defenses.count { it.commissionDecision == DefenseDecision.FAIL }
        val retakeCount = defenses.count { it.commissionDecision == DefenseDecision.RETAKE }

        val protocolNumber = generateProtocolNumber(LocalDate.now().year)

        val protocol = AttestationProtocol(
            attestationSession = session,
            protocolNumber = protocolNumber,
            protocolDate = LocalDate.now(),
            totalStudents = defenses.size,
            passedCount = passedCount,
            failedCount = failedCount,
            retakeCount = retakeCount,
        )

        protocolRepository.save(protocol)
        auditService.logAction(
            "PROTOCOL_GENERATED",
            userId,
            "Attestatsiya protokoli yaratildi: $protocolNumber"
        )

        return uz.scorm.lms.app.v1.attestation.dto.AttestationSessionStatsDto(
            sessionId = sessionId.toString(),
            totalEnrolled = defenses.size,
            defenseScheduled = 0,
            defenseCompleted = defenses.size,
            defenceCancelled = 0,
            passedCount = passedCount,
            failedCount = failedCount,
            retakeCount = retakeCount,
            passPercentage = if (defenses.isNotEmpty()) (passedCount.toDouble() / defenses.size) * 100 else 0.0,
            averageScore = defenses.map { it.commissionScore.toDouble() }.average().takeIf { it.isFinite() },
            highestScore = defenses.maxOfOrNull { it.commissionScore.toDouble() },
            lowestScore = defenses.minOfOrNull { it.commissionScore.toDouble() },
            certificatesIssued = 0,
            certificatesPending = passedCount,
            protocolApproved = false,
            resultPublished = false,
        )
    }

    @Transactional
    fun approveProtocol(
        protocolId: Long,
        userId: Long,
        mayManageAll: Boolean,
    ) {
        val protocol = protocolRepository.findByIdAndDeletedFalse(protocolId)
            ?: throw IllegalArgumentException("Protocol topilmadi")

        courseAccessService.requireManage(protocol.attestationSession.course.id, userId, mayManageAll)

        val approver = userRepository.findById(userId)
            .orElseThrow { IllegalArgumentException("Foydalanuvchi topilmadi") }

        protocol.approver = approver
        protocol.approvedAt = Instant.now()

        protocolRepository.save(protocol)
        auditService.logAction(
            "PROTOCOL_APPROVED",
            userId,
            "Attestatsiya protokoli tasdiqlandi: ${protocol.protocolNumber}"
        )
    }

    @Transactional(readOnly = true)
    fun getProtocol(
        protocolId: Long,
        userId: Long,
        mayManageAll: Boolean,
    ): uz.scorm.lms.app.v1.attestation.dto.AttestationSessionStatsDto {
        val protocol = protocolRepository.findByIdAndDeletedFalse(protocolId)
            ?: throw IllegalArgumentException("Protocol topilmadi")

        courseAccessService.requireView(protocol.attestationSession.course.id, userId, mayManageAll)

        return uz.scorm.lms.app.v1.attestation.dto.AttestationSessionStatsDto(
            sessionId = protocol.attestationSession.id.toString(),
            totalEnrolled = protocol.totalStudents,
            defenseScheduled = 0,
            defenseCompleted = protocol.totalStudents,
            defenceCancelled = 0,
            passedCount = protocol.passedCount,
            failedCount = protocol.failedCount,
            retakeCount = protocol.retakeCount,
            passPercentage = if (protocol.totalStudents > 0) {
                (protocol.passedCount.toDouble() / protocol.totalStudents) * 100
            } else {
                0.0
            },
            averageScore = null,
            highestScore = null,
            lowestScore = null,
            certificatesIssued = 0,
            certificatesPending = protocol.passedCount,
            protocolApproved = protocol.approver != null,
            resultPublished = false,
        )
    }

    @Transactional(readOnly = true)
    fun getPendingProtocols(
        userId: Long,
        mayManageAll: Boolean,
    ): List<uz.scorm.lms.app.v1.attestation.dto.AttestationSessionStatsDto> {
        val pendingProtocols = protocolRepository.findAllByApproverIdIsNullAndDeletedFalseOrderByProtocolDateDesc()

        return pendingProtocols.map { protocol ->
            uz.scorm.lms.app.v1.attestation.dto.AttestationSessionStatsDto(
                sessionId = protocol.attestationSession.id.toString(),
                totalEnrolled = protocol.totalStudents,
                defenseScheduled = 0,
                defenseCompleted = protocol.totalStudents,
                defenceCancelled = 0,
                passedCount = protocol.passedCount,
                failedCount = protocol.failedCount,
                retakeCount = protocol.retakeCount,
                passPercentage = if (protocol.totalStudents > 0) {
                    (protocol.passedCount.toDouble() / protocol.totalStudents) * 100
                } else {
                    0.0
                },
                averageScore = null,
                highestScore = null,
                lowestScore = null,
                certificatesIssued = 0,
                certificatesPending = protocol.passedCount,
                protocolApproved = false,
                resultPublished = false,
            )
        }
    }

    @Transactional(readOnly = true)
    fun getIssuanceReport(
        dateFrom: LocalDate,
        dateTo: LocalDate,
        userId: Long,
        mayManageAll: Boolean,
    ): uz.scorm.lms.app.v1.attestation.dto.CertificateIssuanceReportDto {
        val protocols = protocolRepository.findAllByProtocolDateBetweenAndDeletedFalseOrderByProtocolDateDesc(dateFrom, dateTo)

        val totalIssued = protocols.sumOf { it.passedCount }
        val byProgram = mutableMapOf<String, Int>()
        val byDefenseType = mutableMapOf<String, Int>()

        for (protocol in protocols) {
            val program = protocol.attestationSession.course.name
            byProgram[program] = (byProgram[program] ?: 0) + protocol.passedCount

            val type = protocol.attestationSession.defenseType.name
            byDefenseType[type] = (byDefenseType[type] ?: 0) + protocol.passedCount
        }

        return uz.scorm.lms.app.v1.attestation.dto.CertificateIssuanceReportDto(
            reportDate = LocalDate.now(),
            totalCertificatesIssued = totalIssued,
            byProgram = byProgram,
            bySpecialization = emptyMap(),
            byDefenseType = byDefenseType,
            avgGpa = null,
            avgDefenseScore = null,
        )
    }

    @Transactional(readOnly = true)
    fun getComplianceReport(
        courseId: Long,
        userId: Long,
        mayManageAll: Boolean,
    ): uz.scorm.lms.app.v1.attestation.dto.CertificateComplianceReportDto {
        courseAccessService.requireView(courseId, userId, mayManageAll)

        // This would typically aggregate data from multiple sources
        return uz.scorm.lms.app.v1.attestation.dto.CertificateComplianceReportDto(
            reportDate = LocalDate.now(),
            totalCertificates = 0,
            certificatesWithQrCode = 0,
            certificatesWithFile = 0,
            certificatesVerified = 0,
            certificatesActive = 0,
            certificatesRevoked = 0,
            compliancePercentage = 0.0,
            issues = emptyList(),
        )
    }

    private fun generateProtocolNumber(year: Int): String {
        val yearPrefix = "$year-"
        // In production, this would get the highest number for the year
        val sequenceNumber = String.format("%05d", 1)
        return "$yearPrefix$sequenceNumber"
    }
}