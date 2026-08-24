package uz.scorm.lms.app.v1.university

import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import uz.scorm.lms.app.v1.audit.service.AuditService
import uz.scorm.lms.app.v1.university.dto.CreateUniversityRequest
import uz.scorm.lms.app.v1.university.model.University
import uz.scorm.lms.app.v1.university.model.UniversityLanguage
import uz.scorm.lms.app.v1.university.repository.UniversityRepository
import uz.scorm.lms.app.v1.university.service.UniversityService

class UniversityServiceTest {
    private val repository = mockk<UniversityRepository>()
    private val audit = mockk<AuditService>(relaxed = true)
    private val service = UniversityService(repository, audit)

    private fun request(name: String = "Namangan Davlat Texnika Universiteti") = CreateUniversityRequest(
        name = name,
        rector = "Muhammadjon Dadamirzayev",
        address = "Namangan shahar",
        defaultLanguage = UniversityLanguage.UZ_LATIN,
        phone = "+998 90 123 45 67",
        bankDetails = "Hisob raqami 202080001",
        chiefAccountant = "Bosh Hisobchi",
        legalCounsel = "Bosh Yurist",
    )

    @Test
    fun `referensdagi majburiy rekvizitlar bilan universitet yaratiladi`() {
        every { repository.findByNameIgnoreCaseAndDeletedFalse(any()) } returns null
        every { repository.save(any()) } answers { firstArg<University>().apply { id = 11 } }

        val result = service.create(request(), actorId = 7)

        assertEquals(11, result.id)
        assertEquals("+998901234567", result.phone)
        assertEquals(UniversityLanguage.UZ_LATIN, result.defaultLanguage)
        verify { audit.logAction("UNIVERSITY_CREATED", 7, match { it.contains("id=11") }) }
    }

    @Test
    fun `takroriy universitet nomi rad etiladi`() {
        every { repository.findByNameIgnoreCaseAndDeletedFalse(any()) } returns requestEntity()

        assertThrows<IllegalArgumentException> { service.create(request(), actorId = 7) }
    }

    @Test
    fun `ochirish soft delete va audit qiladi`() {
        val university = requestEntity().apply { id = 15 }
        every { repository.findByIdAndDeletedFalse(15) } returns university
        every { repository.save(university) } returns university

        service.delete(15, actorId = 9)

        assertFalse(university.active)
        assertEquals(true, university.deleted)
        verify { audit.logAction("UNIVERSITY_DELETED", 9, match { it.contains("id=15") }) }
    }

    private fun requestEntity() = University(
        name = "Namangan Davlat Texnika Universiteti",
        rector = "Muhammadjon Dadamirzayev",
        address = "Namangan shahar",
        defaultLanguage = UniversityLanguage.UZ_LATIN,
        phone = "+998901234567",
        bankDetails = "Hisob raqami 202080001",
        chiefAccountant = "Bosh Hisobchi",
        legalCounsel = "Bosh Yurist",
    )
}
