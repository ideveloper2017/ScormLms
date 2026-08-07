package uz.scorm.lms.app.migration

import org.flywaydb.core.Flyway
import org.flywaydb.core.api.MigrationVersion
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import java.sql.DriverManager
import java.sql.SQLException

class Decision559UatAcceptanceMigrationTest {
    @Test
    fun `V45 UAT jadvallari va band cheklovlarini yaratadi`() {
        val url = "jdbc:h2:mem:v45-upgrade-${System.nanoTime()};MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DEFAULT_NULL_ORDERING=HIGH;DB_CLOSE_DELAY=-1"
        Flyway.configure()
            .dataSource(url, "sa", "")
            .locations("classpath:db/migration")
            .target(MigrationVersion.fromVersion("44"))
            .load()
            .migrate()

        val upgraded = Flyway.configure().dataSource(url, "sa", "")
            .locations("classpath:db/migration")
            .target(MigrationVersion.fromVersion("45"))
            .load()
        assertEquals("45", upgraded.migrate().targetSchemaVersion)
        upgraded.validate()

        DriverManager.getConnection(url, "sa", "").use { connection ->
            val tables = connection.metaData
            assertTrue(tables.getTables(null, null, "decision_559_uat_runs", arrayOf("TABLE")).use { it.next() })
            assertTrue(tables.getTables(null, null, "decision_559_uat_evidence", arrayOf("TABLE")).use { it.next() })
            connection.createStatement().use { statement ->
                statement.executeUpdate(
                    """
                    INSERT INTO decision_559_uat_runs(id, title, source_sha256)
                    VALUES (9901, 'V45 test', '${"A".repeat(64)}')
                    """.trimIndent(),
                )
                assertThrows(SQLException::class.java) {
                    statement.executeUpdate(
                        """
                        INSERT INTO decision_559_uat_evidence(
                            run_id, requirement_id, band, outcome, owner_name, summary,
                            submitted_by, submitted_at, review_status
                        ) VALUES (9901, 'UAT-559-07', 7, 'AUTOMATED_PASS', 'owner', 'summary',
                            1, CURRENT_TIMESTAMP, 'PENDING')
                        """.trimIndent(),
                    )
                }
            }
        }
    }
}
