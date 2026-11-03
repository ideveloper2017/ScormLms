package uz.scorm.lms.app.v1.courses

import io.mockk.every
import io.mockk.mockk
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import uz.scorm.lms.app.v1.courses.dto.CourseModuleRequest
import uz.scorm.lms.app.v1.courses.model.Course
import uz.scorm.lms.app.v1.courses.model.CourseModule
import uz.scorm.lms.app.v1.courses.model.CourseUnit
import uz.scorm.lms.app.v1.courses.repository.CourseContentRepository
import uz.scorm.lms.app.v1.courses.repository.CourseModuleRepository
import uz.scorm.lms.app.v1.courses.repository.CourseUnitRepository
import uz.scorm.lms.app.v1.courses.service.CourseAccessService
import uz.scorm.lms.app.v1.courses.service.CourseModuleService
import uz.scorm.lms.app.v1.courses.service.CourseUnitService
import uz.scorm.lms.app.v1.subject.model.Subject
import uz.scorm.lms.app.v1.syllabus.model.SubjectSyllabus
import uz.scorm.lms.app.v1.syllabus.model.SubjectSyllabusModule
import uz.scorm.lms.app.v1.syllabus.model.SubjectSyllabusTopic
import uz.scorm.lms.app.v1.syllabus.model.SyllabusLanguage
import uz.scorm.lms.app.v1.syllabus.model.SyllabusTopicType.THEORETICAL
import java.util.Optional

class CourseModuleSyllabusPlacementTest {
    private val access = mockk<CourseAccessService>()
    private val modules = mockk<CourseModuleRepository>()
    private val contents = mockk<CourseContentRepository>()
    private val unitRepo = mockk<CourseUnitRepository>()
    private val service = CourseModuleService(modules, contents, access, unitRepo, CourseUnitService(unitRepo, modules, access))

    private val syllabus = SubjectSyllabus(Subject(name = "Fizika", code = "FIZ").apply { id = 3 }, "Fizika dasturi",
        SyllabusLanguage.UZ, "Qisqa", null, "To'liq", status = "APPROVED").apply {
        id = 31
        val mechanics = SubjectSyllabusModule(this, 1, "Mexanika").apply { id = 61 }
        modules += mechanics
        topics += SubjectSyllabusTopic(this, THEORETICAL, 1, "Kirish", hours = 2).apply { id = 1; module = mechanics; lessonOrder = 1 }
        topics += SubjectSyllabusTopic(this, THEORETICAL, 2, "Kinematika", hours = 2).apply { id = 2; module = mechanics; lessonOrder = 2 }
        topics += SubjectSyllabusTopic(this, THEORETICAL, 3, "Dinamika", hours = 2).apply { id = 3; module = mechanics; lessonOrder = 3 }
    }
    private val course = Course(title = "Fizika 2026", userId = 1, syllabus = syllabus).apply { id = 9 }
    private val mechanicsUnit = CourseUnit(course, "Mexanika", position = 1, syllabusModuleId = 61).apply { id = 71 }
    private val extraUnit = CourseUnit(course, "Takrorlash", position = 2).apply { id = 72 }
    private val existing = mutableListOf(
        CourseModule(course, "Kirish", position = 1, syllabusTopicId = 1, unit = mechanicsUnit).apply { id = 101 },
        CourseModule(course, "Dinamika", position = 2, syllabusTopicId = 3, unit = mechanicsUnit).apply { id = 103 },
        CourseModule(course, "Qo'shimcha", position = 3).apply { id = 104 },
    )

    init {
        every { access.requireManage(9, 1, false) } returns course
        every { modules.existsByCourseIdAndSyllabusTopicIdAndDeletedFalse(9, any()) } returns false
        every { modules.findAllByCourseIdAndDeletedFalseOrderByPositionAsc(9) } answers { existing.sortedBy { it.position } }
        every { modules.findFirstByCourseIdAndDeletedFalseOrderByPositionDesc(9) } answers { existing.maxBy { it.position } }
        every { modules.findById(any()) } answers { Optional.ofNullable(existing.firstOrNull { it.id == firstArg<Long>() }) }
        every { modules.save(any<CourseModule>()) } answers {
            firstArg<CourseModule>().also { if (it.id == null) { it.id = 200L + existing.size; existing += it } }
        }
        every { unitRepo.findAllByCourseIdAndDeletedFalseOrderByPositionAsc(9) } returns listOf(mechanicsUnit, extraUnit)
        every { unitRepo.findById(72) } returns Optional.of(extraUnit)
        every { contents.countByModuleIdAndDeletedFalse(any()) } returns 0
    }

    @Test
    fun `dars bolimi dastur tartibidagi joyiga va oz dastur moduliga qoyiladi`() {
        val created = service.create(9, CourseModuleRequest(title = "", syllabusTopicId = 2), 1, false)

        assertEquals(2, created.position)
        assertEquals(71L, created.unitId)
        assertEquals(listOf("Kirish", "Kinematika", "Dinamika", "Qo'shimcha"), existing.sortedBy { it.position }.map { it.title })
    }

    @Test
    fun `qoshimcha dars tanlangan modulga qoshiladi, umumiy tartib modullarga ergashadi`() {
        val created = service.create(9, CourseModuleRequest(title = "Savollar", unitId = 72), 1, false)
        assertEquals(72L, created.unitId)
        // Takrorlash moduli Mexanikadan keyin; modulsiz "Qo'shimcha" eng oxirida
        assertEquals(listOf("Kirish", "Dinamika", "Savollar", "Qo'shimcha"), existing.sortedBy { it.position }.map { it.title })

        // Dastur darsining moduli kurs sahifasida o'zgartirilmaydi
        assertThrows<IllegalArgumentException> {
            service.update(9, 101, CourseModuleRequest(title = "Kirish", unitId = 72), 1, false)
        }
    }
}
