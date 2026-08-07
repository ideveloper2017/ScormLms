package uz.scorm.lms.app.v1.restriction

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertDoesNotThrow
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
import uz.scorm.lms.app.v1.restriction.dto.DistanceProgramRestrictionEntryRequest
import uz.scorm.lms.app.v1.restriction.dto.PublishDistanceProgramRestrictionCatalogRequest
import uz.scorm.lms.app.v1.restriction.dto.SaveDistanceProgramRestrictionCatalogRequest
import uz.scorm.lms.app.v1.restriction.model.DistanceRestrictionCatalogStatus
import uz.scorm.lms.app.v1.restriction.model.DistanceRestrictionDegreeLevel
import uz.scorm.lms.app.v1.restriction.service.DistanceProgramRestrictionService
import uz.scorm.lms.app.v1.user.model.User
import uz.scorm.lms.app.v1.user.repository.UserRepository
import java.time.LocalDate

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class DistanceProgramRestrictionWorkflowIntegrationTest {
    @Autowired private lateinit var service: DistanceProgramRestrictionService
    @Autowired private lateinit var userRepository: UserRepository
    @Autowired private lateinit var mockMvc: MockMvc

    @Test
    fun `14-band annual catalog is independently published and blocks a listed program`() {
        val author = user("restriction-author")
        val publisher = user("restriction-publisher")
        val year = LocalDate.now().year + 1
        val created = service.create(request(
            year = year,
            version = "OFFICIAL-$year-${System.nanoTime()}",
            publicationDate = LocalDate.now(),
            entries = listOf(DistanceProgramRestrictionEntryRequest(
                programCode = "LAW-601",
                programName = "Huquqshunoslik",
                degreeLevel = DistanceRestrictionDegreeLevel.BACHELOR,
                reason = "Vakolatli vazirlikning masofaviy shakl mumkin bo'lmagan yo'nalishlar ro'yxati",
            )),
        ), requireNotNull(author.id))
        assertEquals(DistanceRestrictionCatalogStatus.DRAFT, created.status)
        assertThrows<IllegalArgumentException> {
            service.publish(created.id, PublishDistanceProgramRestrictionCatalogRequest("Rasmiy manba tekshirildi"), requireNotNull(author.id))
        }

        val published = service.publish(
            created.id,
            PublishDistanceProgramRestrictionCatalogRequest("Hujjat raqami, e'lon sanasi va ro'yxat kodi mustaqil tekshirildi"),
            requireNotNull(publisher.id),
        )
        assertEquals(DistanceRestrictionCatalogStatus.PUBLISHED, published.status)
        assertTrue(published.deadlineCompliant)
        assertThrows<IllegalArgumentException> {
            service.requireAllowed("LAW-601", "BACHELOR", true, LocalDate.of(year, 4, 1))
        }
        assertDoesNotThrow {
            service.requireAllowed("IT-606", "BACHELOR", true, LocalDate.of(year, 4, 1))
        }
        assertThrows<IllegalArgumentException> {
            service.requireAllowed("IT-606", "BACHELOR", true, LocalDate.of(year + 1, 4, 1))
        }
    }

    @Test
    fun `late official publication remains recorded but is marked deadline noncompliant`() {
        val author = user("restriction-late-author")
        val publisher = user("restriction-late-publisher")
        val year = LocalDate.now().year - 1
        val created = service.create(request(
            year = year,
            version = "LATE-$year-${System.nanoTime()}",
            publicationDate = LocalDate.of(year, 5, 1),
        ), requireNotNull(author.id))
        val published = service.publish(
            created.id,
            PublishDistanceProgramRestrictionCatalogRequest("Kech e'lon qilingan haqiqiy hujjat holati qayd etildi"),
            requireNotNull(publisher.id),
        )
        assertFalse(published.deadlineCompliant)
    }

    @Test
    @WithMockUser(username = "restriction-monitor", authorities = ["STAT_READ"])
    fun `monitoring may read but cannot mutate restriction catalogs`() {
        userRepository.save(User(username = "restriction-monitor", password = "test"))
        mockMvc.get("/api/v1/distance-program-restrictions").andExpect { status { isOk() } }
        mockMvc.post("/api/v1/distance-program-restrictions") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"catalogYear":${LocalDate.now().year},"versionCode":"RBAC","authorityName":"Vakolatli vazirlik","documentNumber":"DOC-1","documentDate":"${LocalDate.now()}","publicationDate":"${LocalDate.now()}","documentReference":"OFFICIAL/REFERENCE","scopeNote":"Monitoring yozuv kirita olmasligini tekshirish","entries":[]}"""
        }.andExpect { status { isForbidden() } }
    }

    private fun request(
        year: Int,
        version: String,
        publicationDate: LocalDate,
        entries: List<DistanceProgramRestrictionEntryRequest> = emptyList(),
    ) = SaveDistanceProgramRestrictionCatalogRequest(
        catalogYear = year,
        versionCode = version,
        authorityName = "Oliy ta'lim, fan va innovatsiyalar vazirligi",
        documentNumber = "LIST-$year",
        documentDate = publicationDate.minusDays(1),
        publicationDate = publicationDate,
        documentReference = "OFFICIAL-REGISTER/$year/$version",
        scopeNote = "Rasmiy hujjatda masofaviy shakl mumkin bo'lmagan yo'nalishlar qamrovi",
        entries = entries,
    )

    private fun user(prefix: String) = userRepository.save(User(
        username = "$prefix-${System.nanoTime()}", password = "test", fullName = "Yuridik bo'lim xodimi",
    ))
}
