package uz.scorm.lms.app.migration

import org.flywaydb.core.Flyway
import org.flywaydb.core.api.MigrationVersion
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import java.sql.DriverManager
import java.sql.SQLException

class ForeignStudentOnsiteExceptionMigrationTest {

    @Test
    fun `V44 xorijiy talabaning onsite talablarini olib tashlaydi va tarixiy dalil uydirmaydi`() {
        val url = "jdbc:h2:mem:v44-upgrade-${System.nanoTime()};MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DEFAULT_NULL_ORDERING=HIGH;DB_CLOSE_DELAY=-1"
        Flyway.configure()
            .dataSource(url, "sa", "")
            .locations("classpath:db/migration")
            .target(MigrationVersion.fromVersion("43"))
            .load()
            .migrate()

        DriverManager.getConnection(url, "sa", "").use { connection ->
            connection.createStatement().use { statement ->
                statement.executeUpdate(
                    """
                    INSERT INTO users(id, username, password_hash, status)
                    VALUES (9001, 'v44-teacher', 'x', 'ACTIVE'),
                           (9002, 'v44-domestic', 'x', 'ACTIVE'),
                           (9003, 'v44-foreign', 'x', 'ACTIVE')
                    """.trimIndent(),
                )
                statement.executeUpdate(
                    """
                    INSERT INTO students(id, user_id, pinfl, last_name, first_name, birth_date, gender,
                        citizenship, student_number, degree_level, education_form, student_status,
                        lms_orientation_required)
                    VALUES (9102, 9002, '90000000009102', 'Test', 'Domestic', DATE '2000-01-01', 'MALE',
                            'UZBEKISTAN', 'V44-DOM', 'BACHELOR', 'DISTANCE', 'ACTIVE', TRUE),
                           (9103, 9003, '90000000009103', 'Test', 'Foreign', DATE '2000-01-01', 'MALE',
                            'OTHER', 'V44-FOR', 'BACHELOR', 'DISTANCE', 'ACTIVE', TRUE)
                    """.trimIndent(),
                )
                statement.executeUpdate(
                    """
                    INSERT INTO courses(id, title, user_id, status, deleted)
                    VALUES (9201, 'V44 course', 9001, 'published', FALSE)
                    """.trimIndent(),
                )
                statement.executeUpdate(
                    """
                    INSERT INTO course_enrollments(id, course_id, student_id)
                    VALUES (9302, 9201, 9102), (9303, 9201, 9103)
                    """.trimIndent(),
                )
                statement.executeUpdate(
                    """
                    INSERT INTO exam_sessions(id, course_id, title, exam_date, exam_time, location, examiner_id)
                    VALUES (9401, 9201, 'V44 final', DATE '2026-08-07', TIME '10:00:00', '101', 9001)
                    """.trimIndent(),
                )
                statement.executeUpdate(
                    """
                    INSERT INTO exam_attendance(id, exam_session_id, enrollment_id)
                    VALUES (9502, 9401, 9302), (9503, 9401, 9303)
                    """.trimIndent(),
                )
                statement.executeUpdate(
                    """
                    INSERT INTO state_attestation_sessions(id, course_id, title, exam_date, exam_time,
                        location, commission_chair_id)
                    VALUES (9601, 9201, 'V44 defense', DATE '2026-08-07', TIME '11:00:00', 'Hall', 9001)
                    """.trimIndent(),
                )
                statement.executeUpdate(
                    """
                    INSERT INTO student_defenses(id, attestation_session_id, enrollment_id, defense_status)
                    VALUES (9702, 9601, 9302, 'DEFENDED'), (9703, 9601, 9303, 'DEFENDED')
                    """.trimIndent(),
                )
            }
        }

        val upgraded = Flyway.configure().dataSource(url, "sa", "")
            .locations("classpath:db/migration")
            .target(MigrationVersion.fromVersion("44"))
            .load()
        assertEquals("44", upgraded.migrate().targetSchemaVersion)
        upgraded.validate()

        DriverManager.getConnection(url, "sa", "").use { connection ->
            connection.createStatement().use { statement ->
                statement.executeQuery(
                    """
                    SELECT s.citizenship, s.lms_orientation_required,
                           ea.onsite_attendance_required AS exam_required,
                           sd.onsite_attendance_required AS defense_required,
                           sd.onsite_attendance_confirmed_at
                    FROM students s
                    JOIN course_enrollments ce ON ce.student_id = s.id
                    JOIN exam_attendance ea ON ea.enrollment_id = ce.id
                    JOIN student_defenses sd ON sd.enrollment_id = ce.id
                    ORDER BY s.citizenship DESC
                    """.trimIndent(),
                ).use { rows ->
                    assertTrue(rows.next())
                    assertEquals("UZBEKISTAN", rows.getString("citizenship"))
                    assertTrue(rows.getBoolean("lms_orientation_required"))
                    assertTrue(rows.getBoolean("exam_required"))
                    assertTrue(rows.getBoolean("defense_required"))
                    assertNull(rows.getTimestamp("onsite_attendance_confirmed_at"))

                    assertTrue(rows.next())
                    assertEquals("OTHER", rows.getString("citizenship"))
                    assertFalse(rows.getBoolean("lms_orientation_required"))
                    assertFalse(rows.getBoolean("exam_required"))
                    assertFalse(rows.getBoolean("defense_required"))
                    assertNull(rows.getTimestamp("onsite_attendance_confirmed_at"))
                }

                assertThrows(SQLException::class.java) {
                    statement.executeUpdate(
                        "UPDATE students SET lms_orientation_required = TRUE WHERE id = 9103",
                    )
                }
            }
        }
    }
}
