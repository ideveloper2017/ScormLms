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
import uz.scorm.lms.app.v1.courses.service.SyllabusCourseWizardService
import uz.scorm.lms.app.v1.courses.service.SyllabusWithCourseRequest
import uz.scorm.lms.app.v1.courses.service.WizardCourseRequest
import uz.scorm.lms.app.v1.syllabus.dto.SubjectSyllabusDto
import uz.scorm.lms.app.v1.syllabus.dto.SubjectSyllabusRequest
import uz.scorm.lms.app.v1.syllabus.dto.SyllabusTopicRequest
import uz.scorm.lms.app.v1.syllabus.model.SyllabusLanguage
import uz.scorm.lms.app.v1.syllabus.model.SyllabusTopicType.THEORETICAL
import uz.scorm.lms.app.v1.syllabus.service.SubjectSyllabusService

class SyllabusCourseWizardServiceTest {
    private val syllabi = mockk<SubjectSyllabusService>()
    private val courses = mockk<CourseService>()
    private val courseSyllabus = mockk<uz.scorm.lms.app.v1.courses.service.CourseSyllabusService>()
    private val service = SyllabusCourseWizardService(syllabi, courses, courseSyllabus)

    @Test
    fun `mavzular saqlanganda bog'langan qoralama kurslar ham moslanadi`() {
        val topics = listOf(SyllabusTopicRequest(THEORETICAL, "Kirish", hours = 2))
        every { syllabi.updateTopics(41, topics) } returns syllabus
        val linked = listOf(uz.scorm.lms.app.v1.courses.service.SyllabusLinkedCourseDto(77, "Matematika", "draft", true, added = 1))
        every { courseSyllabus.syncDraftCourses(41) } returns linked

        val result = service.updateTopics(41, topics)

        assertSame(syllabus, result.syllabus)
        assertEquals(linked, result.courses)
    }

    private val syllabusRequest = SubjectSyllabusRequest(5, language = SyllabusLanguage.RU, shortDescription = "Qisqa",
        fullDescription = "To'liq", topics = listOf(SyllabusTopicRequest(THEORETICAL, "Kirish", hours = 2)))
    private val syllabus = SubjectSyllabusDto(41, 5, "MA01", "Matematika", "Matematika", SyllabusLanguage.RU,
        "Qisqa", null, "To'liq", true, null, null)

    @Test
    fun `dastur mavzulari bilan va shu dasturga bog'langan kurs birga yaratiladi`() {
        every { syllabi.create(syllabusRequest) } returns syllabus
        val courseRequest = slot<CourseCreateRequest>()
        val course = mockk<CourseDto>()
        every { courses.create(capture(courseRequest), 7, false, true) } returns course

        val result = service.create(SyllabusWithCourseRequest(syllabusRequest, WizardCourseRequest("Matematika 2026", level = "BEGINNER")), 7)

        assertSame(course, result.course)
        assertEquals(41, courseRequest.captured.syllabusId)
        assertEquals(5, courseRequest.captured.subjectId)
        assertEquals("ru", courseRequest.captured.language)
        assertEquals("Matematika 2026", courseRequest.captured.title)
    }

    @Test
    fun `kurs qismi berilmasa faqat dastur yaratiladi`() {
        every { syllabi.create(any()) } returns syllabus

        val result = service.create(SyllabusWithCourseRequest(syllabusRequest.copy(topics = null)), 7)

        assertNull(result.course)
        verify { syllabi.create(syllabusRequest.copy(topics = emptyList())) }
        verify(exactly = 0) { courses.create(any(), any(), any(), any()) }
    }
}
