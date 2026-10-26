package uz.scorm.lms.app.v1.courses

import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import uz.scorm.lms.app.v1.courses.model.Course
import uz.scorm.lms.app.v1.courses.model.CourseModule
import uz.scorm.lms.app.v1.courses.repository.CourseModuleRepository
import uz.scorm.lms.app.v1.courses.repository.CourseRepository
import uz.scorm.lms.app.v1.courses.service.CourseAccessService
import uz.scorm.lms.app.v1.courses.service.CourseSyllabusService
import uz.scorm.lms.app.v1.subject.model.Subject
import uz.scorm.lms.app.v1.syllabus.model.SubjectSyllabus
import uz.scorm.lms.app.v1.syllabus.model.SubjectSyllabusTopic
import uz.scorm.lms.app.v1.syllabus.model.SyllabusLanguage
import uz.scorm.lms.app.v1.syllabus.model.SyllabusTopicType.PRACTICAL
import uz.scorm.lms.app.v1.syllabus.model.SyllabusTopicType.THEORETICAL

class CourseSyllabusSyncTest {
    private val access = mockk<CourseAccessService>()
    private val courses = mockk<CourseRepository>()
    private val modules = mockk<CourseModuleRepository>()
    private val service = CourseSyllabusService(access, courses, modules)

    private val syllabus = SubjectSyllabus(Subject(name = "Fizika", code = "FIZ").apply { id = 3 }, "Fizika dasturi",
        SyllabusLanguage.UZ, "Qisqa", null, "To'liq", status = "APPROVED", revisionNumber = 3).apply {
        id = 31
        topics += SubjectSyllabusTopic(this, THEORETICAL, 1, "Kirish", hours = 2).apply { id = 1 }
        topics += SubjectSyllabusTopic(this, THEORETICAL, 2, "Kinematika", hours = 4).apply { id = 2 }
        topics += SubjectSyllabusTopic(this, PRACTICAL, 1, "Tajriba", hours = 4).apply { id = 3 }
    }
    private val course = Course(title = "Fizika 2026", userId = 1, syllabus = syllabus, syllabusRevision = 2).apply { id = 9 }
    // 1-mavzu bo'limi joyida; 2-mavzu bo'limi eski soat bilan; 3-mavzu qo'shilmagan; qo'lda yaratilgan bo'lim ham bor
    private val existing = mutableListOf(
        CourseModule(course, "Kirish", position = 1, topicType = "THEORETICAL", plannedHours = 2, syllabusTopicId = 1).apply { id = 101 },
        CourseModule(course, "Kinematika", position = 2, topicType = "THEORETICAL", plannedHours = 2, syllabusTopicId = 2).apply { id = 102 },
        CourseModule(course, "Qo'shimcha", position = 3).apply { id = 103 },
    )

    init {
        every { access.requireManage(9, 1, false) } returns course
        every { modules.findAllByCourseIdAndDeletedFalseOrderByPositionAsc(9) } answers { existing.toList() }
        every { modules.save(any<CourseModule>()) } answers {
            firstArg<CourseModule>().also { if (it.id == null) { it.id = 200L + existing.size; existing += it } }
        }
        every { courses.save(any()) } answers { firstArg() }
    }

    @Test
    fun `holat qoshilmagan va ozgargan mavzularni korsatadi`() {
        val status = service.status(9, 1, false)

        assertEquals(listOf(101L, 102L, null), status.topics.map { it.moduleId })
        assertEquals(listOf(false, true, false), status.topics.map { it.outdated })
        assertEquals(2, status.pendingCount)
    }

    @Test
    fun `sinxronlash yangi mavzuni qoshadi va ozgarganini yangilaydi, boshqa bolimlarga tegmaydi`() {
        val result = service.sync(9, 1, false)

        assertEquals(1, result.added)
        assertEquals(1, result.updated)
        assertEquals(0, result.status.pendingCount)
        assertEquals(4, existing[1].plannedHours)
        val added = existing.last()
        assertEquals("Tajriba", added.title)
        assertEquals(4, added.position)
        assertEquals("PRACTICAL", added.topicType)
        assertEquals(3L, added.syllabusTopicId)
        assertEquals(3, course.syllabusRevision)
        assertTrue(existing.none { it.deleted })
    }

    @Test
    fun `mavzular ozgarganda faqat qoralama kurslar avtomatik moslanadi`() {
        syllabus.status = "DRAFT"
        val published = Course(title = "Fizika 2025", userId = 1, syllabus = syllabus, status = "PUBLISHED").apply { id = 10 }
        course.status = "DRAFT"
        every { courses.findAllBySyllabusIdAndDeletedFalseOrderByCreatedAtDesc(31) } returns listOf(course, published)

        val result = service.syncDraftCourses(31)

        assertEquals(listOf(true, false), result.map { it.autoSync })
        assertEquals(1, result[0].added)
        assertEquals(1, result[0].updated)
        assertEquals(0, result[1].added)
        verify(exactly = 0) { modules.findAllByCourseIdAndDeletedFalseOrderByPositionAsc(10) }
    }

    @Test
    fun `tasdiqlanmagan versiya bilan sinxronlash rad etiladi`() {
        syllabus.status = "DRAFT"
        assertThrows<IllegalArgumentException> { service.sync(9, 1, false) }
    }
}
