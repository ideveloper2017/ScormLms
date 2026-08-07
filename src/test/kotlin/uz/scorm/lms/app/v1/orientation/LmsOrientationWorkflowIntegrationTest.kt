package uz.scorm.lms.app.v1.orientation

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.ActiveProfiles
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.courses.model.Course
import uz.scorm.lms.app.v1.courses.model.CourseStatus
import uz.scorm.lms.app.v1.courses.repository.CourseRepository
import uz.scorm.lms.app.v1.courses.service.CourseEnrollmentService
import uz.scorm.lms.app.v1.orientation.dto.CreateLmsOrientationRequest
import uz.scorm.lms.app.v1.orientation.model.LmsOrientationAttendanceStatus
import uz.scorm.lms.app.v1.orientation.service.LmsOrientationService
import uz.scorm.lms.app.v1.student.model.EducationForm
import uz.scorm.lms.app.v1.student.model.Gender
import uz.scorm.lms.app.v1.student.model.StudentProfile
import uz.scorm.lms.app.v1.student.repository.StudentRepository
import uz.scorm.lms.app.v1.user.model.User
import uz.scorm.lms.app.v1.user.repository.UserRepository
import java.time.Instant
import java.time.LocalDate

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class LmsOrientationWorkflowIntegrationTest {
    @Autowired private lateinit var service: LmsOrientationService
    @Autowired private lateinit var enrollmentService: CourseEnrollmentService
    @Autowired private lateinit var userRepository: UserRepository
    @Autowired private lateinit var studentRepository: StudentRepository
    @Autowired private lateinit var courseRepository: CourseRepository

    @Test
    fun `21-band orientatsiyasi tugamaguncha enrollment bloklanadi va tasdiqdan keyin ochiladi`() {
        val actor = user("orientation-staff")
        val student = student("orientation-student")
        val course = courseRepository.save(Course(
            title = "21-band kursi",
            userId = requireNotNull(actor.id),
            status = CourseStatus.PUBLISHED.name,
            language = "uz",
        ))

        val blocked = assertThrows<IllegalArgumentException> {
            enrollmentService.enroll(requireNotNull(course.id), setOf(requireNotNull(student.id)), requireNotNull(actor.id), false)
        }
        assertTrue(blocked.message.orEmpty().contains("21-bandiga"))

        val created = service.create(CreateLmsOrientationRequest(
            title = "LMS bilan tanishtirish",
            venue = "A bino, 101-xona",
            academicYear = "2026-2027",
            startsAt = Instant.now().minusSeconds(3600),
            endsAt = Instant.now().plusSeconds(3600),
            instructions = "Kirish va kurslardan foydalanish yo'riqnomasi",
        ), requireNotNull(actor.id))
        val published = service.publish(created.id, requireNotNull(actor.id))
        assertEquals(1, published.attendeeCount)

        val beforeAttendance = assertThrows<IllegalArgumentException> {
            service.acknowledge(created.id, requireNotNull(student.user.id))
        }
        assertTrue(beforeAttendance.message.orEmpty().contains("shaxsan qatnashuv"))

        service.recordAttendance(
            created.id,
            requireNotNull(student.id),
            LmsOrientationAttendanceStatus.PRESENT,
            requireNotNull(actor.id),
        )
        val acknowledged = service.acknowledge(created.id, requireNotNull(student.user.id))
        assertFalse(acknowledged.orientationRequired)
        assertNotNull(acknowledged.orientationCompletedAt)
        assertNotNull(acknowledged.sessions.single().acknowledgementAt)

        val completed = service.complete(created.id, requireNotNull(actor.id))
        assertEquals("COMPLETED", completed.status)
        assertEquals(1, completed.presentCount)
        assertEquals(1, completed.acknowledgedCount)

        val enrolled = enrollmentService.enroll(
            requireNotNull(course.id),
            setOf(requireNotNull(student.id)),
            requireNotNull(actor.id),
            false,
        )
        assertEquals(1, enrolled.size)
    }

    private fun user(username: String) = userRepository.save(User(
        username = "$username-${System.nanoTime()}",
        password = "encoded-password",
        fullName = "Test xodim",
    ))

    private fun student(username: String): StudentProfile {
        val user = user(username)
        return studentRepository.save(StudentProfile(
            user = user,
            pinfl = "${System.nanoTime()}".takeLast(14).padStart(14, '1'),
            lastName = "Karimov",
            firstName = "Ali",
            birthDate = LocalDate.of(2000, 1, 1),
            gender = Gender.MALE,
            studentNumber = "OR-${System.nanoTime()}",
            educationForm = EducationForm.DISTANCE,
            educationLanguage = "uz",
            lmsOrientationRequired = true,
        ))
    }
}

