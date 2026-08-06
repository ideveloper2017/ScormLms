package uz.scorm.lms.app.v1.quiz

import jakarta.transaction.Transactional
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.ActiveProfiles
import uz.scorm.lms.app.v1.courses.dto.CourseCreateRequest
import uz.scorm.lms.app.v1.courses.dto.CourseEnrollmentRequest
import uz.scorm.lms.app.v1.courses.model.CourseStatus
import uz.scorm.lms.app.v1.courses.repository.CourseEnrollmentRepository
import uz.scorm.lms.app.v1.courses.service.CourseEnrollmentService
import uz.scorm.lms.app.v1.courses.service.CourseService
import uz.scorm.lms.app.v1.quiz.dto.ProctoringClientEventRequest
import uz.scorm.lms.app.v1.quiz.dto.CreateProctoringAppealRequest
import uz.scorm.lms.app.v1.quiz.dto.ProctoringEventBatchRequest
import uz.scorm.lms.app.v1.quiz.dto.QuizAnswerItemRequest
import uz.scorm.lms.app.v1.quiz.dto.QuizQuestionRequest
import uz.scorm.lms.app.v1.quiz.dto.QuizRequest
import uz.scorm.lms.app.v1.quiz.dto.ReviewProctoringAppealRequest
import uz.scorm.lms.app.v1.quiz.model.ProctoringAppealStatus
import uz.scorm.lms.app.v1.quiz.model.ProctoringChallengeDirection
import uz.scorm.lms.app.v1.quiz.model.ProctoringEventType
import uz.scorm.lms.app.v1.quiz.model.ProctoringSession
import uz.scorm.lms.app.v1.quiz.model.ProctoringSessionStatus
import uz.scorm.lms.app.v1.quiz.model.QuizQuestionType
import uz.scorm.lms.app.v1.quiz.repository.CourseQuizRepository
import uz.scorm.lms.app.v1.quiz.repository.ProctoringSessionRepository
import uz.scorm.lms.app.v1.quiz.service.ProctorDashboardService
import uz.scorm.lms.app.v1.quiz.service.ProctoringAppealService
import uz.scorm.lms.app.v1.quiz.service.ProctoringEventService
import uz.scorm.lms.app.v1.quiz.service.QuizProctorAssignmentService
import uz.scorm.lms.app.v1.quiz.service.QuizService
import uz.scorm.lms.app.v1.role.repository.RoleRepository
import uz.scorm.lms.app.v1.student.model.Gender
import uz.scorm.lms.app.v1.student.model.StudentProfile
import uz.scorm.lms.app.v1.student.repository.StudentRepository
import uz.scorm.lms.app.v1.user.model.User
import uz.scorm.lms.app.v1.user.repository.UserRepository
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class ProctorDashboardIntegrationTest {
    @Autowired private lateinit var dashboardService: ProctorDashboardService
    @Autowired private lateinit var appealService: ProctoringAppealService
    @Autowired private lateinit var assignmentService: QuizProctorAssignmentService
    @Autowired private lateinit var eventService: ProctoringEventService
    @Autowired private lateinit var quizService: QuizService
    @Autowired private lateinit var courseService: CourseService
    @Autowired private lateinit var enrollmentService: CourseEnrollmentService
    @Autowired private lateinit var quizRepository: CourseQuizRepository
    @Autowired private lateinit var sessionRepository: ProctoringSessionRepository
    @Autowired private lateinit var enrollmentRepository: CourseEnrollmentRepository
    @Autowired private lateinit var userRepository: UserRepository
    @Autowired private lateinit var studentRepository: StudentRepository
    @Autowired private lateinit var roleRepository: RoleRepository

    @Test
    fun `biriktirilgan proktor faqat oz quiz sessiyasi va dalillarini koradi`() {
        val teacher = user("dashboard-teacher", "teacher")
        val assigned = user("dashboard-proctor", "proctor")
        val stranger = user("dashboard-other-proctor", "proctor")
        val student = student("30000000000006", "ST-QZ-006", "dashboard-student")
        student.user.faceDescriptor = "server-template"
        userRepository.save(student.user)
        val course = courseService.create(
            CourseCreateRequest(title = "Monitoring kursi"),
            requireNotNull(teacher.id),
        ).also { courseService.changeStatus(it.id, CourseStatus.PUBLISHED, requireNotNull(teacher.id), false) }
        enrollmentService.enroll(
            course.id,
            CourseEnrollmentRequest(setOf(requireNotNull(student.id))),
            requireNotNull(teacher.id),
            false,
        )
        val question = quizService.createQuestion(
            QuizQuestionRequest(course.id, "Monitoring savoli", QuizQuestionType.SHORT_ANSWER, correctAnswer = "javob"),
            requireNotNull(teacher.id),
            false,
        )
        val quizDto = quizService.createQuiz(
            QuizRequest(
                courseId = course.id,
                title = "Monitoring testi",
                opensAt = Instant.now().minusSeconds(30),
                closesAt = Instant.now().plusSeconds(600),
                durationMinutes = 10,
                proctoring = true,
                proctorIds = setOf(requireNotNull(assigned.id)),
                questionIds = listOf(question.id.toLong()),
            ),
            requireNotNull(teacher.id),
            false,
        )
        val quizId = quizDto.id.toLong()
        val quiz = requireNotNull(quizRepository.findByIdAndDeletedFalse(quizId))
        val enrollment = requireNotNull(
            enrollmentRepository.findByCourseIdAndStudentId(course.id, requireNotNull(student.id))
        )
        sessionRepository.save(
            ProctoringSession(
                quiz = quiz,
                enrollment = enrollment,
                status = ProctoringSessionStatus.VERIFIED,
                challengeDirection = ProctoringChallengeDirection.RIGHT,
                nonceHash = "0".repeat(64),
                expiresAt = Instant.now().plusSeconds(120),
                verifiedAt = Instant.now(),
                identitySimilarity = 0.94,
                movementDelta = 0.12,
                centerFrameHash = "a".repeat(64),
                challengeFrameHash = "b".repeat(64),
            )
        )
        val attempt = quizService.start(quizId, requireNotNull(student.user.id))
        eventService.recordClientEvents(
            quizId,
            attempt.id.toLong(),
            requireNotNull(student.user.id),
            ProctoringEventBatchRequest(listOf(
                ProctoringClientEventRequest(
                    UUID.randomUUID().toString(),
                    ProctoringEventType.TAB_HIDDEN,
                    Instant.now(),
                )
            )),
        )

        assertEquals(1, dashboardService.stats(requireNotNull(assigned.id), false).activeExams)
        assertEquals(1, dashboardService.stats(requireNotNull(assigned.id), false).violations)
        assertEquals(1, dashboardService.sessions(requireNotNull(assigned.id), false).size)
        assertEquals(1, dashboardService.violations(requireNotNull(assigned.id), false).size)
        val evidence = dashboardService.evidence(attempt.id.toLong(), requireNotNull(assigned.id), false)
        assertEquals(0.94, evidence.identitySimilarity)
        assertTrue(evidence.events.any { it.type == "tab_hidden" && it.severity == "high" })
        assertTrue(dashboardService.sessions(requireNotNull(stranger.id), false).isEmpty())
        assertThrows(IllegalArgumentException::class.java) {
            dashboardService.evidence(attempt.id.toLong(), requireNotNull(stranger.id), false)
        }

        assertThrows(IllegalArgumentException::class.java) {
            appealService.create(
                quizId,
                attempt.id.toLong(),
                requireNotNull(student.user.id),
                CreateProctoringAppealRequest("Faol urinish bo'yicha shikoyat", emptySet()),
            )
        }
        quizService.submit(
            quizId,
            requireNotNull(student.user.id),
            listOf(QuizAnswerItemRequest(question.id, "javob")),
        )
        val appealContext = appealService.context(quizId, attempt.id.toLong(), requireNotNull(student.user.id))
        assertTrue(appealContext.eligible)
        assertEquals(1, appealContext.riskEvents.size)
        assertThrows(IllegalArgumentException::class.java) {
            appealService.context(quizId, attempt.id.toLong(), requireNotNull(stranger.id))
        }
        assertThrows(IllegalArgumentException::class.java) {
            appealService.create(
                quizId,
                attempt.id.toLong(),
                requireNotNull(student.user.id),
                CreateProctoringAppealRequest("Mavjud bo'lmagan eventni tanlash urinishi", setOf(Long.MAX_VALUE)),
            )
        }
        val appeal = appealService.create(
            quizId,
            attempt.id.toLong(),
            requireNotNull(student.user.id),
            CreateProctoringAppealRequest(
                "Tab hodisasi internet uzilishi sababli qayd etilgan, qayta ko'rib chiqing",
                setOf(appealContext.riskEvents.single().id.toLong()),
            ),
        )
        assertEquals(1, appealService.studentAppeals(requireNotNull(student.user.id)).size)
        assertEquals(1, appealService.reviewerAppeals(requireNotNull(assigned.id), false).size)
        assertEquals(1, appealService.reviewerAppeals(requireNotNull(teacher.id), false).size)
        assertTrue(appealService.reviewerAppeals(requireNotNull(stranger.id), false).isEmpty())
        assertThrows(org.springframework.security.access.AccessDeniedException::class.java) {
            appealService.review(
                appeal.id.toLong(),
                requireNotNull(stranger.id),
                false,
                ReviewProctoringAppealRequest(ProctoringAppealStatus.APPROVED, "Begona proktor qarori"),
            )
        }
        val reviewed = appealService.review(
            appeal.id.toLong(),
            requireNotNull(assigned.id),
            false,
            ReviewProctoringAppealRequest(
                ProctoringAppealStatus.APPROVED,
                "Tarmoq uzilishi dalili bilan hodisa uzrli deb topildi",
            ),
        )
        assertEquals("approved", reviewed.status)
        assertEquals(1, reviewed.disputedEvents.size)
        assertEquals("Tarmoq uzilishi dalili bilan hodisa uzrli deb topildi", reviewed.decision)
        assertThrows(IllegalArgumentException::class.java) {
            appealService.review(
                appeal.id.toLong(),
                requireNotNull(assigned.id),
                false,
                ReviewProctoringAppealRequest(ProctoringAppealStatus.REJECTED, "Ikkinchi yakuniy qaror"),
            )
        }
        assertThrows(IllegalArgumentException::class.java) {
            appealService.create(
                quizId,
                attempt.id.toLong(),
                requireNotNull(student.user.id),
                CreateProctoringAppealRequest("Takroriy apellyatsiya berishga urinish", setOf(appealContext.riskEvents.single().id.toLong())),
            )
        }
        val finalContext = appealService.context(quizId, attempt.id.toLong(), requireNotNull(student.user.id))
        assertEquals("approved", finalContext.appeal?.status)
        val postReviewEvidence = dashboardService.evidence(attempt.id.toLong(), requireNotNull(assigned.id), false)
        assertEquals(1, postReviewEvidence.score)
        assertEquals(1, postReviewEvidence.events.count { it.type == "tab_hidden" })

        assignmentService.update(quizId, setOf(requireNotNull(stranger.id)), requireNotNull(teacher.id), false)
        assertTrue(dashboardService.sessions(requireNotNull(assigned.id), false).isEmpty())
        assertEquals(1, dashboardService.sessions(requireNotNull(stranger.id), false).size)
        assertTrue(assignmentService.candidates().map { it.id }.containsAll(setOf(assigned.id.toString(), stranger.id.toString())))
    }

    private fun user(username: String, role: String): User = userRepository.save(
        User(
            username = username,
            password = "test-password-hash",
            fullName = username,
            role = requireNotNull(roleRepository.findByName(role)),
        )
    )

    private fun student(pinfl: String, number: String, username: String): StudentProfile = studentRepository.save(
        StudentProfile(
            user = user(username, "student"),
            pinfl = pinfl,
            lastName = "Testov",
            firstName = "Talaba",
            birthDate = LocalDate.of(2002, 1, 1),
            gender = Gender.MALE,
            studentNumber = number,
        )
    )
}
