package uz.scorm.lms.app.v1.videoconference

import jakarta.transaction.Transactional
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.context.TestConfiguration
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Import
import org.springframework.context.annotation.Primary
import org.springframework.test.context.ActiveProfiles
import uz.scorm.lms.app.v1.courses.dto.CourseCreateRequest
import uz.scorm.lms.app.v1.courses.dto.CourseEnrollmentRequest
import uz.scorm.lms.app.v1.courses.model.CourseStatus
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
import uz.scorm.lms.app.v1.videoconference.model.VideoConferenceMeetingStatus
import uz.scorm.lms.app.v1.videoconference.service.VideoConferenceGateway
import uz.scorm.lms.app.v1.videoconference.service.VideoConferenceGatewayResult
import uz.scorm.lms.app.v1.videoconference.service.VideoConferenceProvisionCommand
import uz.scorm.lms.app.v1.videoconference.service.VideoConferenceService
import java.time.Instant
import java.time.LocalDate
import java.util.concurrent.atomic.AtomicInteger

@SpringBootTest
@ActiveProfiles("test")
@Transactional
@Import(VideoConferenceWorkflowIntegrationTest.Config::class)
class VideoConferenceWorkflowIntegrationTest {
    @Autowired private lateinit var videoService: VideoConferenceService
    @Autowired private lateinit var sessionService: LearningSessionService
    @Autowired private lateinit var courseService: CourseService
    @Autowired private lateinit var enrollmentService: CourseEnrollmentService
    @Autowired private lateinit var userRepository: UserRepository
    @Autowired private lateinit var studentRepository: StudentRepository
    @Autowired private lateinit var gateway: FakeGateway

    @BeforeEach
    fun resetGateway() = gateway.reset()

    @Test
    fun `provider meeting is idempotently provisioned published joined and cancelled`() {
        val teacher = user("video-teacher")
        val student = student("41000000000001", "ST-VC-001", "video-student")
        val course = publishedCourse(teacher, "Providerli jonli kurs")
        enrollmentService.enroll(course.id, CourseEnrollmentRequest(setOf(requireNotNull(student.id))), requireNotNull(teacher.id), false)
        val session = draftSession(course.id, requireNotNull(teacher.id), "Provider meeting")

        val meeting = videoService.provision(session.id.toLong(), requireNotNull(teacher.id), false)
        assertEquals(VideoConferenceMeetingStatus.READY, meeting.status)
        assertEquals("TEST_ADAPTER", meeting.providerCode)
        assertEquals(1, meeting.provisionAttempts)
        assertTrue(meeting.hostUrl!!.contains("/host/"))
        assertThrows(IllegalArgumentException::class.java) {
            videoService.provision(session.id.toLong(), requireNotNull(teacher.id), false)
        }

        sessionService.changeStatus(session.id.toLong(), LearningSessionStatus.PUBLISHED, requireNotNull(teacher.id), false)
        val schedule = sessionService.studentSessions(requireNotNull(student.user.id), LocalDate.now(), LocalDate.now().plusDays(1))
        assertTrue(schedule.single { it.id == session.id }.canJoin)
        assertEquals(null, schedule.single { it.id == session.id }.meetingLink)
        val access = sessionService.access(session.id.toLong(), requireNotNull(student.user.id), LearningSessionAccessType.LIVE_JOIN)
        assertTrue(access.url.contains("/join/"))
        assertFalse(access.url.contains("/host/"))

        val cancelled = sessionService.changeStatus(session.id.toLong(), LearningSessionStatus.CANCELLED, requireNotNull(teacher.id), false)
        assertEquals("cancelled", cancelled.status)
        assertEquals(VideoConferenceMeetingStatus.CANCELLED, cancelled.videoConference!!.status)
        assertEquals(1, gateway.cancelCalls.get())
    }

    @Test
    fun `provider failure is audited redacted retryable and foreign teacher is blocked`() {
        val teacher = user("video-failure-teacher")
        val other = user("video-foreign-teacher")
        val course = publishedCourse(teacher, "Provider retry kursi")
        val session = draftSession(course.id, requireNotNull(teacher.id), "Retry meeting")
        gateway.failNext = true

        val failed = videoService.provision(session.id.toLong(), requireNotNull(teacher.id), false)
        assertEquals(VideoConferenceMeetingStatus.FAILED, failed.status)
        assertEquals("PROVIDER_HTTP_503", failed.failureCode)
        assertTrue(failed.failureMessage!!.contains("[REDACTED]"))
        assertFalse(failed.failureMessage!!.contains("super-secret"))
        assertThrows(IllegalArgumentException::class.java) {
            sessionService.changeStatus(session.id.toLong(), LearningSessionStatus.PUBLISHED, requireNotNull(teacher.id), false)
        }
        assertThrows(IllegalArgumentException::class.java) {
            videoService.provision(session.id.toLong(), requireNotNull(other.id), false)
        }

        val retried = videoService.provision(session.id.toLong(), requireNotNull(teacher.id), false)
        assertEquals(VideoConferenceMeetingStatus.READY, retried.status)
        assertEquals(2, retried.provisionAttempts)
        assertEquals(gateway.idempotencyKeys[0], gateway.idempotencyKeys[1])

        val async = sessionService.create(
            LearningSessionRequest(
                courseId = course.id, title = "Asinxron resurs", format = LearningSessionFormat.ASYNCHRONOUS,
                startsAt = Instant.now().plusSeconds(3600), endsAt = Instant.now().plusSeconds(7200),
                resourceUrl = "https://lms.example.uz/resource", status = LearningSessionStatus.DRAFT,
            ), requireNotNull(teacher.id), false,
        )
        assertThrows(IllegalArgumentException::class.java) {
            videoService.provision(async.id.toLong(), requireNotNull(teacher.id), false)
        }
    }

    private fun draftSession(courseId: Long, teacherId: Long, title: String) = sessionService.create(
        LearningSessionRequest(
            courseId = courseId, title = title, format = LearningSessionFormat.SYNCHRONOUS,
            startsAt = Instant.now().minusSeconds(60), endsAt = Instant.now().plusSeconds(3600),
            status = LearningSessionStatus.DRAFT,
        ), teacherId, false,
    )

    private fun publishedCourse(teacher: User, title: String) = courseService.create(
        CourseCreateRequest(title = title), requireNotNull(teacher.id),
    ).also { courseService.changeStatus(it.id, CourseStatus.PUBLISHED, requireNotNull(teacher.id), false) }

    private fun user(username: String) = userRepository.save(User(username = "$username-${System.nanoTime()}", password = "hash", fullName = username))

    private fun student(pinfl: String, number: String, username: String) = studentRepository.save(StudentProfile(
        user = user(username), pinfl = pinfl, lastName = "Testov", firstName = "Talaba",
        birthDate = LocalDate.of(2002, 1, 1), gender = Gender.MALE, studentNumber = number,
    ))

    @TestConfiguration
    class Config {
        @Bean @Primary fun fakeVideoConferenceGateway() = FakeGateway()
    }

    class FakeGateway : VideoConferenceGateway {
        override val providerCode = "TEST_ADAPTER"
        val provisionCalls = AtomicInteger()
        val cancelCalls = AtomicInteger()
        val idempotencyKeys = mutableListOf<String>()
        var failNext = false

        override fun provision(command: VideoConferenceProvisionCommand): VideoConferenceGatewayResult {
            provisionCalls.incrementAndGet()
            idempotencyKeys += command.idempotencyKey
            if (failNext) {
                failNext = false
                return VideoConferenceGatewayResult(false, errorCode = "PROVIDER_HTTP_503", errorMessage = "token=super-secret provider unavailable")
            }
            return VideoConferenceGatewayResult(
                true, providerMeetingId = "meeting-${command.sessionId}",
                joinUrl = "https://meet.example.uz/join/${command.sessionId}",
                hostUrl = "https://meet.example.uz/host/${command.sessionId}",
            )
        }

        override fun cancel(providerMeetingId: String, idempotencyKey: String): VideoConferenceGatewayResult {
            cancelCalls.incrementAndGet()
            return VideoConferenceGatewayResult(true, providerMeetingId = providerMeetingId)
        }

        fun reset() {
            provisionCalls.set(0); cancelCalls.set(0); idempotencyKeys.clear(); failNext = false
        }
    }
}
