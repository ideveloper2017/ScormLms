package uz.scorm.lms.app.v1.courses

import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertSame
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import uz.scorm.lms.app.v1.courses.model.CourseContentType
import uz.scorm.lms.app.v1.courses.model.SubjectMaterial
import uz.scorm.lms.app.v1.courses.repository.SubjectMaterialRepository
import uz.scorm.lms.app.v1.courses.service.CourseSyllabusService
import uz.scorm.lms.app.v1.courses.service.SubjectMaterialService
import uz.scorm.lms.app.v1.courses.service.SyllabusLessonMaterialRequest
import uz.scorm.lms.app.v1.courses.service.SyllabusLessonMaterialService
import uz.scorm.lms.app.v1.subject.model.Subject
import uz.scorm.lms.app.v1.syllabus.model.SubjectSyllabus
import uz.scorm.lms.app.v1.syllabus.model.SubjectSyllabusTopic
import uz.scorm.lms.app.v1.syllabus.model.SyllabusLanguage
import uz.scorm.lms.app.v1.syllabus.model.SyllabusTopicType.THEORETICAL
import uz.scorm.lms.app.v1.syllabus.repository.SubjectSyllabusRepository
import uz.scorm.lms.app.v1.user.model.User
import uz.scorm.lms.app.v1.user.repository.UserRepository
import java.util.Optional

class SyllabusLessonMaterialServiceTest {
    private val syllabi = mockk<SubjectSyllabusRepository>()
    private val materials = mockk<SubjectMaterialRepository>(relaxed = true)
    private val users = mockk<UserRepository>()
    private val bank = SubjectMaterialService(materials, mockk(relaxed = true), mockk(), users, mockk(), mockk(relaxed = true))
    private val courseSync = mockk<CourseSyllabusService>()
    private val service = SyllabusLessonMaterialService(syllabi, materials, bank, mockk(), courseSync)
    private val stored = mutableListOf<SubjectMaterial>()

    private val syllabus = SubjectSyllabus(Subject(name = "Fizika", code = "FIZ").apply { id = 3 }, "Fizika dasturi",
        SyllabusLanguage.RU, "Qisqa", null, "To'liq").apply {
        id = 31
        topics += SubjectSyllabusTopic(this, THEORETICAL, 1, "Kinematika").apply { id = 11 }
    }

    init {
        every { syllabi.lockById(31) } returns syllabus
        every { users.findById(5) } returns Optional.of(User(username = "kafedra").apply { id = 5; fullName = "Kafedra mudiri" })
        every { materials.save(any<SubjectMaterial>()) } answers { firstArg<SubjectMaterial>().also { it.id = 90L + stored.size; stored += it } }
        every { materials.findAllBySyllabusTopicIdInAndDeletedFalseOrderByTopicPositionAscIdAsc(listOf(11L)) } answers {
            stored.filter { !it.deleted }.sortedBy { it.topicPosition }
        }
        every { courseSync.syncDraftCourses(31) } returns emptyList()
    }

    @Test
    fun `dars kontenti fan bankiga darsga boglanib saqlanadi va qoralama kurslar moslanadi`() {
        service.create(31, 11, request("Ma'ruza matni"), 5)
        val result = service.create(31, 11, SyllabusLessonMaterialRequest("Video", contentType = CourseContentType.VIDEO,
            contentUrl = "https://video.example/1"), 5)

        assertEquals(listOf("Ma'ruza matni", "Video"), result.materials.map { it.title })
        val first = stored.first()
        assertSame(syllabus.topics.single(), first.syllabusTopic)
        assertEquals(listOf(1, 2), stored.map { it.topicPosition })
        assertEquals("ru", first.languageCode)
        assertEquals("Kafedra mudiri", first.authorName)
        verify(exactly = 2) { courseSync.syncDraftCourses(31) }
    }

    @Test
    fun `tahrirlash versiyani oshiradi, tartib va ochirish darsga tegishli materiallar bilan ishlaydi`() {
        service.create(31, 11, request("Matn"), 5)
        service.create(31, 11, request("Qo'shimcha"), 5)

        service.update(31, 11, 90, request("Yangilangan matn"))
        assertEquals("Yangilangan matn", stored[0].title)
        assertEquals("2.0", stored[0].contentVersion)

        val reordered = service.reorder(31, 11, listOf(91, 90))
        assertEquals(listOf("Qo'shimcha", "Yangilangan matn"), reordered.materials.map { it.title })
        assertThrows<IllegalArgumentException> { service.reorder(31, 11, listOf(91)) }

        val left = service.delete(31, 11, 91)
        assertEquals(listOf("Yangilangan matn"), left.materials.map { it.title })
        assertThrows<NoSuchElementException> { service.delete(31, 11, 777) }
    }

    @Test
    fun `tasdiqlangan dasturga va boshqa dastur darsiga kontent qoshilmaydi`() {
        assertThrows<NoSuchElementException> { service.create(31, 12, request("Matn"), 5) }
        syllabus.status = "APPROVED"
        assertThrows<IllegalArgumentException> { service.create(31, 11, request("Matn"), 5) }
    }

    private fun request(title: String) =
        SyllabusLessonMaterialRequest(title, contentType = CourseContentType.TEXT, contentBody = "<p>$title</p>")
}
