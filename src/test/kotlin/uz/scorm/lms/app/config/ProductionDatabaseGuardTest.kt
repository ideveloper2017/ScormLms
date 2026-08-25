package uz.scorm.lms.app.config

import io.mockk.every
import io.mockk.mockk
import kotlin.test.Test
import kotlin.test.assertFailsWith
import kotlin.test.assertFalse
import kotlin.test.assertTrue
import org.flywaydb.core.api.callback.Context
import org.flywaydb.core.api.callback.Event
import java.sql.Connection

class ProductionDatabaseGuardTest {

    @Test
    fun `expected production database is accepted`() {
        requireExpectedProductionDatabase("scorm_lms", "scorm_lms")
    }

    @Test
    fun `another application database is rejected`() {
        val error = assertFailsWith<IllegalArgumentException> {
            requireExpectedProductionDatabase("qms_queue", "scorm_lms")
        }

        assertTrue(error.message.orEmpty().contains("Noto'g'ri PostgreSQL database"))
    }

    @Test
    fun `unsafe configured database name is rejected`() {
        assertFailsWith<IllegalArgumentException> {
            requireExpectedProductionDatabase("scorm_lms", "scorm-lms;drop")
        }
    }

    @Test
    fun `flyway guard checks database before validation and migration`() {
        val callback = ProductionDatabaseNameFlywayCallback("scorm_lms")
        val connection = mockk<Connection>()
        val context = mockk<Context>()
        every { context.connection } returns connection
        every { connection.catalog } returns "qms_queue"

        assertTrue(callback.supports(Event.BEFORE_VALIDATE, context))
        assertTrue(callback.supports(Event.BEFORE_MIGRATE, context))
        assertFalse(callback.supports(Event.AFTER_MIGRATE, context))
        assertFailsWith<IllegalArgumentException> {
            callback.handle(Event.BEFORE_VALIDATE, context)
        }
    }
}
