package uz.scorm.lms.app.v1.survey

import jakarta.transaction.Transactional
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.http.MediaType
import org.springframework.security.test.context.support.WithMockUser
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.post
import uz.scorm.lms.app.v1.audit.repository.AuditLogRepository
import uz.scorm.lms.app.v1.user.model.User
import uz.scorm.lms.app.v1.user.repository.UserRepository
import java.time.Instant

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class SurveyAnonymousAuditIntegrationTest {
    @Autowired private lateinit var mockMvc: MockMvc
    @Autowired private lateinit var service: SurveyService
    @Autowired private lateinit var userRepository: UserRepository
    @Autowired private lateinit var auditRepository: AuditLogRepository

    @Test
    @WithMockUser(username = "survey-anon-student", roles = ["STUDENT"])
    fun `survey submit request auditi username ip va user agentni saqlamaydi`() {
        val user = userRepository.save(User(username = "survey-anon-student", password = "test"))
        val survey = service.create(CreateSurveyRequest(
            title = "Anonim audit testi",
            audience = SurveyAudience.STUDENT,
            startsAt = Instant.now().minusSeconds(60),
            endsAt = Instant.now().plusSeconds(3600),
            questions = listOf(CreateSurveyQuestionRequest("Baho", SurveyQuestionType.RATING)),
        ), user.id!!)
        service.publish(survey.id, user.id!!)
        val path = "/api/v1/surveys/${survey.id}/responses"

        mockMvc.post(path) {
            contentType = MediaType.APPLICATION_JSON
            header("X-Forwarded-For", "198.51.100.17")
            header("User-Agent", "Identifying test agent")
            content = """{"answers":[{"questionId":${survey.questions.single().id},"ratingValue":5}]}"""
        }.andExpect { status { isOk() } }

        val logs = auditRepository.findTop200ByOrderByTimestampDesc().filter { it.path == path }
        assertEquals(1, logs.size)
        assertEquals("ANONYMOUS_SURVEY_RESPONSE", logs.single().action)
        assertNull(logs.single().username)
        assertNull(logs.single().ip)
        assertNull(logs.single().userAgent)
    }
}
