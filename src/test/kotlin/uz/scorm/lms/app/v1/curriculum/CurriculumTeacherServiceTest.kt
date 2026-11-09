package uz.scorm.lms.app.v1.curriculum

import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import uz.scorm.lms.app.v1.curriculum.model.CurriculumStatus
import uz.scorm.lms.app.v1.curriculum.model.ProgramCurriculumSubject
import uz.scorm.lms.app.v1.curriculum.model.ProgramCurriculumVersion
import uz.scorm.lms.app.v1.curriculum.repository.ProgramCurriculumSubjectRepository
import uz.scorm.lms.app.v1.curriculum.repository.ProgramCurriculumVersionRepository
import uz.scorm.lms.app.v1.curriculum.service.CurriculumTeacherService
import uz.scorm.lms.app.v1.curriculum.service.ProgramCurriculumService
import uz.scorm.lms.app.v1.teacher.model.Teacher
import uz.scorm.lms.app.v1.teacher.repository.TeacherRepository
import java.util.Optional

class CurriculumTeacherServiceTest {
    private val versions = mockk<ProgramCurriculumVersionRepository>()
    private val items = mockk<ProgramCurriculumSubjectRepository>()
    private val teachers = mockk<TeacherRepository>()
    private val curriculum = mockk<ProgramCurriculumService>(relaxed = true)
    private val service = CurriculumTeacherService(versions, items, teachers, mockk(relaxed = true), curriculum)
    private val version = mockk<ProgramCurriculumVersion> { every { id } returns 5; every { status } returns CurriculumStatus.APPROVED }
    private val item = mockk<ProgramCurriculumSubject>(relaxed = true) { every { curriculumVersion } returns version }

    init {
        every { versions.findByIdAndDeletedFalse(5) } returns version
        every { items.findByIdAndDeletedFalse(9) } returns item
        every { items.save(any()) } answers { firstArg() }
    }

    @Test
    fun `tasdiqlangan rejada ham fanga o'qituvchi biriktiriladi va olib tashlanadi`() {
        val teacher = Teacher(fullName = "Aliyev Anvar").apply { id = 3 }
        every { teachers.findById(3) } returns Optional.of(teacher)
        var assigned: Teacher? = null
        every { item.teacher = any() } answers { assigned = firstArg() }

        service.assign(5, 9, 3, 1)
        assertEquals("Aliyev Anvar", assigned?.fullName)
        service.assign(5, 9, null, 1)
        assertNull(assigned)
        verify(exactly = 2) { items.save(item) }
    }

    @Test
    fun `faol bo'lmagan o'qituvchi rad etiladi`() {
        every { teachers.findById(4) } returns Optional.of(Teacher(fullName = "Eski", active = false).apply { id = 4 })
        assertThrows<IllegalArgumentException> { service.assign(5, 9, 4, 1) }
    }
}
