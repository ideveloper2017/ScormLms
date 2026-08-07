package uz.scorm.lms.app.v1.contentstandard

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
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
import uz.scorm.lms.app.v1.contentstandard.dto.ReviewContentStandardAssessmentRequest
import uz.scorm.lms.app.v1.contentstandard.dto.ReviewContentStandardRequest
import uz.scorm.lms.app.v1.contentstandard.dto.SaveContentStandardAssessmentRequest
import uz.scorm.lms.app.v1.contentstandard.dto.SaveContentStandardAssessmentResponseRequest
import uz.scorm.lms.app.v1.contentstandard.dto.SaveContentStandardChecklistRequest
import uz.scorm.lms.app.v1.contentstandard.dto.SaveContentStandardCriterionRequest
import uz.scorm.lms.app.v1.contentstandard.model.ContentStandardAssessmentDecision
import uz.scorm.lms.app.v1.contentstandard.model.ContentStandardAssessmentStatus
import uz.scorm.lms.app.v1.contentstandard.model.ContentStandardChecklistStatus
import uz.scorm.lms.app.v1.contentstandard.service.ContentStandardService
import uz.scorm.lms.app.v1.courses.model.ContentReviewStatus
import uz.scorm.lms.app.v1.courses.model.Course
import uz.scorm.lms.app.v1.courses.model.CourseContent
import uz.scorm.lms.app.v1.courses.model.CourseContentRevision
import uz.scorm.lms.app.v1.courses.model.CourseContentType
import uz.scorm.lms.app.v1.courses.model.CourseModule
import uz.scorm.lms.app.v1.courses.model.LearningItemStatus
import uz.scorm.lms.app.v1.courses.repository.CourseContentRepository
import uz.scorm.lms.app.v1.courses.repository.CourseContentRevisionRepository
import uz.scorm.lms.app.v1.courses.repository.CourseModuleRepository
import uz.scorm.lms.app.v1.courses.repository.CourseRepository
import uz.scorm.lms.app.v1.user.model.User
import uz.scorm.lms.app.v1.user.repository.UserRepository
import java.time.Instant
import java.time.LocalDate

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class ContentStandardWorkflowIntegrationTest {
    @Autowired private lateinit var service: ContentStandardService
    @Autowired private lateinit var userRepository: UserRepository
    @Autowired private lateinit var courseRepository: CourseRepository
    @Autowired private lateinit var moduleRepository: CourseModuleRepository
    @Autowired private lateinit var contentRepository: CourseContentRepository
    @Autowired private lateinit var revisionRepository: CourseContentRevisionRepository
    @Autowired private lateinit var mockMvc: MockMvc

    @Test
    fun `official checklist is independently published and exact revisions require passed evidence assessment`() {
        val author = user("standard-author")
        val reviewer = user("standard-reviewer")
        assertThrows<IllegalArgumentException> {
            service.createChecklist(validChecklist().copy(standardCode = "Invented standard"), requireNotNull(author.id))
        }
        val draft = service.createChecklist(validChecklist(), requireNotNull(author.id))
        assertEquals(ContentStandardChecklistStatus.DRAFT, draft.status)
        assertThrows<IllegalArgumentException> {
            service.publishChecklist(draft.id, ReviewContentStandardRequest("Muallif o'zi tasdiqlashga urindi"), requireNotNull(author.id))
        }
        val checklist = service.publishChecklist(
            draft.id, ReviewContentStandardRequest("Rasmiy manba va mezonlar mustaqil tekshirildi"), requireNotNull(reviewer.id),
        )
        assertEquals(ContentStandardChecklistStatus.PUBLISHED, checklist.status)
        assertTrue(checklist.currentlyEffective)

        val content = content(author)
        val firstRevision = revision(content, 1)
        assertThrows<IllegalArgumentException> { service.requirePassingAssessmentIfConfigured(requireNotNull(firstRevision.id)) }

        val failedDraft = service.createAssessment(
            SaveContentStandardAssessmentRequest(
                requireNotNull(firstRevision.id), checklist.id,
                checklist.criteria.map { criterion ->
                    SaveContentStandardAssessmentResponseRequest(
                        criterionId = criterion.id, met = !criterion.required,
                        evidenceReference = if (!criterion.required) "evidence://optional/1" else null,
                        note = if (criterion.required) "Majburiy mezon bajarilmagan" else null,
                    )
                },
            ), requireNotNull(author.id),
        )
        assertThrows<IllegalArgumentException> {
            service.reviewAssessment(failedDraft.id, ReviewContentStandardAssessmentRequest(ContentStandardAssessmentDecision.PASSED, "Bajarilmagan mezon bilan o'tkazish"), requireNotNull(reviewer.id))
        }
        val failed = service.reviewAssessment(
            failedDraft.id, ReviewContentStandardAssessmentRequest(ContentStandardAssessmentDecision.FAILED, "Majburiy mezon dalili mavjud emas"), requireNotNull(reviewer.id),
        )
        assertEquals(ContentStandardAssessmentStatus.FAILED, failed.status)

        val secondRevision = revision(content, 2)
        val passingDraft = service.createAssessment(
            SaveContentStandardAssessmentRequest(
                requireNotNull(secondRevision.id), checklist.id,
                checklist.criteria.map { criterion ->
                    SaveContentStandardAssessmentResponseRequest(criterion.id, true, "evidence://criterion/${criterion.criterionCode}", "Tekshirildi")
                },
            ), requireNotNull(author.id),
        )
        assertThrows<IllegalArgumentException> {
            service.reviewAssessment(passingDraft.id, ReviewContentStandardAssessmentRequest(ContentStandardAssessmentDecision.PASSED, "Muallif o'zi baholadi"), requireNotNull(author.id))
        }
        val passed = service.reviewAssessment(
            passingDraft.id, ReviewContentStandardAssessmentRequest(ContentStandardAssessmentDecision.PASSED, "Barcha rasmiy mezon va dalillar tekshirildi"), requireNotNull(reviewer.id),
        )
        assertEquals(ContentStandardAssessmentStatus.PASSED, passed.status)
        service.requirePassingAssessmentIfConfigured(requireNotNull(secondRevision.id))

        content.status = LearningItemStatus.PUBLISHED.name
        content.reviewStatus = ContentReviewStatus.APPROVED.name
        content.approvedRevisionNumber = secondRevision.revisionNumber
        contentRepository.save(content)
        val coverage = service.coverage()
        assertTrue(coverage.complete)
        assertEquals(1, coverage.publishedContents)
        assertEquals(1, coverage.passedContents)

        service.archiveChecklist(checklist.id, requireNotNull(reviewer.id))
        assertFalse(service.coverage().checklistEffective)
    }

    @Test
    @WithMockUser(username = "standard-monitor", authorities = ["AUDIT_READ"])
    fun `monitoring reads checklist and assessments but cannot mutate`() {
        userRepository.save(User(username = "standard-monitor", password = "test"))
        mockMvc.get("/api/v1/content-standard/checklists").andExpect { status { isOk() } }
        mockMvc.get("/api/v1/content-standard/assessments").andExpect { status { isOk() } }
        mockMvc.post("/api/v1/content-standard/checklists") {
            contentType = MediaType.APPLICATION_JSON
            content = validChecklistJson()
        }.andExpect { status { isForbidden() } }
    }

    private fun validChecklist() = SaveContentStandardChecklistRequest(
        standardCode = "O'zDSt 36.2030", versionCode = "OFFICIAL-${System.nanoTime()}",
        title = "O'zDSt 36.2030 rasmiy mezonlar checklisti", issuingAuthority = "Vakolatli standartlashtirish organi",
        sourceDocumentNumber = "STD-36.2030", sourceDocumentDate = LocalDate.now(),
        sourceReference = "evidence://official-standard/36.2030", validFrom = LocalDate.now(),
        criteria = listOf(
            SaveContentStandardCriterionRequest("OFFICIAL-1", "Rasmiy majburiy mezon", "Rasmiy standartdan aynan ko'chiriladigan majburiy mezon tavsifi", true, "Tasdiqlovchi dalil", 1),
            SaveContentStandardCriterionRequest("OFFICIAL-2", "Rasmiy qo'shimcha mezon", "Rasmiy standartdan aynan ko'chiriladigan qo'shimcha mezon tavsifi", false, null, 2),
        ),
    )

    private fun content(owner: User): CourseContent {
        val course = courseRepository.save(Course(title = "Standard test kursi", slug = "standard-${System.nanoTime()}", userId = owner.id, status = "DRAFT", language = "uz"))
        val module = moduleRepository.save(CourseModule(course, "Standard test moduli"))
        return contentRepository.save(CourseContent(
            module = module, title = "Standard test kontenti", description = "Test tavsifi",
            contentType = CourseContentType.DOCUMENT, contentUrl = "https://example.edu.uz/content.pdf", durationMinutes = 10,
            languageCode = "uz", authorName = "Test muallif", contentVersion = "1.0",
            sourceName = "Rasmiy test manbasi", sourceUrl = "https://example.edu.uz/source",
            validFrom = LocalDate.now(), metadataUpdatedAt = Instant.now(),
        ))
    }

    private fun revision(content: CourseContent, number: Int) = revisionRepository.save(CourseContentRevision(
        content = content, revisionNumber = number, title = "Revision $number", description = "Revision tavsifi",
        contentType = CourseContentType.DOCUMENT, contentUrl = "https://example.edu.uz/content-$number.pdf", durationMinutes = 10,
        languageCode = "uz", authorName = "Test muallif", contentVersion = "$number.0",
        sourceName = "Rasmiy test manbasi", sourceUrl = "https://example.edu.uz/source-$number",
        validFrom = LocalDate.now(), validUntil = null, changedAt = Instant.now(), changedBy = requireNotNull(content.module.course.userId),
    ))

    private fun validChecklistJson() = """{
      "standardCode":"O'zDSt 36.2030","versionCode":"HTTP-${System.nanoTime()}",
      "title":"Rasmiy standart checklisti","issuingAuthority":"Vakolatli organ",
      "sourceDocumentNumber":"STD-1","sourceDocumentDate":"${LocalDate.now()}",
      "sourceReference":"evidence://standard/1","validFrom":"${LocalDate.now()}",
      "criteria":[{"criterionCode":"C-1","title":"Rasmiy mezon nomi","description":"Rasmiy mezonning to'liq tavsifi","required":true,"position":1}]
    }"""

    private fun user(prefix: String) = userRepository.save(User(username = "$prefix-${System.nanoTime()}", password = "test", fullName = prefix))
}

