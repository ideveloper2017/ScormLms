package uz.scorm.lms.app.v1.disclosure

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.http.MediaType
import org.springframework.security.test.context.support.WithMockUser
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.post
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.disclosure.dto.ReviewOfficialSitePublicationRequest
import uz.scorm.lms.app.v1.disclosure.dto.SaveOfficialSitePublicationRequest
import uz.scorm.lms.app.v1.disclosure.model.OfficialSitePublicationCategory
import uz.scorm.lms.app.v1.disclosure.model.OfficialSitePublicationStatus
import uz.scorm.lms.app.v1.disclosure.service.OfficialSitePublicationService
import uz.scorm.lms.app.v1.user.model.User
import uz.scorm.lms.app.v1.user.repository.UserRepository
import java.time.LocalDate

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class OfficialSitePublicationWorkflowIntegrationTest {
    @Autowired private lateinit var service: OfficialSitePublicationService
    @Autowired private lateinit var userRepository: UserRepository
    @Autowired private lateinit var mockMvc: MockMvc

    @Test
    fun `four independently published categories form complete anonymous public disclosure`() {
        val author = user("disclosure-author")
        val reviewer = user("disclosure-reviewer")

        OfficialSitePublicationCategory.entries.forEachIndexed { index, category ->
            val draft = service.create(validRequest(category, "public-item-$index"), requireNotNull(author.id))
            assertThrows<IllegalArgumentException> {
                service.publish(draft.id, ReviewOfficialSitePublicationRequest("Muallif o'zi tasdiqlashga urindi"), requireNotNull(author.id))
            }
            val published = service.publish(
                draft.id, ReviewOfficialSitePublicationRequest("Manba hujjat va ommaviy matn mustaqil tekshirildi"), requireNotNull(reviewer.id),
            )
            assertEquals(OfficialSitePublicationStatus.PUBLISHED, published.status)
            assertTrue(published.currentlyVisible)
        }

        val disclosure = service.publicDisclosure()
        assertTrue(disclosure.complete)
        assertEquals(4, disclosure.coveredCategories.size)
        assertEquals(4, disclosure.publications.size)
        assertTrue(disclosure.missingCategories.isEmpty())

        mockMvc.get("/public/api/institution-disclosures")
            .andExpect { status { isOk() }; jsonPath("$.complete") { value(true) }; jsonPath("$.publications.length()") { value(4) } }

        val archived = service.archive(service.list().first().id, requireNotNull(reviewer.id))
        assertEquals(OfficialSitePublicationStatus.ARCHIVED, archived.status)
        assertFalse(service.publicDisclosure().complete)
    }

    @Test
    fun `draft rejected and future publications never count as current public coverage`() {
        val author = user("future-author")
        val reviewer = user("future-reviewer")
        val future = service.create(
            validRequest(OfficialSitePublicationCategory.ACADEMIC_CALENDAR, "future-calendar")
                .copy(effectiveFrom = LocalDate.now().plusDays(1)),
            requireNotNull(author.id),
        )
        val futurePublished = service.publish(future.id, ReviewOfficialSitePublicationRequest("Kelajak akademik kalendari tekshirildi"), requireNotNull(reviewer.id))
        assertFalse(futurePublished.currentlyVisible)
        assertFalse(service.publicDisclosure().publications.any { it.slug == "future-calendar" })

        val rejectedDraft = service.create(validRequest(OfficialSitePublicationCategory.TEACHING_STAFF, "rejected-staff"), requireNotNull(author.id))
        val rejected = service.reject(
            rejectedDraft.id, ReviewOfficialSitePublicationRequest("Pedagoglar manba hujjati yetarli emas"), requireNotNull(reviewer.id),
        )
        assertEquals(OfficialSitePublicationStatus.REJECTED, rejected.status)
        val tomorrow = service.publicDisclosure(LocalDate.now().plusDays(1)).publications
        assertTrue(tomorrow.any { it.slug == "future-calendar" })
        assertFalse(tomorrow.any { it.slug == "rejected-staff" })
    }

    @Test
    @WithMockUser(username = "disclosure-monitor", authorities = ["AUDIT_READ"])
    fun `monitoring reads registry but cannot create publication`() {
        userRepository.save(User(username = "disclosure-monitor", password = "test"))
        mockMvc.get("/api/v1/official-site-publications").andExpect { status { isOk() } }
        mockMvc.post("/api/v1/official-site-publications") {
            contentType = MediaType.APPLICATION_JSON
            content = validJson()
        }.andExpect { status { isForbidden() } }
    }

    private fun validRequest(category: OfficialSitePublicationCategory, slug: String) = SaveOfficialSitePublicationRequest(
        category = category, slug = slug, versionCode = "1.0", title = "Qaror 8-bandi uchun rasmiy axborot",
        summary = "Ommaviy sahifada chop etiladigan, manba hujjatga bog'langan tekshiriladigan mazmun.",
        sourceDocumentNumber = "DOC-${System.nanoTime()}", sourceDocumentDate = LocalDate.now(),
        sourceReference = "evidence://official-site/$slug", effectiveFrom = LocalDate.now(),
    )

    private fun validJson() = """{
      "category":"CHARTER_OR_STATUTE","slug":"monitoring-cannot-write","versionCode":"1.0",
      "title":"Rasmiy ustav ma'lumoti","summary":"Ommaviy sahifa uchun yetarli uzunlikdagi tekshiriladigan rasmiy mazmun.",
      "sourceDocumentNumber":"DOC-1","sourceDocumentDate":"${LocalDate.now()}",
      "sourceReference":"evidence://official-site/monitoring","effectiveFrom":"${LocalDate.now()}"
    }"""

    private fun user(prefix: String) = userRepository.save(User(
        username = "$prefix-${System.nanoTime()}", password = "test", fullName = prefix,
    ))
}
