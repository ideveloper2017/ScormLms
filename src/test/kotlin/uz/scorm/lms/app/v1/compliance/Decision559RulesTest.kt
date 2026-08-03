package uz.scorm.lms.app.v1.compliance

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Test

class Decision559RulesTest {
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
    fun `IT yo'nalishida sonli limit qo'llanmaydi ammo litsenziya shart`() {
        assertNull(Decision559Rules.validateProgramSettings("BACHELOR", true, true, null, "L-123"))
        assertThrows(IllegalArgumentException::class.java) {
            Decision559Rules.validateProgramSettings("BACHELOR", true, true, null, null)
        }
    }
}
