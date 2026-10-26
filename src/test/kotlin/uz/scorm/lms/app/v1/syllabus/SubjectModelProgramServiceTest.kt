package uz.scorm.lms.app.v1.syllabus

import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import uz.scorm.lms.app.v1.subject.model.Subject
import uz.scorm.lms.app.v1.subject.service.SubjectService
import uz.scorm.lms.app.v1.syllabus.dto.SubjectModelProgramRequest
import uz.scorm.lms.app.v1.syllabus.model.SubjectModelProgram
import uz.scorm.lms.app.v1.syllabus.model.SubjectSyllabus
import uz.scorm.lms.app.v1.syllabus.model.SyllabusLanguage
import uz.scorm.lms.app.v1.syllabus.repository.SubjectModelProgramRepository
import uz.scorm.lms.app.v1.syllabus.repository.SubjectSyllabusRepository
import uz.scorm.lms.app.v1.syllabus.service.SubjectModelProgramService

class SubjectModelProgramServiceTest {
    private val programs = mockk<SubjectModelProgramRepository>(relaxed = true)
    private val syllabi = mockk<SubjectSyllabusRepository>(relaxed = true)
    private val subjects = mockk<SubjectService>()
    private val service = SubjectModelProgramService(programs, syllabi, subjects)
    private val subject = Subject(name = "Matematika", code = "MA01", credits = 4).apply { id = 5 }

    init {
        every { subjects.getEntity(5) } returns subject
        every { programs.save(any<SubjectModelProgram>()) } answers { firstArg<SubjectModelProgram>().apply { id = id ?: 3 } }
    }

    @Test
    fun `o'quv dasturi fan nomi bilan yaratiladi, bir fan va til uchun bitta`() {
        every { programs.existsBySubjectIdAndLanguageAndDeletedFalse(5, SyllabusLanguage.UZ) } returns false

        val result = service.create(SubjectModelProgramRequest(5, SyllabusLanguage.UZ, " Qisqa ", null, " To'liq "))

        assertEquals("Matematika", result.name)
        assertEquals("Qisqa", result.shortDescription)
        assertEquals(4, result.subjectCredits)
        assertEquals(0, result.workProgramCount)

        every { programs.existsBySubjectIdAndLanguageAndDeletedFalse(5, SyllabusLanguage.UZ) } returns true
        assertThrows<IllegalArgumentException> { service.create(SubjectModelProgramRequest(5, SyllabusLanguage.UZ, "Qisqa", null, "To'liq")) }
    }

    @Test
    fun `fan dasturlari bor o'quv dasturi o'chirilmaydi va fani o'zgartirilmaydi`() {
        val model = SubjectModelProgram(subject, SyllabusLanguage.UZ, "Matematika", "Qisqa", null, "To'liq").apply { id = 3 }
        every { programs.findByIdAndDeletedFalse(3) } returns model
        every { syllabi.countByModelProgramIdAndDeletedFalse(3) } returns 2

        assertThrows<IllegalArgumentException> { service.delete(3) }
        assertThrows<IllegalArgumentException> {
            service.update(3, SubjectModelProgramRequest(5, SyllabusLanguage.RU, "Qisqa", null, "To'liq"))
        }
        verify(exactly = 0) { programs.delete(any()) }
    }

    @Test
    fun `ro'yxatda har bir o'quv dasturining fan dasturlari soni ko'rsatiladi`() {
        val model = SubjectModelProgram(subject, SyllabusLanguage.UZ, "Matematika", "Qisqa", null, "To'liq").apply { id = 3 }
        every { programs.findAllByDeletedFalseOrderByNameAsc() } returns listOf(model)
        every { syllabi.findAllByDeletedFalseOrderByNameAsc() } returns listOf(
            SubjectSyllabus(subject, "a", SyllabusLanguage.UZ, "q", null, "t").apply { modelProgram = model },
            SubjectSyllabus(subject, "b", SyllabusLanguage.UZ, "q", null, "t").apply { modelProgram = model },
            SubjectSyllabus(subject, "c", SyllabusLanguage.UZ, "q", null, "t"),
        )

        assertEquals(listOf(2), service.list().map { it.workProgramCount })
    }
}
