package uz.scorm.lms.app.v1.syllabus

import io.mockk.every
import io.mockk.mockk
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import uz.scorm.lms.app.v1.subject.model.Subject
import uz.scorm.lms.app.v1.subject.service.SubjectService
import uz.scorm.lms.app.v1.syllabus.dto.SubjectSyllabusRequest
import uz.scorm.lms.app.v1.syllabus.dto.SyllabusModuleRequest
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
    private val service = SubjectSyllabusService(repository, subjects, mockk(), mockk(), mockk(), mockk(relaxed = true), mockk(relaxed = true))

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
        every { subjects.getEntity(8) } returns Subject(name = "Algoritmlar", code = "ALG101").apply { id = 8 }
        every { repository.existsBySubjectIdAndLanguageAndNameIgnoreCaseAndDeletedFalse(8, SyllabusLanguage.UZ, "Fan dasturi") } returns true

        assertThrows<IllegalArgumentException> {
            service.create(SubjectSyllabusRequest(8, "Fan dasturi", SyllabusLanguage.UZ, "Qisqa", null, "To'liq"))
        }
    }

    @Test
    fun `nom berilmasa dastur fan nomini oladi`() {
        every { subjects.getEntity(8) } returns Subject(name = "Algoritmlar", code = "ALG101").apply { id = 8 }
        every { repository.existsBySubjectIdAndLanguageAndNameIgnoreCaseAndDeletedFalse(8, SyllabusLanguage.UZ, "Algoritmlar") } returns false
        every { repository.save(any()) } answers { firstArg<SubjectSyllabus>().apply { id = 23 } }

        val result = service.create(SubjectSyllabusRequest(8, language = SyllabusLanguage.UZ, shortDescription = "Qisqa", fullDescription = "To'liq"))

        assertEquals("Algoritmlar", result.name)
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
    fun `dastur modullar va darslardan tuziladi dars turi saqlanadi va id bilan joyida yangilanadi`() {
        val subject = Subject(name = "Fizika", code = "FIZ").apply { id = 8 }
        val syllabus = SubjectSyllabus(subject, "Fizika", SyllabusLanguage.UZ, "Qisqa", null, "To'liq").apply { id = 42 }
        var nextId = 900L
        every { repository.lockById(42) } returns syllabus
        // saveAndFlush yangi modul va darslarga id beradi (IDENTITY kabi)
        every { repository.saveAndFlush(any<SubjectSyllabus>()) } answers {
            firstArg<SubjectSyllabus>().apply {
                modules.filter { it.id == null }.forEach { it.id = nextId++ }
                topics.filter { it.id == null }.forEach { it.id = nextId++ }
            }
        }

        val result = service.updateModules(42, listOf(
            SyllabusModuleRequest(name = " Mexanika ", description = "Kinematika va dinamika", lessons = listOf(
                SyllabusTopicRequest(THEORETICAL, "Kinematika"),
                SyllabusTopicRequest(THEORETICAL, "Dinamika"),
                SyllabusTopicRequest(PRACTICAL, "Tezlik masalalari"),
            )),
            SyllabusModuleRequest(name = "Termodinamika", lessons = listOf(SyllabusTopicRequest(THEORETICAL, "Issiqlik"))),
        ))

        assertEquals(listOf("Mexanika", "Termodinamika"), result.modules.map { it.name })
        assertEquals(listOf("Kinematika", "Dinamika", "Tezlik masalalari"), result.modules[0].lessons.map { it.title })
        assertEquals(listOf(1, 2, 3), result.modules[0].lessons.map { it.lessonOrder })
        // Mashg'ulot turi ichidagi tartib modul tartibiga mos: kurs bo'limlari shunday tartiblanadi
        assertEquals(listOf(1, 2, 3), result.topics.filter { it.type == THEORETICAL }.map { it.sortOrder })
        assertEquals(listOf("Kinematika", "Dinamika", "Issiqlik"), result.topics.filter { it.type == THEORETICAL }.map { it.title })

        // Dars boshqa modulga ko'chadi, id saqlanadi; berilmagan modul va dars o'chadi
        val mechanicsId = result.modules[0].id
        val kinematicsId = requireNotNull(result.modules[0].lessons[0].id)
        val moved = service.updateModules(42, listOf(
            SyllabusModuleRequest(id = mechanicsId, name = "Mexanika", lessons = listOf(SyllabusTopicRequest(PRACTICAL, "Kinematika amaliyoti", id = kinematicsId))),
        ))
        assertEquals(1, moved.modules.size)
        assertEquals(kinematicsId, moved.modules.single().lessons.single().id)
        assertEquals(PRACTICAL, moved.modules.single().lessons.single().type)
        assertEquals(1, syllabus.topics.size)

        assertThrows<IllegalArgumentException> { service.updateModules(42, listOf(SyllabusModuleRequest(name = "Ab"))) }
        syllabus.status = "APPROVED"
        assertThrows<IllegalArgumentException> { service.updateModules(42, emptyList()) }
    }

    @Test
    fun `laboratoriya va seminar mavzulari ham tartiblanadi va soatlari alohida hisoblanadi`() {
        val subject = Subject(name = "Fizika", code = "FIZ").apply { id = 8 }
        val syllabus = SubjectSyllabus(subject, "Fizika", SyllabusLanguage.UZ, "Qisqa", null, "To'liq").apply { id = 41 }
        every { repository.lockById(41) } returns syllabus
        every { repository.saveAndFlush(any<SubjectSyllabus>()) } answers { firstArg() }

        val result = service.updateTopics(41, listOf(
            SyllabusTopicRequest(uz.scorm.lms.app.v1.syllabus.model.SyllabusTopicType.SEMINAR, "Munozara", hours = 2),
            SyllabusTopicRequest(uz.scorm.lms.app.v1.syllabus.model.SyllabusTopicType.LABORATORY, "Mayatnik", hours = 4),
            SyllabusTopicRequest(THEORETICAL, "Kinematika", hours = 2),
            SyllabusTopicRequest(PRACTICAL, "Masalalar", hours = 2),
        ))

        assertEquals(listOf("Kinematika", "Masalalar", "Mayatnik", "Munozara"), result.topics.map { it.title })
        assertEquals(listOf(2, 2, 4, 2), listOf(result.theoreticalHours, result.practicalHours, result.laboratoryHours, result.seminarHours))
    }

    @Test
    fun `fan dasturi o'quv dasturidan o'quv yili va semestr uchun yaratiladi`() {
        val subject = Subject(name = "Matematika", code = "MA01").apply { id = 5 }
        val model = uz.scorm.lms.app.v1.syllabus.model.SubjectModelProgram(subject, SyllabusLanguage.UZ, "Matematika",
            "Namunaviy qisqa", "Talab", "Namunaviy to'liq").apply { id = 3 }
        every { repository.existsByModelProgramIdAndAcademicYearAndSemesterAndDeletedFalse(3, "2026-2027", 1) } returns false
        every { repository.existsBySubjectIdAndLanguageAndNameIgnoreCaseAndDeletedFalse(5, SyllabusLanguage.UZ, "Matematika · 2026-2027 · 1-semestr") } returns false
        every { repository.save(any()) } answers { firstArg<SubjectSyllabus>().apply { id = 50 } }

        val result = service.createWorkProgram(model, " 2026-2027 ", 1, listOf(SyllabusTopicRequest(THEORETICAL, "Kirish", hours = 2)))

        assertEquals("Matematika · 2026-2027 · 1-semestr", result.name)
        assertEquals(3, result.modelProgramId)
        assertEquals("2026-2027", result.academicYear)
        assertEquals(1, result.semester)
        assertEquals("Namunaviy to'liq", result.fullDescription)
        assertEquals(2, result.theoreticalHours)

        every { repository.existsByModelProgramIdAndAcademicYearAndSemesterAndDeletedFalse(3, "2026-2027", 1) } returns true
        assertThrows<IllegalArgumentException> { service.createWorkProgram(model, "2026-2027", 1, emptyList()) }
        assertThrows<IllegalArgumentException> { service.createWorkProgram(model, "2026", 1, emptyList()) }
        assertThrows<IllegalArgumentException> { service.createWorkProgram(model, "2027-2028", 13, emptyList()) }
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
