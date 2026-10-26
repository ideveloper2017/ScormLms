package uz.scorm.lms.app.v1.courses

import io.mockk.every
import io.mockk.mockk
import io.mockk.slot
import io.mockk.verify
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertSame
import org.junit.jupiter.api.Test
import uz.scorm.lms.app.v1.courses.dto.CourseCreateRequest
import uz.scorm.lms.app.v1.courses.dto.CourseDto
import uz.scorm.lms.app.v1.courses.service.CourseService
import uz.scorm.lms.app.v1.courses.service.CourseSyllabusService
import uz.scorm.lms.app.v1.courses.service.SyllabusCourseWizardService
import uz.scorm.lms.app.v1.courses.service.SyllabusLinkedCourseDto
import uz.scorm.lms.app.v1.courses.service.WizardCourseRequest
import uz.scorm.lms.app.v1.courses.service.WorkProgramRequest
import uz.scorm.lms.app.v1.subject.model.Subject
import uz.scorm.lms.app.v1.syllabus.dto.SubjectSyllabusDto
import uz.scorm.lms.app.v1.syllabus.dto.SyllabusTopicRequest
import uz.scorm.lms.app.v1.syllabus.model.SubjectModelProgram
import uz.scorm.lms.app.v1.syllabus.model.SyllabusLanguage
import uz.scorm.lms.app.v1.syllabus.model.SyllabusTopicType.THEORETICAL
import uz.scorm.lms.app.v1.syllabus.service.SubjectModelProgramService
import uz.scorm.lms.app.v1.syllabus.service.SubjectSyllabusService

class SyllabusCourseWizardServiceTest {
    private val syllabi = mockk<SubjectSyllabusService>()
    private val courses = mockk<CourseService>()
    private val courseSyllabus = mockk<CourseSyllabusService>()
    private val models = mockk<SubjectModelProgramService>()
    private val service = SyllabusCourseWizardService(syllabi, courses, courseSyllabus, models)

    private val model = SubjectModelProgram(Subject(name = "Matematika", code = "MA01").apply { id = 5 }, SyllabusLanguage.RU,
        "Matematika", "Qisqa", null, "To'liq").apply { id = 3 }
    private val topics = listOf(SyllabusTopicRequest(THEORETICAL, "Kirish", hours = 2))
    private val syllabus = SubjectSyllabusDto(41, 5, "MA01", "Matematika", "Matematika · 2026-2027 · 1-semestr", SyllabusLanguage.RU,
        "Qisqa", null, "To'liq", true, null, null)

    @Test
    fun `fan dasturi o'quv dasturidan davr uchun yaratiladi va kurs unga bog'lanadi`() {
        every { models.getEntity(3) } returns model
        every { syllabi.createWorkProgram(model, "2026-2027", 1, topics) } returns syllabus
        val courseRequest = slot<CourseCreateRequest>()
        val course = mockk<CourseDto>()
        every { courses.create(capture(courseRequest), 7, false, true) } returns course

        val result = service.create(WorkProgramRequest(3, "2026-2027", 1, topics, WizardCourseRequest("Matematika 2026", level = "BEGINNER")), 7)

        assertSame(course, result.course)
        assertEquals(41, courseRequest.captured.syllabusId)
        assertEquals(5, courseRequest.captured.subjectId)
        assertEquals("ru", courseRequest.captured.language)
    }

    @Test
    fun `kurs qismi berilmasa faqat fan dasturi yaratiladi`() {
        every { models.getEntity(3) } returns model
        every { syllabi.createWorkProgram(model, "2026-2027", 2, emptyList()) } returns syllabus

        val result = service.create(WorkProgramRequest(3, "2026-2027", 2), 7)

        assertNull(result.course)
        verify(exactly = 0) { courses.create(any(), any(), any(), any()) }
    }

    @Test
    fun `mavzular saqlanganda bog'langan qoralama kurslar ham moslanadi`() {
        every { syllabi.updateTopics(41, topics) } returns syllabus
        val linked = listOf(SyllabusLinkedCourseDto(77, "Matematika", "draft", true, added = 1))
        every { courseSyllabus.syncDraftCourses(41) } returns linked

        val result = service.updateTopics(41, topics)

        assertSame(syllabus, result.syllabus)
        assertEquals(linked, result.courses)
    }
}
