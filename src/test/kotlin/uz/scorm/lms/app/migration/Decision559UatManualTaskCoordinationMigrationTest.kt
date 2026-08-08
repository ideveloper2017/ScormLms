package uz.scorm.lms.app.migration

import org.flywaydb.core.Flyway
import org.flywaydb.core.api.MigrationVersion
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import java.sql.DriverManager
import java.sql.SQLException
import java.time.LocalDate

class Decision559UatManualTaskCoordinationMigrationTest {
    @Test
    fun `V49 manual topshiriq koordinatsiyasini unique va foreign key bilan yaratadi`() {
        val url = "jdbc:h2:mem:v49-upgrade-${System.nanoTime()};MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DEFAULT_NULL_ORDERING=HIGH;DB_CLOSE_DELAY=-1"
        Flyway.configure()
            .dataSource(url, "sa", "")
            .locations("classpath:db/migration")
            .target(MigrationVersion.fromVersion("48"))
            .load()
            .migrate()

        DriverManager.getConnection(url, "sa", "").use { connection ->
            connection.createStatement().use { statement ->
                statement.executeUpdate(
                    "INSERT INTO users(id, username, password_hash, status) VALUES (9960, 'v49-user', 'test', 'ACTIVE')",
                )
                statement.executeUpdate(
                    "INSERT INTO decision_559_uat_runs(id, title, source_sha256) VALUES (9960, 'V49 coordination', '${"A".repeat(64)}')",
                )
            }
        }

        val result = Flyway.configure().dataSource(url, "sa", "")
            .locations("classpath:db/migration")
            .target(MigrationVersion.fromVersion("49"))
            .load()
            .migrate()
        assertEquals("49", result.targetSchemaVersion)

        DriverManager.getConnection(url, "sa", "").use { connection ->
            connection.createStatement().use { statement ->
                statement.executeUpdate(
                    """
                    INSERT INTO decision_559_uat_manual_task_coordination(
                        id, run_id, requirement_id, band, item_index, assignee_name, due_date, note, coordinated_by
                    ) VALUES (
                        9960, 9960, 'UAT-559-08', 8, 0, 'IT bo''limi', DATE '2026-08-20',
                        'Inventar dalili yig''iladi', 9960
                    )
                    """.trimIndent(),
                )
                statement.executeQuery(
                    "SELECT assignee_name, due_date, note, coordinated_by FROM decision_559_uat_manual_task_coordination WHERE id = 9960",
                ).use { rows ->
                    assertTrue(rows.next())
                    assertEquals("IT bo'limi", rows.getString(1))
                    assertEquals(LocalDate.of(2026, 8, 20), rows.getObject(2, LocalDate::class.java))
                    assertEquals("Inventar dalili yig'iladi", rows.getString(3))
                    assertEquals(9960L, rows.getLong(4))
                }
                assertThrows(SQLException::class.java) {
                    statement.executeUpdate(
                        """
                        INSERT INTO decision_559_uat_manual_task_coordination(
                            run_id, requirement_id, band, item_index, assignee_name, due_date, note, coordinated_by
                        ) VALUES (9960, 'UAT-559-08', 8, 0, 'Takror', DATE '2026-08-21', 'Takror yozuv', 9960)
                        """.trimIndent(),
                    )
                }
            }
            val tableExists = connection.metaData.getTables(
                null, null, "decision_559_uat_manual_task_coordination", arrayOf("TABLE"),
            ).use { tables -> tables.next() }
            assertTrue(tableExists)
        }
    }
}
