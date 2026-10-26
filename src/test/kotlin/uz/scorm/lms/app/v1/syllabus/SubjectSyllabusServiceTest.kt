package uz.scorm.lms.app.v1.syllabus

import io.mockk.every
import io.mockk.mockk
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import uz.scorm.lms.app.v1.subject.model.Subject
import uz.scorm.lms.app.v1.subject.service.SubjectService
import uz.scorm.lms.app.v1.syllabus.dto.SubjectSyllabusRequest
import uz.scorm.lms.app.v1.syllabus.dto.SyllabusTopicRequest
import uz.scorm.lms.app.v1.syllabus.model.SubjectSyllabus
import uz.scorm.lms.app.v1.syllabus.model.SyllabusLanguage
import uz.scorm.lms.app.v1.syllabus.model.SyllabusTopicType.PRACTICAL
import uz.scorm.lms.app.v1.syllabus.model.SyllabusTopicType.THEORETICAL
import uz.scorm.lms.app.v1.syllabus.repository.SubjectSyllabusRepository
import uz.scorm.lms.app.v1.syllabus.service.SubjectSyllabusService

class SubjectSyllabusServiceTest {
    private val repository = mockk<SubjectSyllabusRepository>()
    private val subjects = mockk<SubjectService>()
    private val service = SubjectSyllabusService(repository, subjects, mockk(), mockk(), mockk())

    @Test
    fun `oquv dasturi fan va til boyicha yaratiladi`() {
        val subject = Subject(name = "Algoritmlar", code = "ALG101").apply { id = 8 }
        every { repository.existsBySubjectIdAndLanguageAndNameIgnoreCaseAndDeletedFalse(8, SyllabusLanguage.UZ, "Fan dasturi") } returns false
        every { subjects.getEntity(8) } returns subject
        every { repository.save(any()) } answers { firstArg<SubjectSyllabus>().apply { id = 21 } }

        val result = service.create(SubjectSyllabusRequest(8, "  Fan dasturi ", SyllabusLanguage.UZ, " Qisqa mazmun ", null, " To'liq mazmun "))

        assertEquals(21, result.id)
        assertEquals("Algoritmlar", result.subjectName)
        assertEquals("Fan dasturi", result.name)
        assertEquals("Qisqa mazmun", result.shortDescription)
    }

    @Test
    fun `bir fan til va nom uchun takroriy dastur rad etiladi`() {
        every { repository.existsBySubjectIdAndLanguageAndNameIgnoreCaseAndDeletedFalse(8, SyllabusLanguage.UZ, "Fan dasturi") } returns true

        assertThrows<IllegalArgumentException> {
            service.create(SubjectSyllabusRequest(8, "Fan dasturi", SyllabusLanguage.UZ, "Qisqa", null, "To'liq"))
        }
    }

    @Test
    fun `mavzular nazariy va amaliyga bolinib tartiblanadi va soatlari hisoblanadi`() {
        val subject = Subject(name = "Algoritmlar", code = "ALG101").apply { id = 8 }
        every { repository.existsBySubjectIdAndLanguageAndNameIgnoreCaseAndDeletedFalse(8, SyllabusLanguage.UZ, "Fan dasturi") } returns false
        every { subjects.getEntity(8) } returns subject
        every { repository.save(any()) } answers { firstArg<SubjectSyllabus>().apply { id = 22 } }

        val result = service.create(SubjectSyllabusRequest(8, "Fan dasturi", SyllabusLanguage.UZ, "Qisqa", null, "To'liq", topics = listOf(
            SyllabusTopicRequest(PRACTICAL, " Saralash algoritmlari ", hours = 4),
            SyllabusTopicRequest(THEORETICAL, "Kirish", hours = 2),
            SyllabusTopicRequest(PRACTICAL, "Graflar", "BFS va DFS", 6),
            SyllabusTopicRequest(THEORETICAL, "Murakkablik", hours = 2),
        )))

        assertEquals(listOf("Kirish", "Murakkablik", "Saralash algoritmlari", "Graflar"), result.topics.map { it.title })
        assertEquals(listOf(1, 2, 1, 2), result.topics.map { it.sortOrder })
        assertEquals(4, result.theoreticalHours)
        assertEquals(10, result.practicalHours)
    }

    @Test
    fun `mavzular dastur yaratilgandan keyin alohida saqlanadi va faqat qoralamada`() {
        val subject = Subject(name = "Algoritmlar", code = "ALG101").apply { id = 8 }
        val syllabus = SubjectSyllabus(subject, "Fan dasturi", SyllabusLanguage.UZ, "Qisqa", null, "To'liq").apply { id = 40 }
        every { repository.lockById(40) } returns syllabus
        every { repository.saveAndFlush(any<SubjectSyllabus>()) } answers { firstArg() }

        val result = service.updateTopics(40, listOf(
            SyllabusTopicRequest(PRACTICAL, "Laboratoriya", hours = 4),
            SyllabusTopicRequest(THEORETICAL, "Kirish", hours = 2),
        ))

        assertEquals(listOf("Kirish", "Laboratoriya"), result.topics.map { it.title })
        assertEquals(2, result.theoreticalHours)
        assertEquals(4, result.practicalHours)

        // id berilgan mavzu joyida yangilanadi (kurs bo'limi bog'lanishi saqlanadi), berilmagani o'chiriladi
        val kirish = syllabus.topics.first { it.title == "Kirish" }.apply { id = 501 }
        syllabus.topics.first { it.title == "Laboratoriya" }.id = 502
        val renamed = service.updateTopics(40, listOf(SyllabusTopicRequest(THEORETICAL, "Kirish va maqsad", hours = 3, id = 501)))
        assertEquals(listOf("Kirish va maqsad"), renamed.topics.map { it.title })
        assertEquals(1, syllabus.topics.size)
        assert(syllabus.topics.single() === kirish)
        assertThrows<IllegalArgumentException> {
            service.updateTopics(40, listOf(SyllabusTopicRequest(THEORETICAL, "Begona", hours = 2, id = 999)))
        }

        syllabus.status = "APPROVED"
        assertThrows<IllegalArgumentException> { service.updateTopics(40, emptyList()) }
    }

    @Test
    fun `soati notogri mavzu rad etiladi`() {
        val subject = Subject(name = "Algoritmlar", code = "ALG101").apply { id = 8 }
        every { repository.existsBySubjectIdAndLanguageAndNameIgnoreCaseAndDeletedFalse(8, SyllabusLanguage.UZ, "Fan dasturi") } returns false
        every { subjects.getEntity(8) } returns subject

        assertThrows<IllegalArgumentException> {
            service.create(SubjectSyllabusRequest(8, "Fan dasturi", SyllabusLanguage.UZ, "Qisqa", null, "To'liq",
                topics = listOf(SyllabusTopicRequest(THEORETICAL, "Kirish", hours = 0))))
        }
    }
}
