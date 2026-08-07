package uz.scorm.lms.app.v1.biometric

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.http.MediaType
import org.springframework.security.test.context.support.WithMockUser
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.post
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.biometric.dto.AcceptBiometricConsentRequest
import uz.scorm.lms.app.v1.biometric.dto.PublishBiometricPolicyRequest
import uz.scorm.lms.app.v1.biometric.dto.SaveBiometricPolicyRequest
import uz.scorm.lms.app.v1.biometric.dto.WithdrawBiometricConsentRequest
import uz.scorm.lms.app.v1.biometric.model.BiometricPolicyStatus
import uz.scorm.lms.app.v1.biometric.service.BiometricDataErasureService
import uz.scorm.lms.app.v1.biometric.service.BiometricGovernanceService
import uz.scorm.lms.app.v1.user.model.User
import uz.scorm.lms.app.v1.user.repository.UserRepository
import java.time.Instant
import java.time.LocalDate
import java.time.LocalDateTime

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class BiometricGovernanceWorkflowIntegrationTest {
    @Autowired private lateinit var service: BiometricGovernanceService
    @Autowired private lateinit var erasureService: BiometricDataErasureService
    @Autowired private lateinit var userRepository: UserRepository
    @Autowired private lateinit var mockMvc: MockMvc

    @Test
    fun `policy must be independently published and exact version consent gates biometric processing`() {
        val author = user("bio-author")
        val approver = user("bio-approver")
        val student = user("bio-student")
        archivePublished(requireNotNull(approver.id))
        val draft = service.create(policyRequest(), requireNotNull(author.id))
        assertEquals(BiometricPolicyStatus.DRAFT, draft.status)
        assertThrows<IllegalArgumentException> {
            service.publish(draft.id, PublishBiometricPolicyRequest("Hujjat va retention muddati tekshirildi"), requireNotNull(author.id))
        }
        val published = service.publish(
            draft.id,
            PublishBiometricPolicyRequest("Yuridik asos, aniq rozilik matni va ikki retention muddati mustaqil tekshirildi"),
            requireNotNull(approver.id),
        )
        assertEquals(BiometricPolicyStatus.PUBLISHED, published.status)
        assertThrows<IllegalArgumentException> { service.requireActiveConsent(requireNotNull(student.id)) }
        assertThrows<IllegalArgumentException> {
            service.accept(AcceptBiometricConsentRequest(published.id, "0".repeat(64)), requireNotNull(student.id))
        }
        val accepted = service.accept(
            AcceptBiometricConsentRequest(published.id, published.statementHash),
            requireNotNull(student.id),
        )
        assertTrue(accepted.consentGranted)
        assertNotNull(accepted.consentedAt)
        val binding = service.requireActiveConsent(requireNotNull(student.id))
        assertEquals(published.id, binding.policy.id)
    }

    @Test
    fun `withdrawal erases face template and expired retention is idempotently purged`() {
        val author = user("bio-erase-author")
        val approver = user("bio-erase-approver")
        val student = user("bio-erase-student")
        archivePublished(requireNotNull(approver.id))
        val draft = service.create(policyRequest("ERASE-${System.nanoTime()}"), requireNotNull(author.id))
        val policy = service.publish(draft.id, PublishBiometricPolicyRequest("Mustaqil xavfsizlik va yuridik tekshiruv bajarildi"), requireNotNull(approver.id))
        service.accept(AcceptBiometricConsentRequest(policy.id, policy.statementHash), requireNotNull(student.id))
        val binding = service.requireActiveConsent(requireNotNull(student.id))
        student.facePhotoUrl = "/uploads/faces/nonexistent-test-file.jpg"
        student.faceDescriptor = "sensitive-template"
        student.faceUploadedAt = LocalDateTime.now().minusDays(10)
        student.facePolicy = binding.policy
        student.faceConsentEvent = binding.consent
        student.faceExpiresAt = Instant.now().minusSeconds(1)
        userRepository.save(student)

        val run = erasureService.runRetention(requireNotNull(approver.id))
        assertEquals(1, run.faceTemplatesPurged)
        val erased = userRepository.findById(requireNotNull(student.id)).orElseThrow()
        assertNull(erased.faceDescriptor)
        assertNull(erased.facePhotoUrl)
        assertEquals(0, erasureService.runRetention(requireNotNull(approver.id)).faceTemplatesPurged)

        erased.facePhotoUrl = "/uploads/faces/nonexistent-test-file-2.jpg"
        erased.faceDescriptor = "new-template"
        erased.faceUploadedAt = LocalDateTime.now()
        erased.facePolicy = binding.policy
        erased.faceConsentEvent = binding.consent
        erased.faceExpiresAt = Instant.now().plusSeconds(3600)
        userRepository.save(erased)
        val withdrawn = service.withdraw(WithdrawBiometricConsentRequest("Biometrik qayta ishlashni davom ettirishni istamayman"), requireNotNull(student.id))
        assertFalse(withdrawn.consentGranted)
        assertFalse(withdrawn.faceRegistered)
        assertThrows<IllegalArgumentException> { service.requireActiveConsent(requireNotNull(student.id)) }
    }

    @Test
    @WithMockUser(username = "biometric-monitor", authorities = ["AUDIT_READ"])
    fun `monitoring reads policy list but cannot create policy`() {
        userRepository.save(User(username = "biometric-monitor", password = "test"))
        mockMvc.get("/api/v1/biometric-governance/policies").andExpect { status { isOk() } }
        mockMvc.post("/api/v1/biometric-governance/policies") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"versionCode":"RBAC","title":"Biometrik siyosat","purposeText":"Proktorli testda shaxsni tekshirish maqsadi","legalBasis":"Tasdiqlangan yuridik hujjat asosi","consentText":"Men biometrik shablon qayta ishlanishiga aniq rozilik beraman.","privacyNotice":"Ma'lumot faqat proktoring uchun ishlatiladi va muddatida o'chiriladi.","documentNumber":"BIO-1","documentDate":"${LocalDate.now()}","documentReference":"REGISTER/BIO-1","faceTemplateRetentionDays":30,"proctoringEvidenceRetentionDays":180}"""
        }.andExpect { status { isForbidden() } }
    }

    private fun policyRequest(version: String = "BIO-${System.nanoTime()}") = SaveBiometricPolicyRequest(
        versionCode = version,
        title = "Proktoring biometrik ma'lumotlarini boshqarish siyosati",
        purposeText = "Proktorli test boshlanishidan oldin talaba shaxsini va faol harakatini tekshirish",
        legalBasis = "Universitetning yuridik va axborot xavfsizligi bo'limlari tasdiqlagan ichki hujjat",
        consentText = "Men yuz rasmi va undan olingan biometrik shablon faqat proktorli test identifikatsiyasi uchun qayta ishlanishiga aniq rozilik beraman.",
        privacyNotice = "Xom challenge kadrlari fayl sifatida saqlanmaydi. Yuz shabloni va proktoringdan hosil bo'lgan dalil ushbu siyosatdagi muddatlar tugagach o'chiriladi.",
        documentNumber = "BIO-POLICY-2026",
        documentDate = LocalDate.now(),
        documentReference = "LEGAL-REGISTER/BIO-POLICY-2026",
        faceTemplateRetentionDays = 30,
        proctoringEvidenceRetentionDays = 180,
    )

    private fun user(prefix: String) = userRepository.save(User(
        username = "$prefix-${System.nanoTime()}", password = "test", fullName = prefix,
    ))

    private fun archivePublished(actorId: Long) {
        service.listPolicies().filter { it.status == BiometricPolicyStatus.PUBLISHED }.forEach { service.archive(it.id, actorId) }
    }
}
