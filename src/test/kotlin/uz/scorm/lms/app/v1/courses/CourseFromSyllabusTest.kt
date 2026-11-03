package uz.scorm.lms.app.v1.courses

import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import uz.scorm.lms.app.v1.courses.dto.CourseCreateRequest
import uz.scorm.lms.app.v1.courses.model.Course
import uz.scorm.lms.app.v1.courses.model.CourseModule
import uz.scorm.lms.app.v1.courses.model.CourseUnit
import uz.scorm.lms.app.v1.courses.repository.CourseModuleRepository
import uz.scorm.lms.app.v1.courses.repository.CourseRepository
import uz.scorm.lms.app.v1.courses.repository.CourseUnitRepository
import uz.scorm.lms.app.v1.courses.service.CourseService
import uz.scorm.lms.app.v1.courses.service.CourseSyllabusService
import uz.scorm.lms.app.v1.courses.service.CourseUnitService
import uz.scorm.lms.app.v1.syllabus.model.SubjectSyllabusModule
import uz.scorm.lms.app.v1.subject.model.Subject
import uz.scorm.lms.app.v1.subject.repository.SubjectRepository
import uz.scorm.lms.app.v1.syllabus.model.SubjectSyllabus
import uz.scorm.lms.app.v1.syllabus.model.SubjectSyllabusTopic
import uz.scorm.lms.app.v1.syllabus.model.SyllabusLanguage
import uz.scorm.lms.app.v1.syllabus.model.SyllabusTopicType.PRACTICAL
import uz.scorm.lms.app.v1.syllabus.model.SyllabusTopicType.THEORETICAL
import uz.scorm.lms.app.v1.syllabus.repository.SubjectSyllabusRepository
import uz.scorm.lms.app.v1.teacher.repository.TeacherRepository
import java.util.Optional

class CourseFromSyllabusTest {
    private val courses = mockk<CourseRepository>()
    private val subjects = mockk<SubjectRepository>()
    private val teachers = mockk<TeacherRepository>()
    private val syllabi = mockk<SubjectSyllabusRepository>()
    private val modules = mockk<CourseModuleRepository>()
    private val unitRepo = mockk<CourseUnitRepository>()
    private val units = mutableListOf<CourseUnit>()
    private val created = mutableListOf<CourseModule>()
    private val structure = CourseSyllabusService(mockk(), courses, modules, mockk(relaxed = true), unitRepo, CourseUnitService(unitRepo, modules, mockk()),
        mockk(relaxed = true), mockk(relaxed = true), mockk(relaxed = true))
    private val service = CourseService(courses, mockk(relaxed = true), mockk(), subjects, mockk(relaxed = true), teachers, syllabi, structure)

    private val subject = Subject(name = "Algoritmlar", code = "ALG101").apply { id = 8 }
    private val syllabus = SubjectSyllabus(
        subject = subject, name = "Algoritmlar dasturi", language = SyllabusLanguage.UZ,
        shortDescription = "Qisqa mazmun", requirements = "Dasturlash asoslari", fullDescription = "To'liq mazmun",
        status = "APPROVED", revisionNumber = 2,
    ).apply {
        id = 31
        topics += SubjectSyllabusTopic(this, PRACTICAL, 1, "Saralash", hours = 4)
        topics += SubjectSyllabusTopic(this, THEORETICAL, 2, "Murakkablik", hours = 2)
        topics += SubjectSyllabusTopic(this, THEORETICAL, 1, "Kirish", "Fan maqsadi", 2)
    }

    init {
        every { teachers.findByUserId(1) } returns null
        every { subjects.findById(8) } returns Optional.of(subject)
        every { courses.save(any()) } answers { firstArg<Course>().apply { id = 100 } }
        every { modules.save(any<CourseModule>()) } answers {
            firstArg<CourseModule>().also { if (it.id == null) { it.id = 500L + created.size; created += it } }
        }
        every { modules.findAllByCourseIdAndDeletedFalseOrderByPositionAsc(100) } answers { created.sortedBy { it.position } }
        every { unitRepo.findAllByCourseIdAndDeletedFalseOrderByPositionAsc(100) } answers { units.sortedBy { it.position } }
        every { unitRepo.save(any<CourseUnit>()) } answers {
            firstArg<CourseUnit>().also { if (it.id == null) { it.id = 600L + units.size; units += it } }
        }
    }

    @Test
    fun `kurs tasdiqlangan dastur asosida yaratiladi va mavzular modulga aylanadi`() {
        every { syllabi.findByIdAndDeletedFalse(31) } returns syllabus

        val result = service.create(CourseCreateRequest(title = "Algoritmlar 2026", subjectId = 8, syllabusId = 31), ownerUserId = 1)
        val saved = created.sortedBy { it.position }

        assertEquals(31, result.syllabusId)
        assertEquals(2, result.syllabusRevision)
        assertEquals("To'liq mazmun", result.description)
        assertEquals("Dasturlash asoslari", result.requirements)
        assertEquals(listOf("Kirish", "Murakkablik", "Saralash"), saved.map { it.title })
        assertEquals(listOf(1, 2, 3), saved.map { it.position })
        assertEquals(listOf("THEORETICAL", "THEORETICAL", "PRACTICAL"), saved.map { it.topicType })
        assertEquals(listOf(2, 2, 4), saved.map { it.plannedHours })
        assertEquals("Fan maqsadi", saved.first().description)
        assertTrue(units.isEmpty())
    }

    @Test
    fun `dastur modullari kurs modullariga, darslari ularning darslariga aylanadi`() {
        val sorting = SubjectSyllabusModule(syllabus, 2, "Saralash usullari", "Taqqoslash asosida").apply { id = 72 }
        val basics = SubjectSyllabusModule(syllabus, 1, "Asoslar").apply { id = 71 }
        syllabus.modules += listOf(sorting, basics)
        syllabus.topics[0].apply { module = sorting; lessonOrder = 1 }
        syllabus.topics[1].apply { module = basics; lessonOrder = 2 }
        syllabus.topics[2].apply { module = basics; lessonOrder = 1 }
        every { syllabi.findByIdAndDeletedFalse(31) } returns syllabus

        service.create(CourseCreateRequest(title = "Algoritmlar 2026", subjectId = 8, syllabusId = 31), ownerUserId = 1)

        assertEquals(listOf("Asoslar", "Saralash usullari"), units.sortedBy { it.position }.map { it.title })
        assertEquals("Taqqoslash asosida", units.first { it.syllabusModuleId == 72L }.description)
        assertEquals(listOf("Kirish" to "Asoslar", "Murakkablik" to "Asoslar", "Saralash" to "Saralash usullari"),
            created.sortedBy { it.position }.map { it.title to it.unit?.title })
    }

    @Test
    fun `tasdiqlanmagan yoki boshqa fan dasturi rad etiladi`() {
        every { syllabi.findByIdAndDeletedFalse(31) } returns syllabus.apply { status = "DRAFT" }
        assertThrows<IllegalArgumentException> {
            service.create(CourseCreateRequest(title = "Kurs", subjectId = 8, syllabusId = 31), ownerUserId = 1)
        }
        // "Fan dasturi va kurs" oynasi: qoralama dasturga faqat aniq ruxsat bilan bog'lanadi
        assertEquals(31, service.create(CourseCreateRequest(title = "Kurs", subjectId = 8, syllabusId = 31), ownerUserId = 1,
            allowDraftSyllabus = true).syllabusId)
        io.mockk.clearMocks(courses, answers = false)

        val other = Subject(name = "Fizika", code = "FIZ").apply { id = 9 }
        every { subjects.findById(9) } returns Optional.of(other)
        every { syllabi.findByIdAndDeletedFalse(31) } returns syllabus.apply { status = "APPROVED" }
        assertThrows<IllegalArgumentException> {
            service.create(CourseCreateRequest(title = "Kurs", subjectId = 9, syllabusId = 31), ownerUserId = 1)
        }
        verify(exactly = 0) { courses.save(any()) }
    }
}
