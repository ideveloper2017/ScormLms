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
        assertEquals("70", result.targetSchemaVersion)
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
                "course_forum_topics",
                "course_forum_posts",
                "course_forum_post_revisions",
                "chat_conversations",
                "chat_conversation_members",
                "chat_messages",
                "chat_message_receipts",
                "announcements",
                "announcement_deliveries",
                "support_tickets",
                "support_ticket_events",
                "integration_outbox_events",
                "integration_attempts",
                "hemis_sync_runs",
                "hemis_sync_control",
                "hemis_group_mappings",
                "hemis_sync_items",
                "hemis_sync_conflicts",
                "scorm_packages",
                "scorm_attempts",
                "student_practice_placements",
                "program_curriculum_versions",
                "program_curriculum_subjects",
                "student_lifecycle_events",
                "distance_admission_policies",
                "non_state_education_licenses",
                "non_state_license_program_scopes",
                "assessment_leave_evidence",
                "foreign_teacher_engagements",
                "foreign_teacher_engagement_courses",
                "compliance_accountability_referrals",
                "distance_program_restriction_catalogs",
                "distance_program_restriction_entries",
                "biometric_policies",
                "biometric_consent_events",
                "biometric_purge_records",
                "distance_infrastructure_readiness_profiles",
                "official_site_publications",
                "content_standard_checklists",
                "content_standard_criteria",
                "content_standard_assessments",
                "content_standard_assessment_responses",
                "video_conference_meetings",
                "decision_559_uat_runs",
                "decision_559_uat_evidence",
                "classifier_import_runs",
                "classifier_import_control",
                "country_classifiers",
                "region_classifiers",
                "district_classifiers",
                "subject_categories",
                "subject_syllabi",
                "curriculum_semester_periods",
                "curriculum_student_assignments",
                "universities",
                "reference_labels",
                "nationalities",
                "system_languages",
                "system_settings",
                "translation_messages",
                "rating_systems",
                "final_exam_call_letters",
                "student_transcripts",
                "re_reading_plans",
                "re_reading_applications",
                "tutor_groups",
                "flyway_schema_history",
            )))
            val courseColumns = buildSet {
                connection.metaData.getColumns(null, "public", "courses", null).use { rows ->
                    while (rows.next()) add(rows.getString("COLUMN_NAME").lowercase())
                }
            }
            assertTrue(courseColumns.contains("subject_id"))
            val subjectColumns = buildSet {
                connection.metaData.getColumns(null, "public", "subjects", null).use { rows ->
                    while (rows.next()) add(rows.getString("COLUMN_NAME").lowercase())
                }
            }
            assertTrue(subjectColumns.containsAll(setOf("subject_category_id", "subject_type", "name_en", "name_ru", "name_kaa", "name_uz_cyrillic")))
            val programColumns = buildSet {
                connection.metaData.getColumns(null, "public", "programs", null).use { rows ->
                    while (rows.next()) add(rows.getString("COLUMN_NAME").lowercase())
                }
            }
            assertTrue(programColumns.containsAll(setOf("full_time_available", "full_time_basis_reference")))
        }
    }
}
