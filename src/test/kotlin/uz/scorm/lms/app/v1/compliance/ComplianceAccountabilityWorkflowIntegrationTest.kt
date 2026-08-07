package uz.scorm.lms.app.v1.compliance

import jakarta.transaction.Transactional
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.AfterEach
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
import uz.scorm.lms.app.v1.user.model.User
import uz.scorm.lms.app.v1.user.repository.UserRepository
import java.time.LocalDate

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class ComplianceAccountabilityWorkflowIntegrationTest {
    @Autowired private lateinit var service: ComplianceAccountabilityService
    @Autowired private lateinit var issueRepository: ComplianceIssueRepository
    @Autowired private lateinit var referralRepository: ComplianceAccountabilityReferralRepository
    @Autowired private lateinit var userRepository: UserRepository
    @Autowired private lateinit var mockMvc: MockMvc

    @AfterEach
    fun cleanReferralFixtures() {
        referralRepository.deleteAll()
    }

    @Test
    fun `33-band records responsibility only from independently referred external decision`() {
        val author = user("accountability-author")
        val referrer = user("accountability-referrer")
        val recorder = user("accountability-recorder")
        val issue = issueRepository.save(ComplianceIssue(
            violationCode = "TEST-33-${System.nanoTime()}", clause = "33-band", severity = ComplianceIssueSeverity.WARNING,
            title = "559-son qaror talabi buzilishi tekshiruvi", recommendation = "Vakolatli organga yuborish",
            remediationPlan = "Dalil paketini shakllantirish va huquqiy tartibda ko'rib chiqish", owner = author,
            dueDate = LocalDate.now().plusDays(10), status = ComplianceIssueStatus.IN_PROGRESS,
        ))
        val request = SaveAccountabilityReferralRequest(
            complianceIssueId = requireNotNull(issue.id),
            reviewSubjectReference = "HR/EMPLOYEE-REVIEW-17",
            competentAuthority = "Universitet intizomiy komissiyasi",
            legalBasis = "Mehnat kodeksi va universitetning tasdiqlangan intizom reglamenti",
            referralNumber = "REF-33-${System.nanoTime()}",
            referralDate = LocalDate.now().minusDays(2),
            evidencePackageReference = "LEGAL-ARCHIVE/EVIDENCE-33-17",
        )

        val created = service.create(request, requireNotNull(author.id))
        assertEquals(AccountabilityReferralStatus.DRAFT, created.status)
        assertFalse(created.responsibilityEstablished)
        assertThrows<IllegalArgumentException> {
            service.refer(created.id, ReferAccountabilityRequest("Dalil paketi to'liq tekshirildi"), requireNotNull(author.id))
        }

        val referred = service.refer(
            created.id,
            ReferAccountabilityRequest("Dalil paketi va vakolatli organ rekvizitlari mustaqil tekshirildi"),
            requireNotNull(referrer.id),
        )
        assertEquals(AccountabilityReferralStatus.REFERRED, referred.status)
        val early = assertThrows<IllegalArgumentException> {
            service.recordDecision(created.id, decision(LocalDate.now().minusDays(3)), requireNotNull(recorder.id))
        }
        assertTrue(early.message.orEmpty().contains("referral sanasidan oldin"))

        val decided = service.recordDecision(created.id, decision(LocalDate.now()), requireNotNull(recorder.id))
        assertEquals(AccountabilityReferralStatus.DECIDED, decided.status)
        assertEquals(AccountabilityDecisionOutcome.RESPONSIBILITY_ESTABLISHED, decided.decisionOutcome)
        assertTrue(decided.responsibilityEstablished)
        assertNotNull(decided.decidedAt)
        assertThrows<IllegalArgumentException> {
            service.recordDecision(created.id, decision(LocalDate.now()), requireNotNull(recorder.id))
        }
    }

    @Test
    @WithMockUser(username = "accountability-monitor", authorities = ["STAT_READ"])
    fun `monitoring may read but cannot mutate accountability referrals`() {
        userRepository.save(User(username = "accountability-monitor", password = "test"))
        mockMvc.get("/api/v1/compliance/559/accountability-referrals").andExpect { status { isOk() } }
        mockMvc.post("/api/v1/compliance/559/accountability-referrals") {
            contentType = MediaType.APPLICATION_JSON
            content = """
                {
                  "complianceIssueId": 1,
                  "reviewSubjectReference": "HR/SUBJECT-1",
                  "competentAuthority": "Vakolatli organ",
                  "legalBasis": "Qonunchilik hujjati",
                  "referralNumber": "REF-RBAC",
                  "referralDate": "${LocalDate.now()}",
                  "evidencePackageReference": "ARCHIVE/EVIDENCE"
                }
            """.trimIndent()
        }.andExpect { status { isForbidden() } }
    }

    @Test
    @WithMockUser(authorities = ["COURSE_READ"])
    fun `ordinary learning participant cannot read accountability referrals`() {
        mockMvc.get("/api/v1/compliance/559/accountability-referrals").andExpect { status { isForbidden() } }
    }

    private fun decision(date: LocalDate) = RecordAccountabilityDecisionRequest(
        outcome = AccountabilityDecisionOutcome.RESPONSIBILITY_ESTABLISHED,
        decisionAuthority = "Universitet intizomiy komissiyasi",
        decisionNumber = "DEC-33-17",
        decisionDate = date,
        decisionEvidenceReference = "LEGAL-ARCHIVE/DECISION-33-17",
        decisionSummary = "Vakolatli komissiya dalillarni ko'rib chiqib, qonunchilik va ichki reglament bo'yicha javobgarlik mavjudligini belgiladi.",
    )

    private fun user(prefix: String) = userRepository.save(User(
        username = "$prefix-${System.nanoTime()}", password = "encoded-password", fullName = "Yuridik bo'lim xodimi",
    ))
}
