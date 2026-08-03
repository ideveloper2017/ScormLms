package uz.scorm.lms.app.v1.assignment

import jakarta.transaction.Transactional
import org.junit.jupiter.api.Assertions.assertArrayEquals
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.mock.web.MockMultipartFile
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.context.TestPropertySource
import uz.scorm.lms.app.v1.assignment.dto.AssignmentRequest
import uz.scorm.lms.app.v1.assignment.dto.GradeSubmissionRequest
import uz.scorm.lms.app.v1.assignment.model.AssignmentPriority
import uz.scorm.lms.app.v1.assignment.model.AssignmentStatus
import uz.scorm.lms.app.v1.assignment.model.AssignmentSubmissionType
import uz.scorm.lms.app.v1.assignment.service.AssignmentService
import uz.scorm.lms.app.v1.courses.dto.CourseCreateRequest
import uz.scorm.lms.app.v1.courses.dto.CourseEnrollmentRequest
import uz.scorm.lms.app.v1.courses.model.CourseStatus
import uz.scorm.lms.app.v1.courses.service.CourseEnrollmentService
import uz.scorm.lms.app.v1.courses.service.CourseService
import uz.scorm.lms.app.v1.student.model.Gender
import uz.scorm.lms.app.v1.student.model.StudentProfile
import uz.scorm.lms.app.v1.student.repository.StudentRepository
import uz.scorm.lms.app.v1.user.model.User
import uz.scorm.lms.app.v1.user.repository.UserRepository
import java.time.Instant
import java.time.LocalDate

@SpringBootTest
@ActiveProfiles("test")
@TestPropertySource(properties = ["app.assignment.storage-dir=build/test-assignment-uploads"])
@Transactional
class AssignmentWorkflowIntegrationTest {
    @Autowired private lateinit var assignmentService: AssignmentService
    @Autowired private lateinit var courseService: CourseService
    @Autowired private lateinit var enrollmentService: CourseEnrollmentService
    @Autowired private lateinit var userRepository: UserRepository
    @Autowired private lateinit var studentRepository: StudentRepository

    @Test
    fun `teacher topshiriq yaratadi student topshiradi va feedback bilan baho oladi`() {
        val teacher = user("assignment-teacher")
        val student = student("20000000000001", "ST-ASG-001", "assignment-student")
        val course = publishedCourse(teacher, "Dasturlash amaliyoti")
        enrollmentService.enroll(
            course.id,
            CourseEnrollmentRequest(setOf(requireNotNull(student.id))),
            requireNotNull(teacher.id),
            false,
        )
        val assignment = assignmentService.create(
            AssignmentRequest(
                courseId = course.id,
                title = "REST API yozish",
                description = "CRUD endpointlar yarating",
                instructions = "Javobda yechimni izohlang",
                dueDate = Instant.now().plusSeconds(3600),
                maxScore = 100,
                priority = AssignmentPriority.HIGH,
                submissionType = AssignmentSubmissionType.TEXT,
                status = AssignmentStatus.PUBLISHED,
            ),
            requireNotNull(teacher.id),
            false,
        )

        val before = assignmentService.studentAssignments(requireNotNull(student.user.id)).single()
        assertEquals("pending", before.status)
        assertEquals("high", before.priority)

        val submitted = assignmentService.submit(
            assignment.id.toLong(),
            requireNotNull(student.user.id),
            "Spring controller va service tayyorlandi",
            null,
        )
        assertEquals("submitted", submitted.status)
        assertEquals(1, submitted.attemptNumber)

        val teacherSubmission = assignmentService.teacherSubmissions(requireNotNull(teacher.id), false).single()
        assertEquals("pending", teacherSubmission.status)
        assertEquals("Spring controller va service tayyorlandi", teacherSubmission.answer)

        assignmentService.grade(
            teacherSubmission.id.toLong(),
            GradeSubmissionRequest(87, "Yaxshi, validatsiyani ham qo'shing"),
            requireNotNull(teacher.id),
            false,
        )
        val graded = assignmentService.studentAssignments(requireNotNull(student.user.id)).single()
        assertEquals("graded", graded.status)
        assertEquals(87, graded.grade)
        assertEquals("Yaxshi, validatsiyani ham qo'shing", graded.feedback)
        assertEquals(1, assignmentService.submissionHistory(assignment.id.toLong(), requireNotNull(student.user.id)).size)
    }

    @Test
    fun `fayl private saqlanadi egasi va teacher yuklaydi begona student bloklanadi`() {
        val teacher = user("assignment-file-teacher")
        val owner = student("20000000000002", "ST-ASG-002", "assignment-file-owner")
        val stranger = student("20000000000003", "ST-ASG-003", "assignment-file-stranger")
        val course = publishedCourse(teacher, "Hujjat tayyorlash")
        enrollmentService.enroll(
            course.id,
            CourseEnrollmentRequest(setOf(requireNotNull(owner.id), requireNotNull(stranger.id))),
            requireNotNull(teacher.id),
            false,
        )
        val assignment = assignmentService.create(
            AssignmentRequest(
                courseId = course.id,
                title = "PDF hisobot",
                dueDate = Instant.now().minusSeconds(60),
                submissionType = AssignmentSubmissionType.FILE,
                status = AssignmentStatus.PUBLISHED,
            ),
            requireNotNull(teacher.id),
            false,
        )
        val bytes = "%PDF-1.4 test".toByteArray()
        val submission = assignmentService.submit(
            assignment.id.toLong(),
            requireNotNull(owner.user.id),
            null,
            MockMultipartFile("file", "hisobot.pdf", "application/pdf", bytes),
        )
        assertTrue(submission.late)
        assertEquals("hisobot.pdf", submission.fileName)
        assertArrayEquals(bytes, assignmentService.file(submission.id.toLong(), requireNotNull(owner.user.id), false).bytes)
        assertArrayEquals(bytes, assignmentService.file(submission.id.toLong(), requireNotNull(teacher.id), false).bytes)
        assertThrows(IllegalArgumentException::class.java) {
            assignmentService.file(submission.id.toLong(), requireNotNull(stranger.user.id), false)
        }
        assertThrows(IllegalArgumentException::class.java) {
            assignmentService.submit(
                assignment.id.toLong(),
                requireNotNull(stranger.user.id),
                null,
                MockMultipartFile("file", "script.exe", "application/octet-stream", byteArrayOf(1)),
            )
        }
    }

    @Test
    fun `course ownership va maksimal baho serverda tekshiriladi`() {
        val teacher = user("assignment-owner-teacher")
        val otherTeacher = user("assignment-other-teacher")
        val student = student("20000000000004", "ST-ASG-004", "assignment-score-student")
        val course = publishedCourse(teacher, "Vakolat testi")
        enrollmentService.enroll(
            course.id,
            CourseEnrollmentRequest(setOf(requireNotNull(student.id))),
            requireNotNull(teacher.id),
            false,
        )
        assertThrows(IllegalArgumentException::class.java) {
            assignmentService.create(
                AssignmentRequest(course.id, "Begona topshiriq", dueDate = Instant.now().plusSeconds(600)),
                requireNotNull(otherTeacher.id),
                false,
            )
        }
        val assignment = assignmentService.create(
            AssignmentRequest(
                courseId = course.id,
                title = "Ball chegarasi",
                dueDate = Instant.now().plusSeconds(600),
                maxScore = 50,
                submissionType = AssignmentSubmissionType.TEXT,
            ),
            requireNotNull(teacher.id),
            false,
        )
        val submission = assignmentService.submit(
            assignment.id.toLong(),
            requireNotNull(student.user.id),
            "Javob",
            null,
        )
        assertThrows(IllegalArgumentException::class.java) {
            assignmentService.grade(
                submission.id.toLong(),
                GradeSubmissionRequest(51),
                requireNotNull(teacher.id),
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
        )
    )
}
