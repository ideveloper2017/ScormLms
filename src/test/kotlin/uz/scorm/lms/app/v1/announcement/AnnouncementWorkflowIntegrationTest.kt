package uz.scorm.lms.app.v1.announcement

import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.ActiveProfiles
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.announcement.dto.AnnouncementUpsertRequest
import uz.scorm.lms.app.v1.announcement.service.AnnouncementService
import uz.scorm.lms.app.v1.courses.model.Course
import uz.scorm.lms.app.v1.courses.model.CourseEnrollment
import uz.scorm.lms.app.v1.courses.model.CourseEnrollmentStatus
import uz.scorm.lms.app.v1.courses.model.CourseStatus
import uz.scorm.lms.app.v1.courses.repository.CourseEnrollmentRepository
import uz.scorm.lms.app.v1.courses.repository.CourseRepository
import uz.scorm.lms.app.v1.integration.model.IntegrationEventStatus
import uz.scorm.lms.app.v1.integration.repository.IntegrationOutboxRepository
import uz.scorm.lms.app.v1.student.model.Gender
import uz.scorm.lms.app.v1.student.model.StudentProfile
import uz.scorm.lms.app.v1.student.repository.StudentRepository
import uz.scorm.lms.app.v1.user.model.User
import uz.scorm.lms.app.v1.user.repository.UserRepository
import java.time.LocalDate

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class AnnouncementWorkflowIntegrationTest {
    @Autowired private lateinit var service: AnnouncementService
    @Autowired private lateinit var userRepository: UserRepository
    @Autowired private lateinit var studentRepository: StudentRepository
    @Autowired private lateinit var courseRepository: CourseRepository
    @Autowired private lateinit var enrollmentRepository: CourseEnrollmentRepository
    @Autowired private lateinit var integrationOutboxRepository: IntegrationOutboxRepository

    @Test
    fun `course publish snapshots recipients and audits delivery read and retry`() {
        val teacher = user("announcement-teacher")
        val learner = student("announcement-learner", "72000000000001", "ANN-001")
        val outsider = student("announcement-outsider", "72000000000002", "ANN-002")
        val course = course(teacher, "Announcement course")
        enroll(course, learner)

        val draft = service.create(
            request(course.id, setOf("IN_APP", "EMAIL", "PUSH")),
            requireNotNull(teacher.id),
            false,
        )
        assertEquals("DRAFT", draft.status)
        val published = service.publish(draft.id, requireNotNull(teacher.id), false)
        assertEquals("PUBLISHED", published.status)
        assertEquals(1, published.recipientCount)
        assertEquals(1, published.deliveryStats.single { it.channel == "IN_APP" }.delivered)
        assertEquals(1, published.deliveryStats.single { it.channel == "EMAIL" }.pending)
        assertEquals(1, published.deliveryStats.single { it.channel == "PUSH" }.pending)

        assertTrue(service.inbox(requireNotNull(learner.user.id)).single().read.not())
        assertTrue(service.inbox(requireNotNull(outsider.user.id)).isEmpty())
        val read = service.markRead(draft.id, requireNotNull(learner.user.id))
        assertTrue(read.read)
        assertEquals(1, service.manage(requireNotNull(teacher.id), false).single().readCount)
        assertThrows<NoSuchElementException> {
            service.markRead(draft.id, requireNotNull(outsider.user.id))
        }

        val retried = service.retry(draft.id, requireNotNull(teacher.id), false)
        assertEquals(2, retried.attempted)
        val report = service.deliveryReport(draft.id, requireNotNull(teacher.id), false)
        val external = report.deliveries.filter { it.channel != "IN_APP" }
        assertTrue(external.all { it.attemptCount == 0 && it.status == "PENDING" })
        assertTrue(external.all { delivery ->
            integrationOutboxRepository.findByEventKeyAndDeletedFalse("announcement-delivery-${delivery.id}")?.status == IntegrationEventStatus.PENDING
        })
        assertThrows<IllegalArgumentException> {
            service.deliveryReport(draft.id, requireNotNull(outsider.user.id), false)
        }
    }

    @Test
    fun `teacher cannot target foreign course or institution`() {
        val owner = user("announcement-owner")
        val other = user("announcement-other")
        val foreignCourse = course(owner, "Foreign course")
        assertThrows<IllegalArgumentException> {
            service.create(request(foreignCourse.id), requireNotNull(other.id), false)
        }
        assertThrows<IllegalArgumentException> {
            service.create(
                AnnouncementUpsertRequest("Tashkilot xabari", "Muhim tashkilot xabari", "INSTITUTION"),
                requireNotNull(other.id),
                false,
            )
        }
    }

    private fun request(courseId: Long?, channels: Set<String> = setOf("IN_APP")) = AnnouncementUpsertRequest(
        title = "Yakuniy nazorat jadvali",
        body = "Yakuniy nazorat sanasi va auditoriyasi e'lon qilindi.",
        audience = "COURSE",
        courseId = courseId,
        category = "DEADLINE",
        priority = "HIGH",
        channels = channels,
        actionUrl = "/student/courses",
    )

    private fun user(username: String): User = userRepository.save(User(
        username = username,
        password = "test-password-hash",
        fullName = username,
    ))

    private fun student(username: String, pinfl: String, number: String): StudentProfile = studentRepository.save(
        StudentProfile(
            user = user(username),
            pinfl = pinfl,
            lastName = "E'lon",
            firstName = "Talaba",
            birthDate = LocalDate.of(2002, 1, 1),
            gender = Gender.FEMALE,
            studentNumber = number,
        ),
    )

    private fun course(owner: User, title: String): Course = courseRepository.save(Course(
        title = title,
        slug = title.lowercase().replace(' ', '-'),
        userId = requireNotNull(owner.id),
        status = CourseStatus.PUBLISHED.name,
    ))

    private fun enroll(course: Course, student: StudentProfile) {
        enrollmentRepository.save(CourseEnrollment(
            course = course,
            student = student,
            status = CourseEnrollmentStatus.ACTIVE,
            academicYear = "2026-2027",
        ))
    }
}
