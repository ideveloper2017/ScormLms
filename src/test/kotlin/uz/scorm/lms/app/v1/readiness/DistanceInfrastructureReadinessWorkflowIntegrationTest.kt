package uz.scorm.lms.app.v1.readiness

import org.junit.jupiter.api.Assertions.assertEquals
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
import uz.scorm.lms.app.v1.compliance.ComplianceStatus
import uz.scorm.lms.app.v1.compliance.Decision559ComplianceService
import uz.scorm.lms.app.v1.disclosure.dto.ReviewOfficialSitePublicationRequest
import uz.scorm.lms.app.v1.disclosure.dto.SaveOfficialSitePublicationRequest
import uz.scorm.lms.app.v1.disclosure.model.OfficialSitePublicationCategory
import uz.scorm.lms.app.v1.disclosure.service.OfficialSitePublicationService
import uz.scorm.lms.app.v1.readiness.dto.ReviewDistanceInfrastructureReadinessRequest
import uz.scorm.lms.app.v1.readiness.dto.SaveDistanceInfrastructureReadinessRequest
import uz.scorm.lms.app.v1.readiness.model.DistanceReadinessStatus
import uz.scorm.lms.app.v1.readiness.model.ServerOwnershipType
import uz.scorm.lms.app.v1.readiness.service.DistanceInfrastructureReadinessService
import uz.scorm.lms.app.v1.user.model.User
import uz.scorm.lms.app.v1.user.repository.UserRepository
import java.math.BigDecimal
import java.time.Instant
import java.time.LocalDate

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class DistanceInfrastructureReadinessWorkflowIntegrationTest {
    @Autowired private lateinit var service: DistanceInfrastructureReadinessService
    @Autowired private lateinit var complianceService: Decision559ComplianceService
    @Autowired private lateinit var publicationService: OfficialSitePublicationService
    @Autowired private lateinit var userRepository: UserRepository
    @Autowired private lateinit var mockMvc: MockMvc

    @Test
    fun `8-band readiness requires independent verification Uzbekistan server capacity and five year lease`() {
        val author = user("readiness-author")
        val reviewer = user("readiness-reviewer")
        val publicPublicationIds = publishRequiredWebsiteInformation(author, reviewer)

        assertThrows<IllegalArgumentException> {
            service.create(validRequest().copy(leaseEndDate = LocalDate.now().plusYears(5).minusDays(1)), requireNotNull(author.id))
        }
        assertThrows<IllegalArgumentException> {
            service.create(validRequest().copy(serverCapacityStudents = 499), requireNotNull(author.id))
        }

        val draft = service.create(validRequest(), requireNotNull(author.id))
        assertEquals(DistanceReadinessStatus.DRAFT, draft.status)
        assertThrows<IllegalArgumentException> {
            service.verify(draft.id, ReviewDistanceInfrastructureReadinessRequest("Barcha dalillar tekshirildi"), requireNotNull(author.id))
        }

        val verified = service.verify(
            draft.id,
            ReviewDistanceInfrastructureReadinessRequest("Internet, sanitariya, shtat, server va rasmiy sayt dalillari mustaqil tekshirildi"),
            requireNotNull(reviewer.id),
        )
        assertEquals(DistanceReadinessStatus.VERIFIED, verified.status)
        assertTrue(verified.minimumFiveYearLease)
        assertEquals(500, verified.plannedDistanceStudents)
        assertEquals(750, verified.serverCapacityStudents)
        assertThrows<IllegalArgumentException> { service.update(draft.id, validRequest(), requireNotNull(author.id)) }

        val evidence = complianceService.summary().evidence.first { it.code == "INFRASTRUCTURE_READINESS" }
        assertEquals(1, evidence.recordCount)
        assertEquals(ComplianceStatus.COMPLIANT, evidence.status)
        val publicEvidence = complianceService.summary().evidence.first { it.code == "OFFICIAL_SITE_PUBLICATIONS" }
        assertEquals(4, publicEvidence.recordCount)
        assertEquals(ComplianceStatus.COMPLIANT, publicEvidence.status)
        publicationService.archive(publicPublicationIds.first(), requireNotNull(reviewer.id))
        publicationService.list()
            .filter { it.category == OfficialSitePublicationCategory.entries.first() && it.status == uz.scorm.lms.app.v1.disclosure.model.OfficialSitePublicationStatus.PUBLISHED }
            .forEach { publicationService.archive(it.id, requireNotNull(reviewer.id)) }
        val evidenceAfterArchive = complianceService.summary().evidence.first { it.code == "OFFICIAL_SITE_PUBLICATIONS" }
        assertEquals(3, evidenceAfterArchive.recordCount)
        assertEquals(ComplianceStatus.NON_COMPLIANT, evidenceAfterArchive.status)
    }

    @Test
    fun `official website must expose all four required information groups before verification`() {
        val author = user("website-author")
        val reviewer = user("website-reviewer")
        val draft = service.create(validRequest().copy(websiteHasAcademicCalendar = false), requireNotNull(author.id))

        assertThrows<IllegalArgumentException> {
            service.verify(draft.id, ReviewDistanceInfrastructureReadinessRequest("Sayt tarkibi tekshirildi va kamchilik topildi"), requireNotNull(reviewer.id))
        }
        val rejected = service.reject(
            draft.id,
            ReviewDistanceInfrastructureReadinessRequest("Rasmiy saytda akademik kalendar e'lon qilinmagan"),
            requireNotNull(reviewer.id),
        )
        assertEquals(DistanceReadinessStatus.REJECTED, rejected.status)
    }

    @Test
    @WithMockUser(username = "readiness-monitor", authorities = ["AUDIT_READ"])
    fun `monitoring reads readiness profiles but cannot create them`() {
        userRepository.save(User(username = "readiness-monitor", password = "test"))
        mockMvc.get("/api/v1/distance-readiness").andExpect { status { isOk() } }
        mockMvc.post("/api/v1/distance-readiness") {
            contentType = MediaType.APPLICATION_JSON
            content = validJson()
        }.andExpect { status { isForbidden() } }
    }

    private fun validRequest() = SaveDistanceInfrastructureReadinessRequest(
        versionCode = "INFRA-${System.nanoTime()}",
        title = "Masofaviy ta'lim infratuzilmasi readiness profili",
        internetProvider = "Test internet provayderi",
        internetCapacityMbps = BigDecimal("1000.00"),
        internetEvidenceReference = "evidence://internet/contract-01",
        computerFacilityAddress = "Toshkent shahri, test kampusi, 101-xona",
        sanitationDocumentNumber = "SAN-2026-01",
        sanitationDocumentDate = LocalDate.now(),
        sanitationEvidenceReference = "evidence://sanitation/SAN-2026-01",
        technicalStaffCount = 3,
        technicalStaffQualificationReference = "evidence://hr/technical-staff-register",
        plannedDistanceStudents = 500,
        serverCapacityStudents = 750,
        serverOwnershipType = ServerOwnershipType.LEASED,
        serverCountryCode = "UZ",
        serverLocationAddress = "Toshkent shahri, test data-markaz",
        serverDocumentNumber = "LEASE-2026-01",
        serverDocumentDate = LocalDate.now(),
        serverEvidenceReference = "evidence://server/LEASE-2026-01",
        leaseStartDate = LocalDate.now(),
        leaseEndDate = LocalDate.now().plusYears(5),
        officialWebsiteUrl = "https://example.edu.uz/distance",
        websiteHasCharter = true,
        websiteHasCurricula = true,
        websiteHasStaffInformation = true,
        websiteHasAcademicCalendar = true,
        websiteReviewedAt = Instant.now().minusSeconds(1),
    )

    private fun validJson() = """{
      "versionCode":"HTTP-${System.nanoTime()}","title":"Masofaviy infratuzilma readiness profili",
      "internetProvider":"Provayder","internetCapacityMbps":1000,"internetEvidenceReference":"evidence://internet/1",
      "computerFacilityAddress":"Toshkent shahri test kampusi","sanitationDocumentNumber":"SAN-1",
      "sanitationDocumentDate":"${LocalDate.now()}","sanitationEvidenceReference":"evidence://sanitation/1",
      "technicalStaffCount":2,"technicalStaffQualificationReference":"evidence://staff/1",
      "plannedDistanceStudents":100,"serverCapacityStudents":150,"serverOwnershipType":"OWNED","serverCountryCode":"UZ",
      "serverLocationAddress":"Toshkent shahri data markaz","serverDocumentNumber":"OWN-1",
      "serverDocumentDate":"${LocalDate.now()}","serverEvidenceReference":"evidence://server/1",
      "officialWebsiteUrl":"https://example.edu.uz","websiteHasCharter":true,"websiteHasCurricula":true,
      "websiteHasStaffInformation":true,"websiteHasAcademicCalendar":true,"websiteReviewedAt":"${Instant.now().minusSeconds(1)}"
    }"""

    private fun publishRequiredWebsiteInformation(author: User, reviewer: User): List<Long> =
        OfficialSitePublicationCategory.entries.map { category ->
            val slug = "${category.name.lowercase().replace('_', '-')}-${System.nanoTime()}"
            val draft = publicationService.create(
                SaveOfficialSitePublicationRequest(
                    category = category, slug = slug, versionCode = "1.0",
                    title = "${category.name} bo'yicha rasmiy axborot",
                    summary = "Qarorning 8-bandi uchun ommaga ochiq va tekshiriladigan test axboroti.",
                    sourceDocumentNumber = "DOC-${category.name}", sourceDocumentDate = LocalDate.now(),
                    sourceReference = "evidence://official-site/$slug", effectiveFrom = LocalDate.now(),
                ),
                requireNotNull(author.id),
            )
            publicationService.publish(
                draft.id, ReviewOfficialSitePublicationRequest("Manba hujjatga solishtirib mustaqil tekshirildi"), requireNotNull(reviewer.id),
            ).id
        }

    private fun user(prefix: String) = userRepository.save(User(
        username = "$prefix-${System.nanoTime()}", password = "test", fullName = prefix,
    ))
}
