package uz.scorm.lms.app.migration

import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Test
import org.springframework.core.io.ClassPathResource
import org.springframework.jdbc.datasource.init.ScriptUtils
import java.sql.DriverManager
import java.sql.SQLException

class ProctoringIdentityRecheckMigrationTest {
    @Test
    fun `server identity events are allowed, existing types kept, unknown types still rejected`() {
        DriverManager.getConnection("jdbc:h2:mem:identity-recheck-${System.nanoTime()};MODE=PostgreSQL", "sa", "").use { connection ->
            connection.createStatement().use { sql ->
                sql.execute("CREATE TABLE proctoring_events(type VARCHAR(32), CONSTRAINT ck_proctoring_event_type CHECK(type IN ('HEARTBEAT')))")
                sql.execute("INSERT INTO proctoring_events VALUES('HEARTBEAT')")
            }
            ScriptUtils.executeSqlScript(connection, ClassPathResource("db/migration/V78__proctoring_identity_recheck_events.sql"))
            connection.createStatement().use { sql ->
                sql.execute(
                    "INSERT INTO proctoring_events VALUES('IDENTITY_VERIFIED'), ('IDENTITY_MISMATCH'), ('IDENTITY_FACE_NOT_FOUND'), " +
                        "('IDENTITY_MULTIPLE_FACES'), ('IDENTITY_CHECKS_MISSING'), ('AUDIO_ACTIVITY'), ('PAGE_EXIT')"
                )
                assertThrows(SQLException::class.java) { sql.execute("INSERT INTO proctoring_events VALUES('AUTOMATIC_CHEATING_VERDICT')") }
            }
        }
    }
}
