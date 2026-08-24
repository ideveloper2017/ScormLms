package uz.scorm.lms.app.v1.tutorgroup

import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import uz.scorm.lms.app.v1.audit.service.AuditService
import uz.scorm.lms.app.v1.faculty.repository.FacultyRepository
import uz.scorm.lms.app.v1.teacher.repository.TeacherRepository
import uz.scorm.lms.app.v1.tutorgroup.dto.SaveTutorGroupRequest
import uz.scorm.lms.app.v1.tutorgroup.model.TutorGroup
import uz.scorm.lms.app.v1.tutorgroup.repository.TutorGroupRepository
import uz.scorm.lms.app.v1.tutorgroup.service.TutorGroupService

class TutorGroupServiceTest {
    private val groups = mockk<TutorGroupRepository>()
    private val faculties = mockk<FacultyRepository>()
    private val teachers = mockk<TeacherRepository>()
    private val audit = mockk<AuditService>(relaxed = true)
    private val service = TutorGroupService(groups, faculties, teachers, audit)

    @Test
    fun `kod normallanib uch tildagi tutor guruhi yaratiladi`() {
        every { groups.existsByCodeIgnoreCaseAndDeletedFalse("TG-01") } returns false
        every { groups.save(any()) } answers { firstArg<TutorGroup>().apply { id = 8 } }

        val result = service.create(SaveTutorGroupRequest("  Birinchi kurs  ", " tg-01 ", nameUz = " Birinchi kurs ", nameRu = "Первый курс", nameEn = "Year one"), 5)

        assertEquals(8, result.id)
        assertEquals("TG-01", result.code)
        assertEquals("Birinchi kurs", result.nameUz)
        verify { audit.logAction("TUTOR_GROUP_CREATED", 5, match { it.contains("code=TG-01") }) }
    }

    @Test
    fun `takroriy tutor guruhi kodi rad etiladi`() {
        every { groups.existsByCodeIgnoreCaseAndDeletedFalse("TG-01") } returns true
        assertThrows<IllegalArgumentException> { service.create(SaveTutorGroupRequest("Guruh", "TG-01"), 5) }
    }
}
