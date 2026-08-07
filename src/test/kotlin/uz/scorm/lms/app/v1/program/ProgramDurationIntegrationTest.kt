package uz.scorm.lms.app.v1.program

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.ActiveProfiles
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.program.dto.ProgramCreateRequest
import uz.scorm.lms.app.v1.program.service.ProgramService

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class ProgramDurationIntegrationTest {
    @Autowired private lateinit var service: ProgramService

    @Test
    fun `masofaviy dastur kunduzgidan kam bolmagan davomiylik bilan saqlanadi`() {
        val program = service.create(ProgramCreateRequest(
            name = "17-band test dasturi",
            code = "DURATION-${System.nanoTime()}",
            degreeLevel = "BACHELOR",
            distanceEnabled = true,
            distanceAdmissionLimit = 100,
            licenseReference = "LICENSE-DURATION-17",
            fullTimeDurationMonths = 48,
            distanceDurationMonths = 54,
            fullTimeAvailable = true,
            fullTimeBasisReference = "BUYRUQ-17/2026",
        ))

        assertEquals(48, program.fullTimeDurationMonths)
        assertEquals(54, program.distanceDurationMonths)
        assertEquals(true, program.fullTimeAvailable)
        assertEquals("BUYRUQ-17/2026", program.fullTimeBasisReference)
    }

    @Test
    fun `masofaviy dastur kunduzgidan qisqa muddat bilan yaratilmaydi`() {
        val error = assertThrows(IllegalArgumentException::class.java) {
            service.create(ProgramCreateRequest(
                name = "Noto'g'ri davomiylik",
                code = "BAD-DURATION-${System.nanoTime()}",
                degreeLevel = "BACHELOR",
                distanceEnabled = true,
                licenseReference = "LICENSE-DURATION-17",
                fullTimeDurationMonths = 48,
                distanceDurationMonths = 36,
            ))
        }

        assertTrue(error.message.orEmpty().contains("kunduzgi ta'limdan kam bo'lmasligi"))
    }

    @Test
    fun `3-band kunduzgi shaklsiz oddiy masofaviy dastur yaratishni bloklaydi`() {
        val error = assertThrows(IllegalArgumentException::class.java) {
            service.create(ProgramCreateRequest(
                name = "Kunduzgi asossiz dastur",
                code = "NO-FULL-TIME-${System.nanoTime()}",
                degreeLevel = "MASTER",
                distanceEnabled = true,
                fullTimeDurationMonths = 24,
                distanceDurationMonths = 24,
            ))
        }
        assertTrue(error.message.orEmpty().contains("3-band"))
    }

    @Test
    fun `3-band AKT yonalishini kunduzgi shakl talabidan mustasno qiladi`() {
        val program = service.create(ProgramCreateRequest(
            name = "AKT istisno dasturi",
            code = "ICT-EXEMPT-${System.nanoTime()}",
            degreeLevel = "BACHELOR",
            distanceEnabled = true,
            informationTechnologyProgram = true,
            fullTimeDurationMonths = 48,
            distanceDurationMonths = 48,
        ))
        assertEquals(false, program.fullTimeAvailable)
    }
}
