package uz.scorm.lms.app.v1.academicresult

import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import uz.scorm.lms.app.v1.academicresult.dto.SaveRatingSystemRequest
import uz.scorm.lms.app.v1.academicresult.model.RatingSystem
import uz.scorm.lms.app.v1.academicresult.repository.RatingSystemRepository
import uz.scorm.lms.app.v1.academicresult.service.RatingSystemService
import uz.scorm.lms.app.v1.audit.service.AuditService

class RatingSystemServiceTest {
    private val repository = mockk<RatingSystemRepository>()
    private val audit = mockk<AuditService>(relaxed = true)
    private val service = RatingSystemService(repository, audit)

    @Test
    fun `togri diapazon bilan baholash tizimi yaratiladi`() {
        every { repository.findByNameIgnoreCaseAndDeletedFalse("100 ballik") } returns null
        every { repository.findByShortNameIgnoreCaseAndDeletedFalse("100 ball") } returns null
        every { repository.save(any()) } answers { firstArg<RatingSystem>().apply { id = 3 } }

        val result = service.create(SaveRatingSystemRequest(" 100 ballik ", " 100 ball ", 0, 100, 60), 5)

        assertEquals(3, result.id)
        assertEquals(60, result.passScore)
        verify { audit.logAction("RATING_SYSTEM_CREATED", 5, match { it.contains("id=3") }) }
    }

    @Test
    fun `notogri min max oraligi rad etiladi`() {
        assertThrows<IllegalArgumentException> {
            service.create(SaveRatingSystemRequest("Tizim", "T", 100, 10, 60), 1)
        }
    }

    @Test
    fun `ochirish soft delete qiladi`() {
        val entity = RatingSystem("100 ballik", "100 ball").apply { id = 7 }
        every { repository.findByIdAndDeletedFalse(7) } returns entity
        every { repository.save(entity) } returns entity

        service.delete(7, 2)

        assertEquals(true, entity.deleted)
        assertFalse(entity.active)
    }
}
