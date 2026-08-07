package uz.scorm.lms.app.v1.biometric.service

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.audit.service.AuditService
import uz.scorm.lms.app.v1.biometric.dto.AcceptBiometricConsentRequest
import uz.scorm.lms.app.v1.biometric.dto.BiometricPolicyDto
import uz.scorm.lms.app.v1.biometric.dto.MyBiometricStatusDto
import uz.scorm.lms.app.v1.biometric.dto.PublishBiometricPolicyRequest
import uz.scorm.lms.app.v1.biometric.dto.SaveBiometricPolicyRequest
import uz.scorm.lms.app.v1.biometric.dto.WithdrawBiometricConsentRequest
import uz.scorm.lms.app.v1.biometric.model.BiometricConsentAction
import uz.scorm.lms.app.v1.biometric.model.BiometricConsentEvent
import uz.scorm.lms.app.v1.biometric.model.BiometricPolicy
import uz.scorm.lms.app.v1.biometric.model.BiometricPolicyStatus
import uz.scorm.lms.app.v1.biometric.repository.BiometricConsentEventRepository
import uz.scorm.lms.app.v1.biometric.repository.BiometricPolicyRepository
import uz.scorm.lms.app.v1.user.model.User
import uz.scorm.lms.app.v1.user.repository.UserRepository
import java.security.MessageDigest
import java.time.Instant
import java.time.LocalDate

@Service
class BiometricGovernanceService(
    private val policyRepository: BiometricPolicyRepository,
    private val consentRepository: BiometricConsentEventRepository,
    private val userRepository: UserRepository,
    private val erasureService: BiometricDataErasureService,
    private val auditService: AuditService,
) {
    @Transactional(readOnly = true)
    fun listPolicies(): List<BiometricPolicyDto> = policyRepository.findAllByDeletedFalseOrderByCreatedAtDesc().map(::toDto)

    @Transactional
    fun create(request: SaveBiometricPolicyRequest, actorId: Long): BiometricPolicyDto {
        validate(request)
        val version = request.versionCode.trim()
        require(!policyRepository.existsByVersionCodeAndDeletedFalse(version)) { "Ushbu biometrik siyosat versiyasi mavjud" }
        val policy = policyRepository.save(BiometricPolicy(
            versionCode = version,
            title = request.title.trim(),
            purposeText = request.purposeText.trim(),
            legalBasis = request.legalBasis.trim(),
            consentText = request.consentText.trim(),
            privacyNotice = request.privacyNotice.trim(),
            documentNumber = request.documentNumber.trim(),
            documentDate = request.documentDate,
            documentReference = request.documentReference.trim(),
            faceTemplateRetentionDays = request.faceTemplateRetentionDays,
            proctoringEvidenceRetentionDays = request.proctoringEvidenceRetentionDays,
            createdByUser = requireUser(actorId),
        ))
        auditService.logAction("BIOMETRIC_POLICY_CREATED", actorId, "policy=${policy.id}; version=${policy.versionCode}")
        return toDto(policy)
    }

    @Transactional
    fun update(id: Long, request: SaveBiometricPolicyRequest, actorId: Long): BiometricPolicyDto {
        val policy = requirePolicy(id)
        require(policy.status == BiometricPolicyStatus.DRAFT) { "Faqat DRAFT biometrik siyosat tahrirlanadi" }
        validate(request)
        val version = request.versionCode.trim()
        require(!policyRepository.existsByVersionCodeAndDeletedFalseAndIdNot(version, id)) { "Ushbu biometrik siyosat versiyasi mavjud" }
        policy.versionCode = version
        policy.title = request.title.trim()
        policy.purposeText = request.purposeText.trim()
        policy.legalBasis = request.legalBasis.trim()
        policy.consentText = request.consentText.trim()
        policy.privacyNotice = request.privacyNotice.trim()
        policy.documentNumber = request.documentNumber.trim()
        policy.documentDate = request.documentDate
        policy.documentReference = request.documentReference.trim()
        policy.faceTemplateRetentionDays = request.faceTemplateRetentionDays
        policy.proctoringEvidenceRetentionDays = request.proctoringEvidenceRetentionDays
        policyRepository.save(policy)
        auditService.logAction("BIOMETRIC_POLICY_UPDATED", actorId, "policy=$id; version=${policy.versionCode}")
        return toDto(policy)
    }

    @Transactional
    fun publish(id: Long, request: PublishBiometricPolicyRequest, actorId: Long): BiometricPolicyDto {
        val policy = requirePolicy(id)
        require(policy.status == BiometricPolicyStatus.DRAFT) { "Faqat DRAFT biometrik siyosat tasdiqlanadi" }
        require(policy.createdByUser.id != actorId) { "Siyosat muallifi uni o'zi tasdiqlay olmaydi" }
        require(policyRepository.countByStatusAndDeletedFalse(BiometricPolicyStatus.PUBLISHED) == 0L) {
            "Amaldagi biometrik siyosat avval arxivlanishi kerak"
        }
        require(!policy.documentDate.isAfter(LocalDate.now())) { "Tasdiqlovchi hujjat sanasi kelajakda bo'lmasligi kerak" }
        val note = request.approvalNote.trim()
        require(note.length in 10..2000) { "Tasdiqlash izohi 10..2000 belgidan iborat bo'lishi kerak" }
        policy.status = BiometricPolicyStatus.PUBLISHED
        policy.publishedSlot = 1
        policy.publishedAt = Instant.now()
        policy.publishedByUser = requireUser(actorId)
        policy.approvalNote = note
        policyRepository.save(policy)
        auditService.logAction("BIOMETRIC_POLICY_PUBLISHED", actorId, "policy=$id; version=${policy.versionCode}; statementHash=${statementHash(policy)}")
        return toDto(policy)
    }

    @Transactional
    fun archive(id: Long, actorId: Long): BiometricPolicyDto {
        val policy = requirePolicy(id)
        require(policy.status == BiometricPolicyStatus.PUBLISHED) { "Faqat PUBLISHED biometrik siyosat arxivlanadi" }
        policy.status = BiometricPolicyStatus.ARCHIVED
        policy.publishedSlot = null
        policy.archivedAt = Instant.now()
        policy.archivedByUser = requireUser(actorId)
        policyRepository.save(policy)
        auditService.logAction("BIOMETRIC_POLICY_ARCHIVED", actorId, "policy=$id; version=${policy.versionCode}")
        return toDto(policy)
    }

    @Transactional(readOnly = true)
    fun myStatus(userId: Long): MyBiometricStatusDto {
        val user = requireUser(userId)
        val policy = currentPolicy()
        val latest = policy?.let { latestConsent(userId, requireNotNull(it.id)) }
        val granted = latest?.action == BiometricConsentAction.GRANTED
        val faceValid = granted && user.faceDescriptor?.isNotBlank() == true && user.facePhotoUrl?.isNotBlank() == true &&
            user.facePolicy?.id == policy?.id && user.faceConsentEvent?.id == latest?.id &&
            user.faceExpiresAt?.isAfter(Instant.now()) == true
        return MyBiometricStatusDto(
            policy = policy?.let(::toDto),
            consentGranted = granted,
            consentedAt = latest?.takeIf { it.action == BiometricConsentAction.GRANTED }?.occurredAt,
            withdrawnAt = latest?.takeIf { it.action == BiometricConsentAction.WITHDRAWN }?.occurredAt,
            faceRegistered = faceValid,
            faceUploadedAt = user.faceUploadedAt,
            faceExpiresAt = user.faceExpiresAt,
        )
    }

    @Transactional
    fun accept(request: AcceptBiometricConsentRequest, userId: Long): MyBiometricStatusDto {
        val user = requireUser(userId)
        val policy = currentPolicy() ?: throw IllegalArgumentException("Tasdiqlangan amaldagi biometrik siyosat mavjud emas")
        require(policy.id == request.policyId) { "Biometrik siyosat versiyasi eskirgan; matnni qayta oching" }
        val expectedHash = statementHash(policy)
        require(MessageDigest.isEqual(expectedHash.toByteArray(), request.statementHash.trim().lowercase().toByteArray())) {
            "Rozilik matni o'zgargan; siyosatni qayta o'qing"
        }
        val latest = latestConsent(userId, requireNotNull(policy.id))
        if (latest?.action == BiometricConsentAction.GRANTED) return myStatus(userId)
        val event = consentRepository.save(BiometricConsentEvent(
            user = user,
            policy = policy,
            action = BiometricConsentAction.GRANTED,
            statementHash = expectedHash,
            occurredAt = Instant.now(),
            actorUser = user,
        ))
        auditService.logAction("BIOMETRIC_CONSENT_GRANTED", userId, "policy=${policy.id}; consent=${event.id}; statementHash=$expectedHash")
        return myStatus(userId)
    }

    @Transactional
    fun withdraw(request: WithdrawBiometricConsentRequest, userId: Long): MyBiometricStatusDto {
        val reason = request.reason.trim()
        require(reason.length in 5..1000) { "Rozilikni qaytarib olish sababi 5..1000 belgidan iborat bo'lishi kerak" }
        val user = requireUser(userId)
        val policy = currentPolicy() ?: throw IllegalArgumentException("Amaldagi biometrik siyosat mavjud emas")
        val latest = latestConsent(userId, requireNotNull(policy.id))
        require(latest?.action == BiometricConsentAction.GRANTED) { "Faol biometrik rozilik topilmadi" }
        val event = consentRepository.save(BiometricConsentEvent(
            user = user,
            policy = policy,
            action = BiometricConsentAction.WITHDRAWN,
            statementHash = statementHash(policy),
            occurredAt = Instant.now(),
            actorUser = user,
            reason = reason,
        ))
        erasureService.eraseFaceTemplate(userId, "CONSENT_WITHDRAWN", userId)
        auditService.logAction("BIOMETRIC_CONSENT_WITHDRAWN", userId, "policy=${policy.id}; consent=${event.id}")
        return myStatus(userId)
    }

    @Transactional(readOnly = true)
    fun requireActiveConsent(userId: Long): BiometricConsentBinding {
        val policy = currentPolicy() ?: throw IllegalArgumentException("Tasdiqlangan biometrik siyosatsiz proktoring ishlamaydi")
        val event = latestConsent(userId, requireNotNull(policy.id))
        require(event?.action == BiometricConsentAction.GRANTED && event.statementHash == statementHash(policy)) {
            "Proktoringdan oldin amaldagi biometrik siyosatga aniq rozilik bering"
        }
        return BiometricConsentBinding(policy, event)
    }

    fun requireActiveFaceTemplate(user: User, binding: BiometricConsentBinding) {
        require(!user.faceDescriptor.isNullOrBlank() && !user.facePhotoUrl.isNullOrBlank()) { "Testdan oldin yuz shablonini ro'yxatdan o'tkazing" }
        require(user.facePolicy?.id == binding.policy.id && user.faceConsentEvent?.id == binding.consent.id) {
            "Yuz shabloni amaldagi rozilik versiyasiga bog'lanmagan; uni qayta ro'yxatdan o'tkazing"
        }
        require(user.faceExpiresAt?.isAfter(Instant.now()) == true) { "Yuz shablonini saqlash muddati tugagan; uni qayta ro'yxatdan o'tkazing" }
    }

    fun requireSameBinding(policyId: Long?, consentId: Long?, binding: BiometricConsentBinding) {
        require(policyId == binding.policy.id && consentId == binding.consent.id) {
            "Proktoring sessiyasi eskirgan biometrik siyosat yoki rozilikka bog'langan"
        }
    }

    fun statementHash(policy: BiometricPolicy): String {
        val canonical = listOf(
            policy.versionCode, policy.title, policy.purposeText, policy.legalBasis, policy.consentText,
            policy.privacyNotice, policy.documentNumber, policy.documentDate.toString(), policy.documentReference,
            policy.faceTemplateRetentionDays.toString(), policy.proctoringEvidenceRetentionDays.toString(),
        ).joinToString("\n")
        return java.security.MessageDigest.getInstance("SHA-256").digest(canonical.toByteArray(Charsets.UTF_8))
            .joinToString("") { "%02x".format(it) }
    }

    private fun currentPolicy() = policyRepository.findFirstByStatusAndDeletedFalseOrderByPublishedAtDesc(BiometricPolicyStatus.PUBLISHED)
    private fun latestConsent(userId: Long, policyId: Long) = consentRepository.findFirstByUserIdAndPolicyIdAndDeletedFalseOrderByOccurredAtDescIdDesc(userId, policyId)
    private fun requirePolicy(id: Long) = policyRepository.findByIdAndDeletedFalse(id) ?: throw NoSuchElementException("Biometrik siyosat topilmadi: $id")
    private fun requireUser(id: Long) = userRepository.findById(id).orElseThrow { NoSuchElementException("Foydalanuvchi topilmadi: $id") }

    private fun validate(request: SaveBiometricPolicyRequest) {
        text(request.versionCode, "Versiya kodi", 1, 100)
        text(request.title, "Siyosat nomi", 5, 500)
        text(request.purposeText, "Qayta ishlash maqsadi", 20, 2000)
        text(request.legalBasis, "Huquqiy asos", 10, 2000)
        text(request.consentText, "Aniq rozilik matni", 30, 10_000)
        text(request.privacyNotice, "Maxfiylik xabarnomasi", 30, 20_000)
        text(request.documentNumber, "Tasdiqlovchi hujjat raqami", 1, 200)
        text(request.documentReference, "Tasdiqlovchi hujjat rekviziti", 5, 1000)
        require(request.faceTemplateRetentionDays in 1..3650) { "Yuz shabloni retention muddati 1..3650 kun bo'lishi kerak" }
        require(request.proctoringEvidenceRetentionDays in 1..3650) { "Proktoring dalili retention muddati 1..3650 kun bo'lishi kerak" }
    }

    private fun text(value: String, label: String, min: Int, max: Int) {
        require(value.trim().length in min..max) { "$label $min..$max belgidan iborat bo'lishi kerak" }
    }

    private fun toDto(policy: BiometricPolicy) = BiometricPolicyDto(
        id = requireNotNull(policy.id), versionCode = policy.versionCode, title = policy.title,
        purposeText = policy.purposeText, legalBasis = policy.legalBasis, consentText = policy.consentText,
        privacyNotice = policy.privacyNotice, documentNumber = policy.documentNumber, documentDate = policy.documentDate,
        documentReference = policy.documentReference, faceTemplateRetentionDays = policy.faceTemplateRetentionDays,
        proctoringEvidenceRetentionDays = policy.proctoringEvidenceRetentionDays, statementHash = statementHash(policy),
        status = policy.status, createdByName = policy.createdByUser.fullName ?: policy.createdByUser.username,
        publishedAt = policy.publishedAt, publishedByName = policy.publishedByUser?.fullName ?: policy.publishedByUser?.username,
        approvalNote = policy.approvalNote, archivedAt = policy.archivedAt,
    )
}

data class BiometricConsentBinding(val policy: BiometricPolicy, val consent: BiometricConsentEvent)
