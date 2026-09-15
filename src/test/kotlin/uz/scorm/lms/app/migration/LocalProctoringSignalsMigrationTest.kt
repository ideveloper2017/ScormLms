package uz.scorm.lms.app.migration

import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Test
import org.springframework.core.io.ClassPathResource
import org.springframework.jdbc.datasource.init.ScriptUtils
import java.sql.DriverManager
import java.sql.SQLException

class LocalProctoringSignalsMigrationTest {
    @Test
    fun `upgrade preserves opt out and allows only known local events`() {
        DriverManager.getConnection("jdbc:h2:mem:local-proctor-${System.nanoTime()};MODE=PostgreSQL", "sa", "").use { connection ->
            connection.createStatement().use { sql ->
                sql.execute("CREATE TABLE biometric_policies(id BIGINT PRIMARY KEY)")
                sql.execute("INSERT INTO biometric_policies VALUES(1)")
                sql.execute("CREATE TABLE proctoring_events(type VARCHAR(32), CONSTRAINT ck_proctoring_event_type CHECK(type IN ('HEARTBEAT')))")
            }
            ScriptUtils.executeSqlScript(connection, ClassPathResource("db/migration/V75__local_proctoring_signals.sql"))
            connection.createStatement().use { sql ->
                sql.executeQuery("SELECT local_monitoring_enabled FROM biometric_policies WHERE id=1").use { rows -> rows.next(); assertFalse(rows.getBoolean(1)) }
                sql.execute("INSERT INTO proctoring_events VALUES('AUDIO_ACTIVITY'), ('HEAD_TURNED'), ('HEARTBEAT')")
                assertThrows(SQLException::class.java) { sql.execute("INSERT INTO proctoring_events VALUES('AUTOMATIC_CHEATING_VERDICT')") }
            }
        }
    }
}
