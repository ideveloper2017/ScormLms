package uz.scorm.lms.app.config

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNull

class DatabaseAutoCreateListenerTest {

    @Test
    fun `DB_URL dan baza nomi va postgres xizmat bazasi manzili olinadi`() {
        val target = parsePostgresUrl("jdbc:postgresql://db.local:5433/scorm_lms?currentSchema=public&ssl=true")!!
        assertEquals("db.local:5433", target.hostPort)
        assertEquals("scorm_lms", target.database)
        assertEquals("jdbc:postgresql://db.local:5433/postgres?ssl=true&loginTimeout=5", target.maintenanceUrl)

        val plain = parsePostgresUrl("jdbc:postgresql://localhost:5432/scorm_lms")!!
        assertEquals("jdbc:postgresql://localhost:5432/postgres?loginTimeout=5", plain.maintenanceUrl)
    }

    @Test
    fun `PostgreSQL bo'lmagan yoki xavfli nomli URL o'tkazib yuboriladi`() {
        assertNull(parsePostgresUrl("jdbc:h2:mem:test"))
        assertNull(parsePostgresUrl("jdbc:postgresql://localhost:5432/scorm;DROP"))
        assertNull(parsePostgresUrl("jdbc:postgresql://localhost:5432/"))
    }
}
