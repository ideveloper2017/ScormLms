package uz.scorm.lms.app.v1.quiz

import jakarta.transaction.Transactional
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.ActiveProfiles
import uz.scorm.lms.app.v1.attendance.repository.LearningActivityEventRepository
import uz.scorm.lms.app.v1.courses.dto.CourseCreateRequest
import uz.scorm.lms.app.v1.courses.dto.CourseEnrollmentRequest
import uz.scorm.lms.app.v1.courses.model.CourseStatus
import uz.scorm.lms.app.v1.courses.repository.CourseEnrollmentRepository
import uz.scorm.lms.app.v1.courses.service.CourseEnrollmentService
import uz.scorm.lms.app.v1.courses.service.CourseService
import uz.scorm.lms.app.v1.biometric.dto.AcceptBiometricConsentRequest
import uz.scorm.lms.app.v1.biometric.dto.PublishBiometricPolicyRequest
import uz.scorm.lms.app.v1.biometric.dto.SaveBiometricPolicyRequest
import uz.scorm.lms.app.v1.biometric.model.BiometricPolicyStatus
import uz.scorm.lms.app.v1.biometric.service.BiometricConsentBinding
import uz.scorm.lms.app.v1.biometric.service.BiometricGovernanceService
import uz.scorm.lms.app.v1.quiz.dto.QuizAnswerItemRequest
import uz.scorm.lms.app.v1.quiz.dto.QuizQuestionRequest
import uz.scorm.lms.app.v1.quiz.dto.QuizRequest
import uz.scorm.lms.app.v1.quiz.dto.ProctoringClientEventRequest
import uz.scorm.lms.app.v1.quiz.dto.ProctoringEventBatchRequest
import uz.scorm.lms.app.v1.quiz.model.QuizDifficulty
import uz.scorm.lms.app.v1.quiz.model.QuizQuestionType
import uz.scorm.lms.app.v1.quiz.model.QuizStatus
import uz.scorm.lms.app.v1.quiz.model.ProctoringChallengeDirection
import uz.scorm.lms.app.v1.quiz.model.ProctoringSession
import uz.scorm.lms.app.v1.quiz.model.ProctoringSessionStatus
import uz.scorm.lms.app.v1.quiz.model.ProctoringEventSeverity
import uz.scorm.lms.app.v1.quiz.model.ProctoringEventType
import uz.scorm.lms.app.v1.quiz.repository.CourseQuizRepository
import uz.scorm.lms.app.v1.quiz.repository.ProctoringSessionRepository
import uz.scorm.lms.app.v1.quiz.repository.ProctoringEventRepository
import uz.scorm.lms.app.v1.quiz.service.QuizService
import uz.scorm.lms.app.v1.quiz.service.ProctoringEventService
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
class QuizWorkflowIntegrationTest {
    @Autowired private lateinit var quizService: QuizService
    @Autowired private lateinit var courseService: CourseService
    @Autowired private lateinit var enrollmentService: CourseEnrollmentService
    @Autowired private lateinit var enrollmentRepository: CourseEnrollmentRepository
    @Autowired private lateinit var activityRepository: LearningActivityEventRepository
    @Autowired private lateinit var userRepository: UserRepository
    @Autowired private lateinit var studentRepository: StudentRepository
    @Autowired private lateinit var quizRepository: CourseQuizRepository
    @Autowired private lateinit var proctoringSessionRepository: ProctoringSessionRepository
    @Autowired private lateinit var proctoringEventRepository: ProctoringEventRepository
    @Autowired private lateinit var proctoringEventService: ProctoringEventService
    @Autowired private lateinit var biometricGovernanceService: BiometricGovernanceService

    @Test
    fun `savol bankidan test tuziladi server baholaydi va audit natija saqlanadi`() {
        val teacher = user("quiz-teacher")
        val student = student("30000000000001", "ST-QZ-001", "quiz-student")
        val course = publishedCourse(teacher, "Algoritmlar testi")
        enrollmentService.enroll(
            course.id,
            CourseEnrollmentRequest(setOf(requireNotNull(student.id))),
            requireNotNull(teacher.id),
            false,
        )
        val q1 = quizService.createQuestion(
            QuizQuestionRequest(
                courseId = course.id,
                text = "Binary qidiruv murakkabligi?",
                type = QuizQuestionType.SINGLE_CHOICE,
                difficulty = QuizDifficulty.MEDIUM,
                points = 2,
                options = listOf("O(n)", "O(log n)", "O(1)"),
                correctAnswer = "O(log n)",
            ),
            requireNotNull(teacher.id),
            false,
        )
        val q2 = quizService.createQuestion(
            QuizQuestionRequest(
                courseId = course.id,
                text = "Graf daraxt bo'lishi mumkinmi?",
                type = QuizQuestionType.TRUE_FALSE,
                points = 1,
                correctAnswer = "true",
            ),
            requireNotNull(teacher.id),
            false,
        )
        val quiz = quizService.createQuiz(
            QuizRequest(
                courseId = course.id,
                title = "1-oraliq nazorat",
                opensAt = Instant.now().minusSeconds(60),
                closesAt = Instant.now().plusSeconds(3600),
                durationMinutes = 30,
                passingPercentage = 60,
                shuffleQuestions = false,
                questionIds = listOf(q1.id.toLong(), q2.id.toLong()),
                status = QuizStatus.PUBLISHED,
            ),
            requireNotNull(teacher.id),
            false,
        )

        val listed = quizService.studentQuizzes(requireNotNull(student.user.id)).single()
        assertEquals("upcoming", listed.status)
        assertEquals(2, listed.questionCount)
        assertEquals(3, listed.totalPoints)

        val session = quizService.start(quiz.id.toLong(), requireNotNull(student.user.id))
        assertEquals(2, session.questions.size)
        quizService.saveAnswer(quiz.id.toLong(), q1.id.toLong(), requireNotNull(student.user.id), "O(log n)", session.id.toLong())
        val resumed = quizService.start(quiz.id.toLong(), requireNotNull(student.user.id))
        assertEquals(session.id, resumed.id)
        assertEquals(mapOf(q1.id to "O(log n)"), resumed.answers)
        assertEquals(listOf("O(n)", "O(log n)", "O(1)"), session.questions.first().options)
        val result = quizService.submit(
            quiz.id.toLong(),
            requireNotNull(student.user.id),
            listOf(
                QuizAnswerItemRequest(q1.id, "  o(LOG n) "),
                QuizAnswerItemRequest(q2.id, "false"),
            ),
        )
        assertEquals(2, result.score)
        assertEquals(3, result.totalPoints)
        assertEquals(66.66666666666667, result.percentage)
        assertTrue(result.passed)
        assertEquals("completed", quizService.studentQuizzes(requireNotNull(student.user.id)).single().status)
        assertEquals(1, quizService.teacherAttempts(quiz.id.toLong(), requireNotNull(teacher.id), false).size)

        val enrollmentId = enrollmentRepository.findByCourseIdAndStudentId(course.id, requireNotNull(student.id))!!.id!!
        assertEquals(2, activityRepository.countByEnrollmentIdAndDeletedFalse(enrollmentId))
        assertThrows(IllegalArgumentException::class.java) {
            quizService.updateQuestion(
                q1.id.toLong(),
                QuizQuestionRequest(
                    course.id,
                    "O'zgartirilgan savol",
                    QuizQuestionType.SHORT_ANSWER,
                    correctAnswer = "javob",
                ),
                requireNotNull(teacher.id),
                false,
            )
        }
    }

    @Test
    fun `enrollmentsiz kirish begona savol va urinish limiti bloklanadi`() {
        val teacher = user("quiz-guard-teacher")
        val student = student("30000000000002", "ST-QZ-002", "quiz-guard-student")
        val stranger = student("30000000000003", "ST-QZ-003", "quiz-guard-stranger")
        val course = publishedCourse(teacher, "Quiz vakolati")
        val otherCourse = publishedCourse(teacher, "Boshqa kurs")
        enrollmentService.enroll(
            course.id,
            CourseEnrollmentRequest(setOf(requireNotNull(student.id))),
            requireNotNull(teacher.id),
            false,
        )
        val question = quizService.createQuestion(
            QuizQuestionRequest(course.id, "2 + 2?", QuizQuestionType.SHORT_ANSWER, correctAnswer = "4"),
            requireNotNull(teacher.id),
            false,
        )
        val foreignQuestion = quizService.createQuestion(
            QuizQuestionRequest(otherCourse.id, "Begona savol", QuizQuestionType.SHORT_ANSWER, correctAnswer = "x"),
            requireNotNull(teacher.id),
            false,
        )
        assertThrows(IllegalArgumentException::class.java) {
            quizService.createQuiz(
                QuizRequest(
                    courseId = course.id,
                    title = "Aralash test",
                    opensAt = Instant.now().minusSeconds(1),
                    closesAt = Instant.now().plusSeconds(600),
                    durationMinutes = 10,
                    questionIds = listOf(question.id.toLong(), foreignQuestion.id.toLong()),
                ),
                requireNotNull(teacher.id),
                false,
            )
        }
        val quiz = quizService.createQuiz(
            QuizRequest(
                courseId = course.id,
                title = "Bir urinishli test",
                opensAt = Instant.now().minusSeconds(1),
                closesAt = Instant.now().plusSeconds(600),
                durationMinutes = 10,
                allowedAttempts = 1,
                questionIds = listOf(question.id.toLong()),
            ),
            requireNotNull(teacher.id),
            false,
        )
        assertThrows(IllegalArgumentException::class.java) {
            quizService.start(quiz.id.toLong(), requireNotNull(stranger.user.id))
        }
        quizService.start(quiz.id.toLong(), requireNotNull(student.user.id))
        val result = quizService.submit(
            quiz.id.toLong(),
            requireNotNull(student.user.id),
            listOf(QuizAnswerItemRequest(question.id, "5")),
        )
        assertFalse(result.passed)
        assertThrows(IllegalArgumentException::class.java) {
            quizService.start(quiz.id.toLong(), requireNotNull(student.user.id))
        }
    }

    @Test
    fun `proktorli test faqat bir martalik server tasdigidan keyin boshlanadi`() {
        val teacher = user("proctor-teacher")
        val policyApprover = user("proctor-policy-approver")
        val student = student("30000000000004", "ST-QZ-004", "proctor-student")
        student.user.faceDescriptor = "server-template"
        val biometricBinding = bindBiometrics(student.user, teacher, policyApprover)
        val course = publishedCourse(teacher, "Proktorli kurs")
        enrollmentService.enroll(
            course.id,
            CourseEnrollmentRequest(setOf(requireNotNull(student.id))),
            requireNotNull(teacher.id),
            false,
        )
        val question = quizService.createQuestion(
            QuizQuestionRequest(course.id, "Nazorat savoli", QuizQuestionType.SHORT_ANSWER, correctAnswer = "javob"),
            requireNotNull(teacher.id),
            false,
        )
        val quizDto = quizService.createQuiz(
            QuizRequest(
                courseId = course.id,
                title = "Proktorli nazorat",
                opensAt = Instant.now().minusSeconds(30),
                closesAt = Instant.now().plusSeconds(600),
                durationMinutes = 10,
                proctoring = true,
                questionIds = listOf(question.id.toLong()),
            ),
            requireNotNull(teacher.id),
            false,
        )
        val quizId = quizDto.id.toLong()
        val userId = requireNotNull(student.user.id)
        val quiz = requireNotNull(quizRepository.findByIdAndDeletedFalse(quizId))
        val enrollment = requireNotNull(
            enrollmentRepository.findByCourseIdAndStudentId(course.id, requireNotNull(student.id))
        )
        val verified = proctoringSessionRepository.save(
            ProctoringSession(
                quiz = quiz,
                enrollment = enrollment,
                status = ProctoringSessionStatus.VERIFIED,
                challengeDirection = ProctoringChallengeDirection.LEFT,
                nonceHash = "0".repeat(64),
                expiresAt = Instant.now().plusSeconds(120),
                verifiedAt = Instant.now(),
                biometricPolicy = biometricBinding.policy,
                biometricConsentEvent = biometricBinding.consent,
                biometricRetentionUntil = Instant.now().plusSeconds(3600),
            )
        )

        val started = quizService.start(quizId, userId)
        val consumed = proctoringSessionRepository.findByIdAndDeletedFalse(requireNotNull(verified.id))!!
        assertEquals(ProctoringSessionStatus.CONSUMED, consumed.status)
        assertEquals(started.id.toLong(), consumed.attempt?.id)

        // Active attempt can be resumed; a consumed preflight is not replayed to create a new attempt.
        assertEquals(started.id, quizService.start(quizId, userId).id)

        val clientEvents = ProctoringEventBatchRequest(listOf(
            ProctoringClientEventRequest(UUID.randomUUID().toString(), ProctoringEventType.TAB_HIDDEN, Instant.now()),
            ProctoringClientEventRequest(UUID.randomUUID().toString(), ProctoringEventType.NETWORK_OFFLINE, Instant.now()),
        ))
        val recorded = proctoringEventService.recordClientEvents(quizId, started.id.toLong(), userId, clientEvents)
        assertEquals(2, recorded.accepted)
        assertEquals(0, recorded.duplicates)
        val replay = proctoringEventService.recordClientEvents(quizId, started.id.toLong(), userId, clientEvents)
        assertEquals(0, replay.accepted)
        assertEquals(2, replay.duplicates)
        val eventsBeforeSubmit = proctoringEventRepository
            .findAllByAttemptIdAndDeletedFalseOrderByOccurredAtAsc(started.id.toLong())
        assertTrue(eventsBeforeSubmit.any {
            it.type == ProctoringEventType.SESSION_STARTED && it.severity == ProctoringEventSeverity.INFO
        })
        assertTrue(eventsBeforeSubmit.any {
            it.type == ProctoringEventType.TAB_HIDDEN && it.severity == ProctoringEventSeverity.HIGH
        })
        assertTrue(eventsBeforeSubmit.any {
            it.type == ProctoringEventType.NETWORK_OFFLINE && it.severity == ProctoringEventSeverity.MEDIUM
        })

        quizService.submit(
            quizId,
            userId,
            listOf(QuizAnswerItemRequest(question.id, "javob")),
        )
        assertEquals(
            ProctoringSessionStatus.COMPLETED,
            proctoringSessionRepository.findByIdAndDeletedFalse(requireNotNull(verified.id))!!.status,
        )
        assertTrue(proctoringEventRepository.findAllByAttemptIdAndDeletedFalseOrderByOccurredAtAsc(started.id.toLong())
            .any { it.type == ProctoringEventType.SESSION_ENDED })
        assertThrows(IllegalArgumentException::class.java) {
            proctoringEventService.recordClientEvents(quizId, started.id.toLong(), userId, clientEvents)
        }
    }

    private fun bindBiometrics(studentUser: User, author: User, approver: User): BiometricConsentBinding {
        biometricGovernanceService.listPolicies().filter { it.status == BiometricPolicyStatus.PUBLISHED }
            .forEach { biometricGovernanceService.archive(it.id, requireNotNull(approver.id)) }
        val draft = biometricGovernanceService.create(testPolicy(), requireNotNull(author.id))
        val policy = biometricGovernanceService.publish(
            draft.id,
            PublishBiometricPolicyRequest("Integratsion test uchun mustaqil biometrik siyosat tasdig'i"),
            requireNotNull(approver.id),
        )
        biometricGovernanceService.accept(
            AcceptBiometricConsentRequest(policy.id, policy.statementHash),
            requireNotNull(studentUser.id),
        )
        val binding = biometricGovernanceService.requireActiveConsent(requireNotNull(studentUser.id))
        studentUser.facePhotoUrl = "/uploads/faces/quiz-test.jpg"
        studentUser.facePolicy = binding.policy
        studentUser.faceConsentEvent = binding.consent
        studentUser.faceExpiresAt = Instant.now().plusSeconds(3600)
        userRepository.save(studentUser)
        return binding
    }

    private fun testPolicy() = SaveBiometricPolicyRequest(
        versionCode = "QUIZ-${System.nanoTime()}", title = "Proktoring integratsion test siyosati",
        purposeText = "Proktorli testda talaba shaxsini tekshirish uchun biometrik ma'lumotdan foydalanish",
        legalBasis = "Integratsion test uchun tasdiqlangan yuridik asos hujjati",
        consentText = "Men yuz shablonim proktorli testda shaxsni tekshirish uchun qayta ishlanishiga aniq rozilik beraman.",
        privacyNotice = "Yuz shabloni va proktoring dalili belgilangan retention muddati tugagach auditli o'chiriladi.",
        documentNumber = "TEST-BIO", documentDate = LocalDate.now(), documentReference = "test://biometric-policy",
        faceTemplateRetentionDays = 30, proctoringEvidenceRetentionDays = 90,
    )

    @Test
    fun `proktorli test tasdiqsiz yangi urinish yaratmaydi`() {
        val teacher = user("proctor-gate-teacher")
        val student = student("30000000000005", "ST-QZ-005", "proctor-gate-student")
        val course = publishedCourse(teacher, "Proktoring gate kursi")
        enrollmentService.enroll(
            course.id,
            CourseEnrollmentRequest(setOf(requireNotNull(student.id))),
            requireNotNull(teacher.id),
            false,
        )
        val question = quizService.createQuestion(
            QuizQuestionRequest(course.id, "Gate savoli", QuizQuestionType.SHORT_ANSWER, correctAnswer = "javob"),
            requireNotNull(teacher.id),
            false,
        )
        val quiz = quizService.createQuiz(
            QuizRequest(
                courseId = course.id,
                title = "Tasdiq talab qiluvchi test",
                opensAt = Instant.now().minusSeconds(30),
                closesAt = Instant.now().plusSeconds(600),
                durationMinutes = 10,
                proctoring = true,
                questionIds = listOf(question.id.toLong()),
            ),
            requireNotNull(teacher.id),
            false,
        )
        assertThrows(IllegalArgumentException::class.java) {
            quizService.start(quiz.id.toLong(), requireNotNull(student.user.id))
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
