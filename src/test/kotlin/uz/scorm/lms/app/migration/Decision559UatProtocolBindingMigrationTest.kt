package uz.scorm.lms.app.migration

import org.flywaydb.core.Flyway
import org.flywaydb.core.api.MigrationVersion
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import java.sql.DriverManager
import java.sql.SQLException

class Decision559UatProtocolBindingMigrationTest {
    @Test
    fun `V47 editable runni schema v4ga ko'taradi va yakuniy eski kontraktni saqlaydi`() {
        val url = "jdbc:h2:mem:v47-upgrade-${System.nanoTime()};MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DEFAULT_NULL_ORDERING=HIGH;DB_CLOSE_DELAY=-1"
        Flyway.configure()
            .dataSource(url, "sa", "")
            .locations("classpath:db/migration")
            .target(MigrationVersion.fromVersion("46"))
            .load()
            .migrate()

        DriverManager.getConnection(url, "sa", "").use { connection ->
            connection.createStatement().use { statement ->
                statement.executeUpdate(
                    """
                    INSERT INTO decision_559_uat_runs(id, title, source_sha256, status, manifest_schema_version)
                    VALUES
                      (9930, 'Approved schema v2', '${"A".repeat(64)}', 'APPROVED', 2),
                      (9931, 'In review schema v3', '${"A".repeat(64)}', 'IN_REVIEW', 3),
                      (9932, 'Editable schema v3', '${"A".repeat(64)}', 'DRAFT', 3),
                      (9933, 'Rejected schema v3', '${"A".repeat(64)}', 'REJECTED', 3)
                    """.trimIndent(),
                )
            }
        }

        val result = Flyway.configure().dataSource(url, "sa", "")
            .locations("classpath:db/migration")
            .target(MigrationVersion.fromVersion("47"))
            .load()
            .migrate()
        assertEquals("47", result.targetSchemaVersion)

        DriverManager.getConnection(url, "sa", "").use { connection ->
            connection.createStatement().use { statement ->
                statement.executeQuery(
                    "SELECT id, manifest_schema_version FROM decision_559_uat_runs WHERE id BETWEEN 9930 AND 9933 ORDER BY id",
                ).use { rows ->
                    val versions = linkedMapOf<Long, Int>()
                    while (rows.next()) versions[rows.getLong(1)] = rows.getInt(2)
                    assertEquals(mapOf(9930L to 2, 9931L to 3, 9932L to 4, 9933L to 4), versions)
                }
                statement.executeUpdate(
                    "INSERT INTO decision_559_uat_runs(id, title, source_sha256) VALUES (9934, 'New schema v4', '${"A".repeat(64)}')",
                )
                statement.executeQuery(
                    "SELECT manifest_schema_version FROM decision_559_uat_runs WHERE id = 9934",
                ).use { rows -> assertTrue(rows.next()); assertEquals(4, rows.getInt(1)) }
                statement.executeUpdate(
                    "UPDATE decision_559_uat_runs SET protocol_evidence_set_sha256 = '${"a".repeat(64)}' WHERE id = 9934",
                )
                assertThrows(SQLException::class.java) {
                    statement.executeUpdate(
                        "UPDATE decision_559_uat_runs SET protocol_evidence_set_sha256 = 'NOT-A-SHA' WHERE id = 9934",
                    )
                }
            }
        }
    }
}
