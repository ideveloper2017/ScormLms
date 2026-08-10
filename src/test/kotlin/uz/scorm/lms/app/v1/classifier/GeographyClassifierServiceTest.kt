package uz.scorm.lms.app.v1.classifier

import io.mockk.every
import io.mockk.mockk
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import uz.scorm.lms.app.v1.audit.service.AuditService
import uz.scorm.lms.app.v1.classifier.model.CountryClassifier
import uz.scorm.lms.app.v1.classifier.model.DistrictClassifier
import uz.scorm.lms.app.v1.classifier.model.RegionClassifier
import uz.scorm.lms.app.v1.classifier.repository.CountryClassifierRepository
import uz.scorm.lms.app.v1.classifier.repository.DistrictClassifierRepository
import uz.scorm.lms.app.v1.classifier.repository.RegionClassifierRepository
import uz.scorm.lms.app.v1.classifier.service.GeographyClassifierService
import uz.scorm.lms.app.v1.student.model.Citizenship
import java.util.Optional

class GeographyClassifierServiceTest {
    private val countries = mockk<CountryClassifierRepository>()
    private val regions = mockk<RegionClassifierRepository>()
    private val districts = mockk<DistrictClassifierRepository>()
    private val service = GeographyClassifierService(countries, regions, districts, mockk<AuditService>(relaxed = true))

    @Test
    fun `country code derives existing 559 citizenship enum`() {
        val uz = country(1, "UZ")
        val foreign = country(2, "IL")
        every { countries.findById(1) } returns Optional.of(uz)
        every { countries.findById(2) } returns Optional.of(foreign)

        assertEquals(Citizenship.UZBEKISTAN, service.resolveCitizenship(1, Citizenship.OTHER).citizenship)
        assertEquals(Citizenship.OTHER, service.resolveCitizenship(2, Citizenship.UZBEKISTAN).citizenship)
    }

    @Test
    fun `district must belong to selected region`() {
        val namangan = region(10, "UZ-NG")
        val fergana = region(20, "UZ-FA")
        val district = DistrictClassifier("UZ-FA-FER", "Farg'ona shahri", fergana).also { it.id = 30 }
        every { regions.findById(10) } returns Optional.of(namangan)
        every { districts.findById(30) } returns Optional.of(district)

        val error = assertThrows<IllegalArgumentException> { service.resolveAddress(10, 30, null, null) }
        assertEquals("Tanlangan tuman hududga tegishli emas", error.message)
    }

    @Test
    fun `legacy address remains available when classifier ids are absent`() {
        val resolved = service.resolveAddress(null, null, " Eski viloyat ", " Eski tuman ")
        assertEquals("Eski viloyat", resolved.regionName)
        assertEquals("Eski tuman", resolved.districtName)
    }

    private fun country(id: Long, code: String) = CountryClassifier(code, code).also { it.id = id }
    private fun region(id: Long, code: String) = RegionClassifier(code, code).also { it.id = id }
}
