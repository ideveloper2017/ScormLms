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
import uz.scorm.lms.app.v1.courses.repository.CourseContentRepository
import uz.scorm.lms.app.v1.courses.repository.CourseModuleRepository
import uz.scorm.lms.app.v1.courses.repository.CourseRepository
import uz.scorm.lms.app.v1.courses.service.CourseAccessService
import uz.scorm.lms.app.v1.courses.service.CourseSyllabusService
import uz.scorm.lms.app.v1.subject.model.Subject
import uz.scorm.lms.app.v1.syllabus.model.SubjectSyllabus
import uz.scorm.lms.app.v1.syllabus.model.SubjectSyllabusModule
import uz.scorm.lms.app.v1.syllabus.model.SubjectSyllabusTopic
import uz.scorm.lms.app.v1.syllabus.model.SyllabusLanguage
import uz.scorm.lms.app.v1.syllabus.model.SyllabusTopicType.PRACTICAL
import uz.scorm.lms.app.v1.syllabus.model.SyllabusTopicType.THEORETICAL

class CourseSyllabusSyncTest {
    private val access = mockk<CourseAccessService>()
    private val courses = mockk<CourseRepository>()
    private val modules = mockk<CourseModuleRepository>()
    private val contents = mockk<CourseContentRepository>()
    private val service = CourseSyllabusService(access, courses, modules, contents)

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
        every { contents.countByModuleIdAndDeletedFalse(any()) } returns 0
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
        // Dastur darslari dastur tartibida, qo'lda qo'shilgan bo'lim ulardan keyin
        assertEquals(3, added.position)
        assertEquals(4, existing.first { it.title == "Qo'shimcha" }.position)
        assertEquals("PRACTICAL", added.topicType)
        assertEquals(3L, added.syllabusTopicId)
        assertTrue(added.fromSyllabus)
        assertEquals(3, course.syllabusRevision)
        assertTrue(existing.none { it.deleted })
    }

    @Test
    fun `bolimlar dastur modullari tartibida, ochirilgan darsning bosh bolimi olib tashlanadi kontentlisi qoladi`() {
        // Dastur: 2-modul (Termodinamika) 1-modul (Mexanika) dan keyin, Tajriba Mexanikada birinchi dars
        val mechanics = SubjectSyllabusModule(syllabus, 1, "Mexanika").apply { id = 61 }
        val thermo = SubjectSyllabusModule(syllabus, 2, "Termodinamika").apply { id = 62 }
        syllabus.modules += listOf(mechanics, thermo)
        syllabus.topics.first { it.id == 3L }.apply { module = mechanics; lessonOrder = 1 }
        syllabus.topics.first { it.id == 2L }.apply { module = mechanics; lessonOrder = 2 }
        syllabus.topics.first { it.id == 1L }.apply { module = thermo; lessonOrder = 1 }
        // Dasturdan o'chirilgan darslarning bo'limlari: biri bo'sh, birida kontent bor
        existing += CourseModule(course, "Eski bo'sh", position = 4, topicType = "THEORETICAL", fromSyllabus = true).apply { id = 104 }
        existing += CourseModule(course, "Eski kontentli", position = 5, topicType = "THEORETICAL", fromSyllabus = true).apply { id = 105 }
        every { contents.countByModuleIdAndDeletedFalse(105) } returns 2

        val result = service.sync(9, 1, false)

        assertEquals(1, result.removed)
        assertTrue(existing.first { it.id == 104L }.deleted)
        assertTrue(!existing.first { it.id == 105L }.deleted)
        val order = existing.filter { !it.deleted }.sortedBy { it.position }.map { it.title }
        assertEquals(listOf("Tajriba", "Kinematika", "Kirish", "Qo'shimcha", "Eski kontentli"), order)
        assertEquals(listOf("Mexanika", "Mexanika", "Termodinamika"), result.status.topics.map { it.syllabusModuleName })
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
