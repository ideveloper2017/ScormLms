package uz.scorm.lms.app.v1.compliance

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

class Decision559RulesTest {
    @Test
    fun `21-banddagi onsite talablar xorijiy fuqaroga tatbiq etilmaydi`() {
        assertTrue(Decision559Rules.requiresOnsiteParticipation(isForeignCitizen = false))
        assertFalse(Decision559Rules.requiresOnsiteParticipation(isForeignCitizen = true))
        assertTrue(Decision559Rules.requiresLmsOrientation(true, false))
        assertFalse(Decision559Rules.requiresLmsOrientation(true, true))
    }

    @Test
    fun `bakalavriat limiti 300 dan oshmaydi`() {
        assertEquals(300, Decision559Rules.validateProgramSettings("BACHELOR", true, false, null, "L-123"))
        assertThrows(IllegalArgumentException::class.java) {
            Decision559Rules.validateProgramSettings("BACHELOR", true, false, 301, "L-123")
        }
    }

    @Test
    fun `magistratura limiti 30 dan oshmaydi`() {
        assertEquals(30, Decision559Rules.validateProgramSettings("MASTER", true, false, null, "L-123"))
    }

    @Test
    fun `IT yo'nalishida sonli limit qo'llanmaydi va legacy litsenziya matni gate emas`() {
        assertNull(Decision559Rules.validateProgramSettings("BACHELOR", true, true, null, "L-123"))
        assertNull(Decision559Rules.validateProgramSettings("BACHELOR", true, true, null, null))
    }

    @Test
    fun `masofaviy davomiylik kunduzgi normativdan kam bolmaydi`() {
        Decision559Rules.validateStudyDuration(true, 48, 48)
        Decision559Rules.validateStudyDuration(true, 48, 60)

        val error = assertThrows(IllegalArgumentException::class.java) {
            Decision559Rules.validateStudyDuration(true, 48, 47)
        }
        assertEquals(true, error.message.orEmpty().contains("kam bo'lmasligi"))
    }

    @Test
    fun `masofaviy dastur uchun ikkala normativ davomiylik majburiy`() {
        assertThrows(IllegalArgumentException::class.java) {
            Decision559Rules.validateStudyDuration(true, null, 48)
        }
        assertThrows(IllegalArgumentException::class.java) {
            Decision559Rules.validateStudyDuration(true, 48, null)
        }
    }

    @Test
    fun `AKTdan tashqari masofaviy dastur uchun kunduzgi shakl va asos rekviziti majburiy`() {
        assertThrows(IllegalArgumentException::class.java) {
            Decision559Rules.validateFullTimeCounterpart(true, false, false, null)
        }
        assertThrows(IllegalArgumentException::class.java) {
            Decision559Rules.validateFullTimeCounterpart(true, false, true, " ")
        }
        Decision559Rules.validateFullTimeCounterpart(true, false, true, "BUYRUQ-2026/41")
    }

    @Test
    fun `AKT masofaviy dasturi kunduzgi shakl talabidan mustasno`() {
        Decision559Rules.validateFullTimeCounterpart(true, true, false, null)
    }
}
