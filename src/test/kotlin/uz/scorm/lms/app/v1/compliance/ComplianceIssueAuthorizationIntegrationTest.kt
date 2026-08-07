package uz.scorm.lms.app.v1.compliance

import jakarta.transaction.Transactional
import org.junit.jupiter.api.Test
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
class ComplianceIssueAuthorizationIntegrationTest {
    @Autowired private lateinit var mockMvc: MockMvc
    @Autowired private lateinit var userRepository: UserRepository
    @Autowired private lateinit var complianceService: Decision559ComplianceService

    @Test
    @WithMockUser(username = "compliance-monitor", authorities = ["STAT_READ"])
    fun `monitoring roli vazifalarni oqiydi ammo yarata olmaydi`() {
        userRepository.save(User(username = "compliance-monitor", password = "test"))
        mockMvc.get("/api/v1/compliance/559/issues").andExpect { status { isOk() } }
        mockMvc.post("/api/v1/compliance/559/issues") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"violationCode":"NO_DISTANCE_PROGRAM","ownerId":1,"dueDate":"${LocalDate.now().plusDays(2)}","remediationPlan":"Reja"}"""
        }.andExpect { status { isForbidden() } }
    }

    @Test
    @WithMockUser(username = "compliance-writer", authorities = ["ACADEMIC_READ", "ACADEMIC_WRITE"])
    fun `akademik yozish vakolati vazifa yaratadi`() {
        userRepository.save(User(username = "compliance-writer", password = "test"))
        val owner = userRepository.save(User(username = "compliance-owner-api", password = "test", fullName = "API Owner"))
        val violationCode = complianceService.summary().violations.first { it.code != "NO_DISTANCE_PROGRAM" }.code
        mockMvc.post("/api/v1/compliance/559/issues") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"violationCode":"$violationCode","ownerId":${owner.id},"dueDate":"${LocalDate.now().plusDays(2)}","remediationPlan":"Nomuvofiqlikni bartaraf etish"}"""
        }.andExpect {
            status { isOk() }
            jsonPath("$.data.ownerId") { value(owner.id) }
            jsonPath("$.data.status") { value("OPEN") }
        }
    }
}
