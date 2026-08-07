package uz.scorm.lms.app.migration

import org.flywaydb.core.Flyway
import org.flywaydb.core.api.MigrationVersion
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import java.sql.DriverManager
import java.sql.SQLException

class Decision559UatMultiAttachmentMigrationTest {
    @Test
    fun `V46 eski faylni backfill qiladi va imzolangan schema v2 hash kontraktini saqlaydi`() {
        val url = "jdbc:h2:mem:v46-upgrade-${System.nanoTime()};MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DEFAULT_NULL_ORDERING=HIGH;DB_CLOSE_DELAY=-1"
        Flyway.configure()
            .dataSource(url, "sa", "")
            .locations("classpath:db/migration")
            .target(MigrationVersion.fromVersion("45"))
            .load()
            .migrate()

        DriverManager.getConnection(url, "sa", "").use { connection ->
            connection.createStatement().use { statement ->
                statement.executeUpdate(
                    "INSERT INTO users(id, username, password_hash, status) VALUES (1, 'v46-user', 'test', 'ACTIVE')",
                )
                statement.executeUpdate(
                    """
                    INSERT INTO decision_559_uat_runs(id, title, source_sha256, status)
                    VALUES
                      (9910, 'Approved legacy', '${"A".repeat(64)}', 'APPROVED'),
                      (9911, 'Editable legacy', '${"A".repeat(64)}', 'DRAFT')
                    """.trimIndent(),
                )
                statement.executeUpdate(
                    """
                    INSERT INTO decision_559_uat_evidence(
                        id, run_id, requirement_id, band, outcome, owner_name, summary,
                        storage_name, original_name, content_type, size_bytes, sha256,
                        submitted_by, submitted_at, review_status
                    ) VALUES (
                        9920, 9910, 'UAT-559-03', 3, 'MANUAL_PASS', 'owner', 'legacy evidence summary',
                        'legacy.pdf', 'legacy-original.pdf', 'application/pdf', 12, '${"a".repeat(64)}',
                        1, CURRENT_TIMESTAMP, 'ACCEPTED'
                    )
                    """.trimIndent(),
                )
            }
        }

        val result = Flyway.configure().dataSource(url, "sa", "")
            .locations("classpath:db/migration")
            .target(MigrationVersion.fromVersion("46"))
            .load()
            .migrate()
        assertEquals("46", result.targetSchemaVersion)

        DriverManager.getConnection(url, "sa", "").use { connection ->
            assertTrue(connection.metaData.getTables(
                null, null, "decision_559_uat_evidence_files", arrayOf("TABLE"),
            ).use { it.next() })
            connection.createStatement().use { statement ->
                statement.executeQuery(
                    "SELECT manifest_schema_version FROM decision_559_uat_runs WHERE id = 9910",
                ).use { rows -> assertTrue(rows.next()); assertEquals(2, rows.getInt(1)) }
                statement.executeQuery(
                    "SELECT manifest_schema_version FROM decision_559_uat_runs WHERE id = 9911",
                ).use { rows -> assertTrue(rows.next()); assertEquals(3, rows.getInt(1)) }
                statement.executeQuery(
                    "SELECT original_name, sha256 FROM decision_559_uat_evidence_files WHERE evidence_id = 9920",
                ).use { rows ->
                    assertTrue(rows.next())
                    assertEquals("legacy-original.pdf", rows.getString(1))
                    assertEquals("a".repeat(64), rows.getString(2))
                }
                statement.executeUpdate(
                    "INSERT INTO decision_559_uat_runs(id, title, source_sha256) VALUES (9912, 'New v3', '${"A".repeat(64)}')",
                )
                statement.executeQuery(
                    "SELECT manifest_schema_version FROM decision_559_uat_runs WHERE id = 9912",
                ).use { rows -> assertTrue(rows.next()); assertEquals(3, rows.getInt(1)) }
                assertThrows(SQLException::class.java) {
                    statement.executeUpdate(
                        """
                        INSERT INTO decision_559_uat_evidence_files(
                            evidence_id, storage_name, original_name, content_type, size_bytes, sha256,
                            uploaded_by, uploaded_at
                        ) VALUES (9920, 'bad.exe', 'bad.exe', 'application/octet-stream', 4,
                            '${"b".repeat(64)}', 1, CURRENT_TIMESTAMP)
                        """.trimIndent(),
                    )
                }
            }
        }
    }
}
