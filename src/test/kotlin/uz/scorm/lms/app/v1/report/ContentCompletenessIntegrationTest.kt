package uz.scorm.lms.app.v1.report

import jakarta.transaction.Transactional
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.security.test.context.support.WithMockUser
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.get
import uz.scorm.lms.app.v1.assignment.model.AssignmentStatus
import uz.scorm.lms.app.v1.assignment.model.CourseAssignment
import uz.scorm.lms.app.v1.assignment.repository.CourseAssignmentRepository
import uz.scorm.lms.app.v1.courses.model.ContentReviewStatus
import uz.scorm.lms.app.v1.courses.model.Course
import uz.scorm.lms.app.v1.courses.model.CourseContent
import uz.scorm.lms.app.v1.courses.model.CourseContentType
import uz.scorm.lms.app.v1.courses.model.CourseEnrollment
import uz.scorm.lms.app.v1.courses.model.CourseModule
import uz.scorm.lms.app.v1.courses.model.CourseStatus
import uz.scorm.lms.app.v1.courses.model.LearningItemStatus
import uz.scorm.lms.app.v1.courses.repository.CourseContentRepository
import uz.scorm.lms.app.v1.courses.repository.CourseEnrollmentRepository
import uz.scorm.lms.app.v1.courses.repository.CourseModuleRepository
import uz.scorm.lms.app.v1.courses.repository.CourseRepository
import uz.scorm.lms.app.v1.quiz.model.CourseQuiz
import uz.scorm.lms.app.v1.quiz.model.QuizStatus
import uz.scorm.lms.app.v1.quiz.repository.CourseQuizRepository
import uz.scorm.lms.app.v1.session.model.CourseLearningSession
import uz.scorm.lms.app.v1.session.model.LearningSessionFormat
import uz.scorm.lms.app.v1.session.model.LearningSessionStatus
import uz.scorm.lms.app.v1.session.model.LearningSessionType
import uz.scorm.lms.app.v1.session.repository.CourseLearningSessionRepository
import uz.scorm.lms.app.v1.student.model.Gender
import uz.scorm.lms.app.v1.student.model.StudentProfile
import uz.scorm.lms.app.v1.student.repository.StudentRepository
import uz.scorm.lms.app.v1.user.model.User
import uz.scorm.lms.app.v1.user.repository.UserRepository
import uz.scorm.lms.app.v1.program.model.Program
import uz.scorm.lms.app.v1.program.repository.ProgramRepository
import uz.scorm.lms.app.v1.subject.model.Subject
import uz.scorm.lms.app.v1.subject.repository.SubjectRepository
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class ContentCompletenessIntegrationTest {
    @Autowired private lateinit var service: ContentCompletenessService
    @Autowired private lateinit var mockMvc: MockMvc
    @Autowired private lateinit var userRepository: UserRepository
    @Autowired private lateinit var studentRepository: StudentRepository
    @Autowired private lateinit var courseRepository: CourseRepository
    @Autowired private lateinit var enrollmentRepository: CourseEnrollmentRepository
    @Autowired private lateinit var moduleRepository: CourseModuleRepository
    @Autowired private lateinit var contentRepository: CourseContentRepository
    @Autowired private lateinit var assignmentRepository: CourseAssignmentRepository
    @Autowired private lateinit var quizRepository: CourseQuizRepository
    @Autowired private lateinit var sessionRepository: CourseLearningSessionRepository
    @Autowired private lateinit var programRepository: ProgramRepository
    @Autowired private lateinit var subjectRepository: SubjectRepository

    @Test
    fun `sakkiz mezon bajarilgan kurs yuz foiz toliq qaytadi`() {
        val teacher = user("completeness-full-teacher")
        val course = course(teacher, "To'liq fan")
        val student = student(
            "10000000000881", "COMPLETE-881", requireNotNull(course.subject?.program?.id),
        )
        enrollmentRepository.save(CourseEnrollment(course, student, academicYear = YEAR))
        val module = moduleRepository.save(CourseModule(
            course = course, title = "Yillik modul", status = LearningItemStatus.PUBLISHED.name,
        ))
        contentRepository.save(CourseContent(
            module = module,
            title = "Yillik tasdiqlangan kontent",
            contentType = CourseContentType.DOCUMENT,
            status = LearningItemStatus.PUBLISHED.name,
            languageCode = "uz",
            authorName = "Ekspert",
            contentVersion = "1.0",
            sourceName = "Mualliflik material",
            validFrom = LocalDate.of(2026, 9, 1),
            validUntil = LocalDate.of(2027, 8, 31),
            metadataUpdatedAt = Instant.now(),
            reviewStatus = ContentReviewStatus.APPROVED.name,
            approvedRevisionNumber = 1,
        ))
        assignmentRepository.save(CourseAssignment(
            course = course, title = "Yillik topshiriq", dueAt = instant(2027, 2, 1), status = AssignmentStatus.PUBLISHED,
        ))
        quizRepository.save(CourseQuiz(
            course = course, title = "Yillik test", opensAt = instant(2027, 2, 2), closesAt = instant(2027, 2, 3),
            durationMinutes = 30, status = QuizStatus.PUBLISHED,
        ))
        sessionRepository.save(session(course, "Sinxron dars", LearningSessionFormat.SYNCHRONOUS, instant(2027, 2, 4)))
        sessionRepository.save(session(course, "Asinxron dars", LearningSessionFormat.ASYNCHRONOUS, instant(2027, 2, 5)))

        val report = service.report(requireNotNull(teacher.id), false, YEAR)
        val row = report.courses.single()

        assertEquals("TEACHER", report.scope)
        assertEquals(LocalDate.of(2026, 9, 1), report.coverageFrom)
        assertEquals(LocalDate.of(2027, 8, 31), report.coverageTo)
        assertEquals(requireNotNull(course.id), row.courseId)
        assertTrue(row.complete)
        assertEquals(100, row.completenessPercentage)
        assertTrue(row.gaps.isEmpty())
        assertEquals(1, report.completeCourses)
    }

    @Test
    fun `boshqa oquv yilidagi nazorat va mashgulotlar hisobga olinmaydi`() {
        val teacher = user("completeness-year-teacher")
        val ownCourse = course(teacher, "Yil chegarasi")
        val otherTeacher = user("completeness-other-teacher")
        course(otherTeacher, "Begona kurs")
        assignmentRepository.save(CourseAssignment(
            course = ownCourse, title = "Eski topshiriq", dueAt = instant(2026, 5, 1), status = AssignmentStatus.PUBLISHED,
        ))
        quizRepository.save(CourseQuiz(
            course = ownCourse, title = "Eski test", opensAt = instant(2026, 5, 2), closesAt = instant(2026, 5, 3),
            durationMinutes = 20, status = QuizStatus.PUBLISHED,
        ))
        sessionRepository.save(session(ownCourse, "Eski sinxron", LearningSessionFormat.SYNCHRONOUS, instant(2026, 5, 4)))
        sessionRepository.save(session(ownCourse, "Eski asinxron", LearningSessionFormat.ASYNCHRONOUS, instant(2026, 5, 5)))

        val row = service.report(requireNotNull(teacher.id), false, YEAR).courses.single()
        val codes = row.gaps.map { it.code }.toSet()

        assertEquals(requireNotNull(ownCourse.id), row.courseId)
        assertEquals(0, row.publishedAssignments)
        assertEquals(0, row.publishedQuizzes)
        assertEquals(0, row.synchronousSessions)
        assertEquals(0, row.asynchronousSessions)
        assertTrue(codes.containsAll(setOf(
            "NO_MODULES", "MODULE_WITHOUT_ANNUAL_APPROVED_CONTENT", "NO_PUBLISHED_ASSIGNMENT", "NO_PUBLISHED_QUIZ",
            "NO_SYNCHRONOUS_SESSION", "NO_ASYNCHRONOUS_SESSION",
        )))
    }

    @Test
    @WithMockUser(username = "completeness-http-monitor", authorities = ["STAT_READ", "ROLE_MONITORING"])
    fun `monitoring endpointi oquv yili va tashkilot scope qaytaradi`() {
        user("completeness-http-monitor")

        mockMvc.get("/api/v1/reports/institution/content-completeness") {
            param("academicYear", YEAR)
        }.andExpect {
            status { isOk() }
            jsonPath("$.data.scope") { value("INSTITUTION") }
            jsonPath("$.data.academicYear") { value(YEAR) }
            jsonPath("$.data.coverageFrom") { value("2026-09-01") }
            jsonPath("$.data.coverageTo") { value("2027-08-31") }
        }
    }

    private fun user(username: String) = userRepository.save(User(
        username = username, password = "test-password-hash", fullName = username,
    ))

    private fun course(owner: User, title: String): Course {
        val program = programRepository.save(Program(
            name = "$title dasturi", active = true, distanceEnabled = true, educationLanguage = "uz",
            fullTimeDurationMonths = 48, distanceDurationMonths = 48,
            fullTimeAvailable = true, fullTimeBasisReference = "BUYRUQ-3/2026",
        ))
        val subject = subjectRepository.save(Subject(name = "$title fani", active = true, program = program))
        return courseRepository.save(Course(
            title = title,
            slug = "${owner.username}-${title.hashCode()}",
            userId = requireNotNull(owner.id),
            status = CourseStatus.PUBLISHED.name,
            language = "uz",
            subjectName = subject.name,
            subject = subject,
        ))
    }

    private fun student(pinfl: String, number: String, programId: Long) = studentRepository.save(StudentProfile(
        user = user("student-$number"),
        pinfl = pinfl,
        lastName = "To'liqlik",
        firstName = "Talaba",
        birthDate = LocalDate.of(2002, 1, 1),
        gender = Gender.MALE,
        studentNumber = number,
        academicYear = YEAR,
        programId = programId,
        educationLanguage = "uz",
    ))

    private fun session(course: Course, title: String, format: LearningSessionFormat, startsAt: Instant) =
        CourseLearningSession(
            course = course,
            title = title,
            format = format,
            sessionType = LearningSessionType.LECTURE,
            startsAt = startsAt,
            endsAt = startsAt.plusSeconds(3600),
            status = LearningSessionStatus.PUBLISHED,
        )

    private fun instant(year: Int, month: Int, day: Int): Instant =
        LocalDate.of(year, month, day).atStartOfDay(REPORT_ZONE).toInstant()

    companion object {
        private const val YEAR = "2026-2027"
        private val REPORT_ZONE = ZoneId.of("Asia/Tashkent")
    }
}
