package uz.scorm.lms.app.migration

import org.flywaydb.core.Flyway
import org.flywaydb.core.api.MigrationVersion
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Test
import java.sql.DriverManager
import java.sql.SQLException

class FullTimeCounterpartMigrationTest {

    @Test
    fun `V43 legacy dastur dalilini uydirmaydi va yangi yozuvni fail closed qiladi`() {
        val url = "jdbc:h2:mem:v43-upgrade-${System.nanoTime()};MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DEFAULT_NULL_ORDERING=HIGH;DB_CLOSE_DELAY=-1"
        Flyway.configure()
            .dataSource(url, "sa", "")
            .locations("classpath:db/migration")
            .target(MigrationVersion.fromVersion("42"))
            .load()
            .migrate()

        DriverManager.getConnection(url, "sa", "").use { connection ->
            connection.createStatement().use { statement ->
                statement.executeUpdate(
                    """
                    INSERT INTO programs(name, code, degree_level, active, distance_enabled,
                        information_technology_program, education_language, deleted)
                    VALUES ('Legacy masofaviy', 'LEGACY-V43', 'BACHELOR', TRUE, TRUE, FALSE, 'uz', FALSE)
                    """.trimIndent(),
                )
            }
        }

        val upgraded = Flyway.configure()
            .dataSource(url, "sa", "")
            .locations("classpath:db/migration")
            .target(MigrationVersion.fromVersion("43"))
            .load()
        assertEquals("43", upgraded.migrate().targetSchemaVersion)
        upgraded.validate()

        DriverManager.getConnection(url, "sa", "").use { connection ->
            connection.createStatement().use { statement ->
                statement.executeQuery(
                    "SELECT full_time_available, full_time_basis_reference FROM programs WHERE code = 'LEGACY-V43'",
                ).use { row ->
                    row.next()
                    assertNull(row.getObject("full_time_available"))
                    assertNull(row.getString("full_time_basis_reference"))
                }

                assertThrows(SQLException::class.java) {
                    statement.executeUpdate(
                        """
                        INSERT INTO programs(name, code, degree_level, active, distance_enabled,
                            information_technology_program, education_language, deleted)
                        VALUES ('Yangi dalilsiz', 'NEW-NO-EVIDENCE', 'MASTER', TRUE, TRUE, FALSE, 'uz', FALSE)
                        """.trimIndent(),
                    )
                }

                assertEquals(1, statement.executeUpdate(
                    """
                    INSERT INTO programs(name, code, degree_level, active, distance_enabled,
                        information_technology_program, education_language, deleted)
                    VALUES ('AKT istisnosi', 'NEW-ICT', 'BACHELOR', TRUE, TRUE, TRUE, 'uz', FALSE)
                    """.trimIndent(),
                ))

                assertEquals(1, statement.executeUpdate(
                    """
                    UPDATE programs
                    SET full_time_available = TRUE, full_time_basis_reference = 'BUYRUQ-3/2026'
                    WHERE code = 'LEGACY-V43'
                    """.trimIndent(),
                ))
            }
        }
    }
}
