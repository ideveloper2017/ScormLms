package uz.scorm.lms.app.migration

import org.flywaydb.core.Flyway
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import org.testcontainers.containers.PostgreSQLContainer
import org.testcontainers.junit.jupiter.Container
import org.testcontainers.junit.jupiter.Testcontainers
import java.sql.DriverManager

@Testcontainers(disabledWithoutDocker = true)
class PostgresFlywayMigrationTest {

    companion object {
        @Container
        @JvmField
        val postgres = PostgreSQLContainer<Nothing>("postgres:16-alpine")
    }

    @Test
    fun `baseline migratsiyasi toza PostgreSQL bazasida ishlaydi`() {
        val flyway = Flyway.configure()
            .dataSource(postgres.jdbcUrl, postgres.username, postgres.password)
            .locations("classpath:db/migration")
            .baselineOnMigrate(false)
            .load()

        val result = flyway.migrate()
        assertEquals("18", result.targetSchemaVersion)
        flyway.validate()

        DriverManager.getConnection(postgres.jdbcUrl, postgres.username, postgres.password).use { connection ->
            val tables = buildSet {
                connection.metaData.getTables(null, "public", null, arrayOf("TABLE")).use { rows ->
                    while (rows.next()) add(rows.getString("TABLE_NAME").lowercase())
                }
            }
            assertTrue(tables.containsAll(setOf(
                "programs",
                "students",
                "courses",
                "course_enrollments",
                "course_modules",
                "course_contents",
                "course_content_progress",
                "course_attendance_sessions",
                "learning_activity_events",
                "course_assignments",
                "assignment_submissions",
                "quiz_questions",
                "course_quizzes",
                "course_quiz_questions",
                "quiz_attempts",
                "quiz_answers",
                "exam_sessions",
                "state_attestation_sessions",
                "course_learning_sessions",
                "learning_session_accesses",
                "compliance_issues",
                "surveys",
                "survey_questions",
                "survey_responses",
                "survey_answers",
                "proctoring_sessions",
                "proctoring_events",
                "course_quiz_proctors",
                "proctoring_appeals",
                "proctoring_appeal_events",
                "course_content_revisions",
                "course_content_reviews",
                "scorm_packages",
                "scorm_attempts",
                "flyway_schema_history",
            )))
        }
    }
}
