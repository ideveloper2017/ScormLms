package uz.scorm.lms.app.v1.syllabus

import io.mockk.every
import io.mockk.mockk
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import uz.scorm.lms.app.v1.subject.model.Subject
import uz.scorm.lms.app.v1.subject.service.SubjectService
import uz.scorm.lms.app.v1.syllabus.dto.SubjectSyllabusRequest
import uz.scorm.lms.app.v1.syllabus.model.SubjectSyllabus
import uz.scorm.lms.app.v1.syllabus.model.SyllabusLanguage
import uz.scorm.lms.app.v1.syllabus.repository.SubjectSyllabusRepository
import uz.scorm.lms.app.v1.syllabus.service.SubjectSyllabusService

class SubjectSyllabusServiceTest {
    private val repository = mockk<SubjectSyllabusRepository>()
    private val subjects = mockk<SubjectService>()
    private val service = SubjectSyllabusService(repository, subjects)

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
}
