package uz.scorm.lms.app.v1.syllabus

import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.ActiveProfiles
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.syllabus.service.SubjectSyllabusService
import uz.scorm.lms.app.v1.syllabus.dto.SubjectSyllabusRequest
import uz.scorm.lms.app.v1.syllabus.model.SyllabusLanguage
import uz.scorm.lms.app.v1.subject.model.Subject
import uz.scorm.lms.app.v1.subject.repository.SubjectRepository
import uz.scorm.lms.app.v1.user.model.User
import uz.scorm.lms.app.v1.user.repository.UserRepository

@SpringBootTest(properties = ["app.demo.enabled=false"])
@ActiveProfiles("test")
@Transactional
class SyllabusWorkflowIntegrationTest {
    @Autowired private lateinit var service: SubjectSyllabusService
    @Autowired private lateinit var subjects: SubjectRepository
    @Autowired private lateinit var users: UserRepository

    @Test fun `approved syllabus is immutable and next revision preserves original content`() {
        val subject = subjects.save(Subject(name = "Sillabus test fani", code = "SYL-REV-1"))
        val actor = users.save(User(username = "syllabus-reviewer", password = "test", fullName = "Metodist"))
        val input = SubjectSyllabusRequest(subject.id!!, "Fan dasturi", SyllabusLanguage.UZ, "Dastur mazmuni", "Birinchi talab", "Birinchi to‘liq mazmun")
        val created = service.create(input)
        assertEquals("DRAFT", created.status)
        assertThrows<IllegalArgumentException> { service.transition(created.id, "APPROVE", actor) }
        assertEquals("IN_REVIEW", service.transition(created.id, "SUBMIT", actor).status)
        assertThrows<IllegalArgumentException> { service.update(created.id, input.copy(fullDescription = "Erta tahrir")) }
        service.transition(created.id, "RETURN", actor)
        service.transition(created.id, "SUBMIT", actor)
        assertEquals("APPROVED", service.transition(created.id, "APPROVE", actor).status)
        assertThrows<IllegalArgumentException> { service.update(created.id, input) }
        assertThrows<IllegalArgumentException> { service.delete(created.id) }
        assertEquals(2, service.transition(created.id, "NEW_VERSION", actor).revisionNumber)
        service.update(created.id, input.copy(fullDescription = "Ikkinchi to‘liq mazmun"))
        val first = service.history(created.id).single()
        assertEquals("Birinchi to‘liq mazmun", first.content.fullDescription)
        assertEquals("Metodist", first.approvedByName)
        service.transition(created.id, "SUBMIT", actor)
        service.transition(created.id, "APPROVE", actor)
        assertEquals(listOf(2, 1), service.history(created.id).map { it.revisionNumber })
        assertEquals("Ikkinchi to‘liq mazmun", service.history(created.id).first().content.fullDescription)
    }
}
