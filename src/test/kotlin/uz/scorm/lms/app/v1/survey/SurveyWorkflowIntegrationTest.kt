package uz.scorm.lms.app.v1.survey

import jakarta.transaction.Transactional
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.test.context.ActiveProfiles
import uz.scorm.lms.app.v1.user.model.User
import uz.scorm.lms.app.v1.user.repository.UserRepository
import java.math.BigDecimal
import java.time.Instant

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class SurveyWorkflowIntegrationTest {
    @Autowired private lateinit var service: SurveyService
    @Autowired private lateinit var userRepository: UserRepository
    @Autowired private lateinit var jdbcTemplate: JdbcTemplate

    @Test
    fun `javob shaxssiz saqlanadi duplicate bloklanadi va faqat agregat natija ochiladi`() {
        val actor = user("survey-admin")
        val survey = service.create(CreateSurveyRequest(
            title = "Masofaviy ta'lim sifati",
            audience = SurveyAudience.BOTH,
            startsAt = Instant.now().minusSeconds(60),
            endsAt = Instant.now().plusSeconds(86_400),
            minAggregateSize = 5,
            questions = listOf(
                CreateSurveyQuestionRequest("Platformani baholang", SurveyQuestionType.RATING),
                CreateSurveyQuestionRequest("Qaysi format qulay?", SurveyQuestionType.SINGLE_CHOICE, listOf("Jonli", "Yozib olingan")),
            ),
        ), actor.id!!)
        service.publish(survey.id, actor.id!!)

        val respondents = (1..5).map { user("survey-student-$it") }
        respondents.forEachIndexed { index, user ->
            val submitted = service.submit(survey.id, SubmitSurveyResponseRequest(listOf(
                SubmitSurveyAnswerRequest(survey.questions[0].id, ratingValue = index + 1),
                SubmitSurveyAnswerRequest(survey.questions[1].id, optionValue = if (index < 3) "Jonli" else "Yozib olingan"),
            )), user.id!!, SurveyRespondentRole.STUDENT)
            assertNotNull(submitted.submittedAt)
        }
        assertThrows(IllegalArgumentException::class.java) {
            service.submit(survey.id, SubmitSurveyResponseRequest(listOf(
                SubmitSurveyAnswerRequest(survey.questions[0].id, ratingValue = 5),
                SubmitSurveyAnswerRequest(survey.questions[1].id, optionValue = "Jonli"),
            )), respondents.first().id!!, SurveyRespondentRole.STUDENT)
        }
        assertThrows(IllegalArgumentException::class.java) { service.results(survey.id) }

        service.close(survey.id, actor.id!!)
        val results = service.results(survey.id)
        assertFalse(results.suppressed)
        assertEquals(5, results.responseCount)
        assertEquals(0, BigDecimal("3.00").compareTo(results.questions[0].averageRating))
        assertEquals(3, results.questions[1].options.first { it.option == "Jonli" }.count)

        val responseColumns = jdbcTemplate.queryForList(
            "SELECT column_name FROM information_schema.columns WHERE table_name = 'survey_responses'",
            String::class.java,
        ).map { it.lowercase() }
        assertFalse(responseColumns.contains("user_id"))
        assertFalse(responseColumns.contains("created_by"))
        assertFalse(responseColumns.contains("respondent_role"))
        assertTrue(responseColumns.contains("respondent_hash"))
    }

    @Test
    fun `kichik guruh natijasi bostiriladi va auditoriya tekshiriladi`() {
        val actor = user("survey-admin-small")
        val student = user("survey-student-small")
        val survey = service.create(CreateSurveyRequest(
            title = "Pedagog so'rovi",
            audience = SurveyAudience.TEACHER,
            startsAt = Instant.now().minusSeconds(60),
            endsAt = Instant.now().plusSeconds(3600),
            questions = listOf(CreateSurveyQuestionRequest("Jarayonni baholang", SurveyQuestionType.RATING)),
        ), actor.id!!)
        service.publish(survey.id, actor.id!!)
        assertThrows(IllegalArgumentException::class.java) {
            service.submit(survey.id, SubmitSurveyResponseRequest(listOf(SubmitSurveyAnswerRequest(survey.questions[0].id, ratingValue = 4))), student.id!!, SurveyRespondentRole.STUDENT)
        }
        service.submit(survey.id, SubmitSurveyResponseRequest(listOf(SubmitSurveyAnswerRequest(survey.questions[0].id, ratingValue = 4))), student.id!!, SurveyRespondentRole.TEACHER)
        service.close(survey.id, actor.id!!)
        val results = service.results(survey.id)
        assertTrue(results.suppressed)
        assertEquals(1, results.responseCount)
        assertTrue(results.questions.isEmpty())
    }

    private fun user(username: String) = userRepository.save(User(username = username, password = "test", fullName = username))
}
