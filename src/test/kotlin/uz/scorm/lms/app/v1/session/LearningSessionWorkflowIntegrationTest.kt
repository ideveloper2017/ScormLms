package uz.scorm.lms.app.v1.session

import jakarta.transaction.Transactional
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.ActiveProfiles
import uz.scorm.lms.app.v1.attendance.model.LearningActivitySource
import uz.scorm.lms.app.v1.attendance.repository.LearningActivityEventRepository
import uz.scorm.lms.app.v1.courses.dto.CourseCreateRequest
import uz.scorm.lms.app.v1.courses.dto.CourseEnrollmentRequest
import uz.scorm.lms.app.v1.courses.model.CourseStatus
import uz.scorm.lms.app.v1.courses.repository.CourseEnrollmentRepository
import uz.scorm.lms.app.v1.courses.service.CourseEnrollmentService
import uz.scorm.lms.app.v1.courses.service.CourseService
import uz.scorm.lms.app.v1.session.dto.LearningSessionRequest
import uz.scorm.lms.app.v1.session.model.LearningSessionAccessType
import uz.scorm.lms.app.v1.session.model.LearningSessionFormat
import uz.scorm.lms.app.v1.session.model.LearningSessionStatus
import uz.scorm.lms.app.v1.session.service.LearningSessionService
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
class LearningSessionWorkflowIntegrationTest {
    @Autowired private lateinit var service: LearningSessionService
    @Autowired private lateinit var courseService: CourseService
    @Autowired private lateinit var enrollmentService: CourseEnrollmentService
    @Autowired private lateinit var enrollmentRepository: CourseEnrollmentRepository
    @Autowired private lateinit var activityRepository: LearningActivityEventRepository
    @Autowired private lateinit var userRepository: UserRepository
    @Autowired private lateinit var studentRepository: StudentRepository

    @Test
    fun `teacher live va asinxron mashgulot yaratadi student jadvaldan vakolat bilan ochadi`() {
        val teacher = user("session-teacher")
        val student = student("40000000000001", "ST-SS-001", "session-student")
        val course = publishedCourse(teacher, "Tarmoq texnologiyalari")
        enrollmentService.enroll(
            course.id,
            CourseEnrollmentRequest(setOf(requireNotNull(student.id))),
            requireNotNull(teacher.id),
            false,
        )
        val now = Instant.now()
        val live = service.create(
            LearningSessionRequest(
                courseId = course.id,
                title = "Jonli amaliyot",
                format = LearningSessionFormat.SYNCHRONOUS,
                startsAt = now.minusSeconds(60),
                endsAt = now.plusSeconds(3600),
                liveUrl = "https://meet.example.edu/live-1",
                recordingUrl = "https://video.example.edu/recording-1",
                status = LearningSessionStatus.PUBLISHED,
            ),
            requireNotNull(teacher.id),
            false,
        )
        service.create(
            LearningSessionRequest(
                courseId = course.id,
                title = "Mustaqil video dars",
                format = LearningSessionFormat.ASYNCHRONOUS,
                startsAt = now.minusSeconds(60),
                endsAt = now.plusSeconds(86_400),
                resourceUrl = "https://lms.example.edu/resources/1",
                status = LearningSessionStatus.PUBLISHED,
            ),
            requireNotNull(teacher.id),
            false,
        )

        val schedule = service.studentSessions(requireNotNull(student.user.id), LocalDate.now(), LocalDate.now().plusDays(1))
        assertEquals(2, schedule.size)
        assertTrue(schedule.first { it.id == live.id }.canJoin)
        assertTrue(schedule.all { it.meetingLink == null && it.recordingUrl == null && it.resourceUrl == null })
        assertTrue(schedule.any { it.format == "asynchronous" && it.hasResource })

        val access = service.access(live.id.toLong(), requireNotNull(student.user.id), LearningSessionAccessType.LIVE_JOIN)
        assertEquals("https://meet.example.edu/live-1", access.url)
        assertEquals(1, service.teacherSessions(requireNotNull(teacher.id), false).first { it.id == live.id }.accessCount)

        val enrollmentId = enrollmentRepository.findByCourseIdAndStudentId(course.id, requireNotNull(student.id))!!.id!!
        val events = activityRepository.findAllByEnrollmentIdAndOccurredAtBetweenAndDeletedFalseOrderByOccurredAtAsc(
            enrollmentId, now.minusSeconds(120), now.plusSeconds(120),
        )
        assertEquals(1, events.count { it.sourceType == LearningActivitySource.LEARNING_SESSION })
    }

    @Test
    fun `enrollmentsiz kirish begona boshqaruv va xavfsiz bolmagan URL bloklanadi`() {
        val teacher = user("session-guard-teacher")
        val otherTeacher = user("session-other-teacher")
        val student = student("40000000000002", "ST-SS-002", "session-guard-student")
        val stranger = student("40000000000003", "ST-SS-003", "session-guard-stranger")
        val course = publishedCourse(teacher, "Sessiya vakolati")
        enrollmentService.enroll(
            course.id,
            CourseEnrollmentRequest(setOf(requireNotNull(student.id))),
            requireNotNull(teacher.id),
            false,
        )
        val now = Instant.now()
        assertThrows(IllegalArgumentException::class.java) {
            service.create(
                LearningSessionRequest(
                    course.id,
                    "Xavfli havola",
                    format = LearningSessionFormat.SYNCHRONOUS,
                    startsAt = now,
                    endsAt = now.plusSeconds(3600),
                    liveUrl = "javascript:alert(1)",
                ),
                requireNotNull(teacher.id),
                false,
            )
        }
        val live = service.create(
            LearningSessionRequest(
                course.id,
                "Himoyalangan jonli dars",
                format = LearningSessionFormat.SYNCHRONOUS,
                startsAt = now.minusSeconds(60),
                endsAt = now.plusSeconds(3600),
                liveUrl = "https://meet.example.edu/secure",
                status = LearningSessionStatus.PUBLISHED,
            ),
            requireNotNull(teacher.id),
            false,
        )
        assertThrows(IllegalArgumentException::class.java) {
            service.access(live.id.toLong(), requireNotNull(stranger.user.id), LearningSessionAccessType.LIVE_JOIN)
        }
        assertThrows(IllegalArgumentException::class.java) {
            service.update(
                live.id.toLong(),
                LearningSessionRequest(
                    course.id,
                    "Begona tahrir",
                    format = LearningSessionFormat.SYNCHRONOUS,
                    startsAt = now.plusSeconds(3600),
                    endsAt = now.plusSeconds(7200),
                    liveUrl = "https://meet.example.edu/other",
                ),
                requireNotNull(otherTeacher.id),
                false,
            )
        }
    }

    private fun publishedCourse(teacher: User, title: String) = courseService.create(
        CourseCreateRequest(title = title), requireNotNull(teacher.id),
    ).also {
        courseService.changeStatus(it.id, CourseStatus.PUBLISHED, requireNotNull(teacher.id), false)
    }

    private fun user(username: String): User = userRepository.save(User(
        username = username,
        password = "test-password-hash",
        fullName = username,
    ))

    private fun student(pinfl: String, number: String, username: String): StudentProfile = studentRepository.save(
        StudentProfile(
            user = user(username),
            pinfl = pinfl,
            lastName = "Testov",
            firstName = "Talaba",
            birthDate = LocalDate.of(2002, 1, 1),
            gender = Gender.MALE,
            studentNumber = number,
        ),
    )
}
