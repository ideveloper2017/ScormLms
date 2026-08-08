package uz.scorm.lms.app.migration

import org.flywaydb.core.Flyway
import org.flywaydb.core.api.MigrationVersion
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import java.sql.DriverManager

class Decision559UatManualEvidenceCoverageMigrationTest {
    @Test
    fun `V48 editable runni schema v5ga ko'taradi va final eski kontraktlarni saqlaydi`() {
        val url = "jdbc:h2:mem:v48-upgrade-${System.nanoTime()};MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DEFAULT_NULL_ORDERING=HIGH;DB_CLOSE_DELAY=-1"
        Flyway.configure()
            .dataSource(url, "sa", "")
            .locations("classpath:db/migration")
            .target(MigrationVersion.fromVersion("47"))
            .load()
            .migrate()

        DriverManager.getConnection(url, "sa", "").use { connection ->
            connection.createStatement().use { statement ->
                statement.executeUpdate(
                    "INSERT INTO users(id, username, password_hash, status) VALUES (9940, 'v48-user', 'test', 'ACTIVE')",
                )
                statement.executeUpdate(
                    """
                    INSERT INTO decision_559_uat_runs(id, title, source_sha256, status, manifest_schema_version)
                    VALUES
                      (9940, 'Approved schema v4', '${"A".repeat(64)}', 'APPROVED', 4),
                      (9941, 'In review schema v4', '${"A".repeat(64)}', 'IN_REVIEW', 4),
                      (9942, 'Editable schema v4', '${"A".repeat(64)}', 'DRAFT', 4),
                      (9943, 'Rejected schema v4', '${"A".repeat(64)}', 'REJECTED', 4)
                    """.trimIndent(),
                )
                statement.executeUpdate(
                    """
                    INSERT INTO decision_559_uat_evidence(
                        id, run_id, requirement_id, band, outcome, owner_name, summary,
                        evidence_reference, submitted_by, submitted_at, review_status,
                        review_notes, reviewed_by, reviewed_at
                    ) VALUES (
                        9950, 9942, 'UAT-559-08', 8, 'AUTOMATED_PASS', 'Legacy owner',
                        'Old accepted evidence without checklist coverage', 'OLD-REPORT',
                        9940, CURRENT_TIMESTAMP, 'ACCEPTED', 'Old review', 9940, CURRENT_TIMESTAMP
                    )
                    """.trimIndent(),
                )
            }
        }

        val result = Flyway.configure().dataSource(url, "sa", "")
            .locations("classpath:db/migration")
            .target(MigrationVersion.fromVersion("48"))
            .load()
            .migrate()
        assertEquals("48", result.targetSchemaVersion)

        DriverManager.getConnection(url, "sa", "").use { connection ->
            connection.createStatement().use { statement ->
                statement.executeQuery(
                    "SELECT id, manifest_schema_version FROM decision_559_uat_runs WHERE id BETWEEN 9940 AND 9943 ORDER BY id",
                ).use { rows ->
                    val versions = linkedMapOf<Long, Int>()
                    while (rows.next()) versions[rows.getLong(1)] = rows.getInt(2)
                    assertEquals(mapOf(9940L to 4, 9941L to 4, 9942L to 5, 9943L to 5), versions)
                }
                statement.executeUpdate(
                    "INSERT INTO decision_559_uat_runs(id, title, source_sha256) VALUES (9944, 'New schema v5', '${"A".repeat(64)}')",
                )
                statement.executeQuery(
                    "SELECT manifest_schema_version FROM decision_559_uat_runs WHERE id = 9944",
                ).use { rows -> assertTrue(rows.next()); assertEquals(5, rows.getInt(1)) }
                statement.executeQuery(
                    "SELECT review_status, review_notes, reviewed_by, manual_evidence_coverage FROM decision_559_uat_evidence WHERE id = 9950",
                ).use { rows ->
                    assertTrue(rows.next())
                    assertEquals("PENDING", rows.getString(1))
                    assertEquals(null, rows.getString(2))
                    assertEquals(null, rows.getObject(3))
                    assertEquals("", rows.getString(4))
                }
            }
            val coverageColumn = connection.metaData.getColumns(
                null, null, "decision_559_uat_evidence", "manual_evidence_coverage",
            ).use { columns -> columns.next() }
            assertTrue(coverageColumn)
        }
    }
}
