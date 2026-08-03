package uz.scorm.lms.app

import org.flywaydb.core.Flyway
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.ActiveProfiles
import javax.sql.DataSource

@SpringBootTest
@ActiveProfiles("test")
class ScromLmsProjectsApplicationTests {

    @Autowired
    private lateinit var flyway: Flyway

    @Autowired
    private lateinit var dataSource: DataSource

    @Test
    fun contextLoads() {
        assertEquals("6", flyway.info().current()?.version?.toString())
        flyway.validate()

        dataSource.connection.use { connection ->
            val metadata = connection.metaData
            assertTrue(metadata.getTables(null, null, "programs", arrayOf("TABLE")).use { it.next() })
            assertTrue(metadata.getTables(null, null, "scorm_packages", arrayOf("TABLE")).use { it.next() })
            assertTrue(metadata.getTables(null, null, "scorm_attempts", arrayOf("TABLE")).use { it.next() })
            assertTrue(metadata.getTables(null, null, "course_enrollments", arrayOf("TABLE")).use { it.next() })
            assertTrue(metadata.getTables(null, null, "course_modules", arrayOf("TABLE")).use { it.next() })
            assertTrue(metadata.getTables(null, null, "course_contents", arrayOf("TABLE")).use { it.next() })
            assertTrue(metadata.getTables(null, null, "course_content_progress", arrayOf("TABLE")).use { it.next() })
            assertTrue(metadata.getTables(null, null, "course_attendance_sessions", arrayOf("TABLE")).use { it.next() })
            assertTrue(metadata.getTables(null, null, "learning_activity_events", arrayOf("TABLE")).use { it.next() })
            assertTrue(metadata.getTables(null, null, "course_assignments", arrayOf("TABLE")).use { it.next() })
            assertTrue(metadata.getTables(null, null, "assignment_submissions", arrayOf("TABLE")).use { it.next() })

            val programColumns = buildSet {
                metadata.getColumns(null, null, "programs", null).use { columns ->
                    while (columns.next()) add(columns.getString("COLUMN_NAME").lowercase())
                }
            }
            assertTrue(programColumns.containsAll(setOf(
                "distance_enabled",
                "information_technology_program",
                "education_language",
                "distance_admission_limit",
                "license_reference",
            )))
        }
    }

}
