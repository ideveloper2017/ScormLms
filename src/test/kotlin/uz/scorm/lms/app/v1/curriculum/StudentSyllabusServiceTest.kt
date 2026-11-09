package uz.scorm.lms.app.v1.curriculum

import io.mockk.every
import io.mockk.mockk
import io.mockk.slot
import io.mockk.verify
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import uz.scorm.lms.app.v1.courses.model.CourseContentType
import uz.scorm.lms.app.v1.courses.model.SubjectMaterial
import uz.scorm.lms.app.v1.courses.repository.SubjectMaterialRepository
import uz.scorm.lms.app.v1.curriculum.model.StudentSyllabusProgress
import uz.scorm.lms.app.v1.curriculum.repository.StudentSyllabusProgressRepository
import uz.scorm.lms.app.v1.curriculum.service.StudentCurriculumDto
import uz.scorm.lms.app.v1.curriculum.service.StudentCurriculumService
import uz.scorm.lms.app.v1.curriculum.service.StudentSyllabusService
import uz.scorm.lms.app.v1.student.model.StudentProfile
import uz.scorm.lms.app.v1.student.repository.StudentRepository
import uz.scorm.lms.app.v1.subject.model.Subject
import uz.scorm.lms.app.v1.syllabus.dto.SubjectSyllabusDto
import uz.scorm.lms.app.v1.syllabus.dto.SyllabusTopicDto
import uz.scorm.lms.app.v1.syllabus.model.SubjectSyllabusTopic
import uz.scorm.lms.app.v1.syllabus.repository.SyllabusLessonQuizRepository
import java.util.Optional

class StudentSyllabusServiceTest {
    private val curriculum = mockk<StudentCurriculumService>()
    private val students = mockk<StudentRepository>()
    private val materials = mockk<SubjectMaterialRepository>()
    private val quizzes = mockk<SyllabusLessonQuizRepository>()
    private val progress = mockk<StudentSyllabusProgressRepository>()
    private val service = StudentSyllabusService(curriculum, students, materials, quizzes, mockk(), progress, mockk(relaxed = true), mockk())
    private val topic = mockk<SubjectSyllabusTopic> { every { id } returns 11 }
    private val material = SubjectMaterial(Subject(name = "Mexanika").apply { id = 3 }, null, 7, "Ma'ruza", null, CourseContentType.TEXT,
        contentBody = "<p>Tezlik</p>", languageCode = "uz", authorName = "Kafedra", contentVersion = "1.0", sourceName = "Fan").apply {
        id = 70; syllabusTopic = topic; topicPosition = 1
    }

    init {
        val syllabus = mockk<SubjectSyllabusDto> {
            every { id } returns 40
            every { topics } returns listOf(mockk<SyllabusTopicDto> { every { id } returns 11 })
        }
        every { curriculum.mine(5) } returns StudentCurriculumDto(null, 1, listOf(syllabus))
        every { students.findByUserId(5) } returns mockk<StudentProfile> { every { id } returns 9 }
        every { materials.findAllBySyllabusTopicIdInAndDeletedFalseOrderByTopicPositionAscIdAsc(setOf(11L)) } returns listOf(material)
        every { materials.findById(70) } returns Optional.of(material)
        every { quizzes.findAllByTopicIdInAndDeletedFalseOrderByPositionAscIdAsc(any()) } returns emptyList()
    }

    @Test
    fun `talaba o'z tasdiqlangan dasturi darslarini va bajarganlarini oladi, material bajarildi deb belgilanadi`() {
        every { progress.findAllByStudentIdAndMaterialIdIn(9, listOf(70L)) } returns emptyList() andThen listOf(StudentSyllabusProgress(9, 70))
        every { progress.existsByStudentIdAndMaterialId(9, 70) } returns false
        val saved = slot<StudentSyllabusProgress>()
        every { progress.save(capture(saved)) } answers { saved.captured }

        val lessons = service.lessons(5, 40)
        assertEquals(listOf(11L), lessons.materials.map { it.topicId })
        assertEquals(emptyList<Long>(), lessons.completedMaterialIds)

        assertEquals(listOf(70L), service.complete(5, 40, 70))
        assertEquals(70L, saved.captured.materialId)
        verify(exactly = 1) { progress.save(any()) }
    }

    @Test
    fun `rejada bo'lmagan yoki tasdiqlanmagan dastur ochilmaydi`() {
        assertThrows<NoSuchElementException> { service.lessons(5, 99) }
    }
}
