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
        assertEquals("50", flyway.info().current()?.version?.toString())
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
            assertTrue(metadata.getTables(null, null, "quiz_questions", arrayOf("TABLE")).use { it.next() })
            assertTrue(metadata.getTables(null, null, "course_quizzes", arrayOf("TABLE")).use { it.next() })
            assertTrue(metadata.getTables(null, null, "course_quiz_questions", arrayOf("TABLE")).use { it.next() })
            assertTrue(metadata.getTables(null, null, "quiz_attempts", arrayOf("TABLE")).use { it.next() })
            assertTrue(metadata.getTables(null, null, "quiz_answers", arrayOf("TABLE")).use { it.next() })
            assertTrue(metadata.getTables(null, null, "exam_sessions", arrayOf("TABLE")).use { it.next() })
            assertTrue(metadata.getTables(null, null, "state_attestation_sessions", arrayOf("TABLE")).use { it.next() })
            assertTrue(metadata.getTables(null, null, "course_learning_sessions", arrayOf("TABLE")).use { it.next() })
            assertTrue(metadata.getTables(null, null, "learning_session_accesses", arrayOf("TABLE")).use { it.next() })
            assertTrue(metadata.getTables(null, null, "compliance_issues", arrayOf("TABLE")).use { it.next() })
            assertTrue(metadata.getTables(null, null, "surveys", arrayOf("TABLE")).use { it.next() })
            assertTrue(metadata.getTables(null, null, "survey_responses", arrayOf("TABLE")).use { it.next() })
            assertTrue(metadata.getTables(null, null, "proctoring_sessions", arrayOf("TABLE")).use { it.next() })
            assertTrue(metadata.getTables(null, null, "proctoring_events", arrayOf("TABLE")).use { it.next() })
            assertTrue(metadata.getTables(null, null, "course_quiz_proctors", arrayOf("TABLE")).use { it.next() })
            assertTrue(metadata.getTables(null, null, "proctoring_appeals", arrayOf("TABLE")).use { it.next() })
            assertTrue(metadata.getTables(null, null, "proctoring_appeal_events", arrayOf("TABLE")).use { it.next() })
            assertTrue(metadata.getTables(null, null, "course_content_revisions", arrayOf("TABLE")).use { it.next() })
            assertTrue(metadata.getTables(null, null, "course_content_reviews", arrayOf("TABLE")).use { it.next() })
            assertTrue(metadata.getTables(null, null, "course_forum_topics", arrayOf("TABLE")).use { it.next() })
            assertTrue(metadata.getTables(null, null, "course_forum_posts", arrayOf("TABLE")).use { it.next() })
            assertTrue(metadata.getTables(null, null, "course_forum_post_revisions", arrayOf("TABLE")).use { it.next() })
            assertTrue(metadata.getTables(null, null, "chat_conversations", arrayOf("TABLE")).use { it.next() })
            assertTrue(metadata.getTables(null, null, "chat_conversation_members", arrayOf("TABLE")).use { it.next() })
            assertTrue(metadata.getTables(null, null, "chat_messages", arrayOf("TABLE")).use { it.next() })
            assertTrue(metadata.getTables(null, null, "chat_message_receipts", arrayOf("TABLE")).use { it.next() })
            assertTrue(metadata.getTables(null, null, "announcements", arrayOf("TABLE")).use { it.next() })
            assertTrue(metadata.getTables(null, null, "announcement_deliveries", arrayOf("TABLE")).use { it.next() })
            assertTrue(metadata.getTables(null, null, "support_tickets", arrayOf("TABLE")).use { it.next() })
            assertTrue(metadata.getTables(null, null, "support_ticket_events", arrayOf("TABLE")).use { it.next() })
            assertTrue(metadata.getTables(null, null, "integration_outbox_events", arrayOf("TABLE")).use { it.next() })
            assertTrue(metadata.getTables(null, null, "hemis_sync_runs", arrayOf("TABLE")).use { it.next() })
            assertTrue(metadata.getTables(null, null, "hemis_sync_conflicts", arrayOf("TABLE")).use { it.next() })
            assertTrue(metadata.getTables(null, null, "integration_attempts", arrayOf("TABLE")).use { it.next() })
            assertTrue(metadata.getTables(null, null, "student_practice_placements", arrayOf("TABLE")).use { it.next() })
            assertTrue(metadata.getTables(null, null, "program_curriculum_versions", arrayOf("TABLE")).use { it.next() })
            assertTrue(metadata.getTables(null, null, "program_curriculum_subjects", arrayOf("TABLE")).use { it.next() })
            assertTrue(metadata.getTables(null, null, "student_lifecycle_events", arrayOf("TABLE")).use { it.next() })
            assertTrue(metadata.getTables(null, null, "distance_admission_policies", arrayOf("TABLE")).use { it.next() })
            assertTrue(metadata.getTables(null, null, "non_state_education_licenses", arrayOf("TABLE")).use { it.next() })
            assertTrue(metadata.getTables(null, null, "non_state_license_program_scopes", arrayOf("TABLE")).use { it.next() })
            assertTrue(metadata.getTables(null, null, "assessment_leave_evidence", arrayOf("TABLE")).use { it.next() })
            assertTrue(metadata.getTables(null, null, "foreign_teacher_engagements", arrayOf("TABLE")).use { it.next() })
            assertTrue(metadata.getTables(null, null, "foreign_teacher_engagement_courses", arrayOf("TABLE")).use { it.next() })
            assertTrue(metadata.getTables(null, null, "compliance_accountability_referrals", arrayOf("TABLE")).use { it.next() })
            assertTrue(metadata.getTables(null, null, "distance_program_restriction_catalogs", arrayOf("TABLE")).use { it.next() })
            assertTrue(metadata.getTables(null, null, "distance_program_restriction_entries", arrayOf("TABLE")).use { it.next() })
            assertTrue(metadata.getTables(null, null, "biometric_policies", arrayOf("TABLE")).use { it.next() })
            assertTrue(metadata.getTables(null, null, "biometric_consent_events", arrayOf("TABLE")).use { it.next() })
            assertTrue(metadata.getTables(null, null, "biometric_purge_records", arrayOf("TABLE")).use { it.next() })
            assertTrue(metadata.getTables(null, null, "distance_infrastructure_readiness_profiles", arrayOf("TABLE")).use { it.next() })
            assertTrue(metadata.getTables(null, null, "official_site_publications", arrayOf("TABLE")).use { it.next() })
            assertTrue(metadata.getTables(null, null, "content_standard_checklists", arrayOf("TABLE")).use { it.next() })
            assertTrue(metadata.getTables(null, null, "content_standard_assessments", arrayOf("TABLE")).use { it.next() })
            assertTrue(metadata.getTables(null, null, "video_conference_meetings", arrayOf("TABLE")).use { it.next() })
            assertTrue(metadata.getTables(null, null, "decision_559_uat_runs", arrayOf("TABLE")).use { it.next() })
            assertTrue(metadata.getTables(null, null, "decision_559_uat_evidence", arrayOf("TABLE")).use { it.next() })
            assertTrue(metadata.getTables(null, null, "decision_559_uat_evidence_files", arrayOf("TABLE")).use { it.next() })
            assertTrue(metadata.getTables(null, null, "decision_559_uat_manual_task_coordination", arrayOf("TABLE")).use { it.next() })

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
                "full_time_available",
                "full_time_basis_reference",
            )))
            val courseColumns = buildSet {
                metadata.getColumns(null, null, "courses", null).use { columns ->
                    while (columns.next()) add(columns.getString("COLUMN_NAME").lowercase())
                }
            }
            assertTrue(courseColumns.contains("subject_id"))
            val uatRunColumns = buildSet {
                metadata.getColumns(null, null, "decision_559_uat_runs", null).use { columns ->
                    while (columns.next()) add(columns.getString("COLUMN_NAME").lowercase())
                }
            }
            assertTrue(uatRunColumns.contains("protocol_evidence_set_sha256"))
            val uatEvidenceColumns = buildSet {
                metadata.getColumns(null, null, "decision_559_uat_evidence", null).use { columns ->
                    while (columns.next()) add(columns.getString("COLUMN_NAME").lowercase())
                }
            }
            assertTrue(uatEvidenceColumns.contains("manual_evidence_coverage"))
        }
    }

}
