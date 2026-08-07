package uz.scorm.lms.app.v1.courses

import jakarta.transaction.Transactional
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.ActiveProfiles
import uz.scorm.lms.app.v1.courses.dto.ContentReviewDecisionRequest
import uz.scorm.lms.app.v1.courses.dto.CourseContentRequest
import uz.scorm.lms.app.v1.courses.dto.CourseCreateRequest
import uz.scorm.lms.app.v1.courses.dto.CourseModuleRequest
import uz.scorm.lms.app.v1.courses.dto.CourseUpdateRequest
import uz.scorm.lms.app.v1.courses.model.ContentReviewDecision
import uz.scorm.lms.app.v1.courses.model.CourseContentType
import uz.scorm.lms.app.v1.courses.model.CourseStatus
import uz.scorm.lms.app.v1.courses.model.LearningItemStatus
import uz.scorm.lms.app.v1.courses.service.CourseContentReviewService
import uz.scorm.lms.app.v1.courses.service.CourseContentService
import uz.scorm.lms.app.v1.courses.service.CourseEnrollmentService
import uz.scorm.lms.app.v1.courses.service.CourseModuleService
import uz.scorm.lms.app.v1.courses.service.CourseService
import uz.scorm.lms.app.v1.program.model.Program
import uz.scorm.lms.app.v1.program.repository.ProgramRepository
import uz.scorm.lms.app.v1.student.model.Gender
import uz.scorm.lms.app.v1.student.model.StudentProfile
import uz.scorm.lms.app.v1.student.repository.StudentRepository
import uz.scorm.lms.app.v1.subject.model.Subject
import uz.scorm.lms.app.v1.subject.repository.SubjectRepository
import uz.scorm.lms.app.v1.user.model.User
import uz.scorm.lms.app.v1.user.repository.UserRepository
import java.time.LocalDate

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class ContentCompatibilityIntegrationTest {
    @Autowired private lateinit var courseService: CourseService
    @Autowired private lateinit var moduleService: CourseModuleService
    @Autowired private lateinit var contentService: CourseContentService
    @Autowired private lateinit var reviewService: CourseContentReviewService
    @Autowired private lateinit var enrollmentService: CourseEnrollmentService
    @Autowired private lateinit var programRepository: ProgramRepository
    @Autowired private lateinit var subjectRepository: SubjectRepository
    @Autowired private lateinit var studentRepository: StudentRepository
    @Autowired private lateinit var userRepository: UserRepository

    @Test
    fun `mos BCP47 kontent nashr qilinadi va keyingi nomuvofiq konfiguratsiyada studentdan yashiriladi`() {
        val teacher = user("compatibility-teacher")
        val reviewer = user("compatibility-reviewer")
        val program = program("Dasturiy injiniring", "uz")
        val subject = subject("Web dasturlash", program)
        val student = student("10000000000771", "COMPAT-771", program, "uz")
        val course = courseService.create(CourseCreateRequest(
            title = "Mos kurs", subjectId = requireNotNull(subject.id), language = "uz",
        ), requireNotNull(teacher.id))
        courseService.changeStatus(course.id, CourseStatus.PUBLISHED, requireNotNull(teacher.id), false)
        enrollmentService.enroll(course.id, setOf(requireNotNull(student.id)), requireNotNull(teacher.id), false)
        val module = moduleService.create(
            course.id, CourseModuleRequest("Mos modul"), requireNotNull(teacher.id), false,
        )
        moduleService.changeStatus(course.id, module.id, LearningItemStatus.PUBLISHED, requireNotNull(teacher.id), false)
        val content = contentService.create(
            course.id, module.id, content("uz-Latn", "1.0"), requireNotNull(teacher.id), false,
        )

        assertTrue(content.compatibility.compatible)
        assertEquals(requireNotNull(program.id), content.compatibility.programId)
        val review = reviewService.submit(course.id, content.id, requireNotNull(teacher.id), false)
        reviewService.decide(
            review.id,
            ContentReviewDecisionRequest(ContentReviewDecision.APPROVED, "Til va dastur mosligi tekshirildi"),
            requireNotNull(reviewer.id),
            true,
        )
        val published = contentService.changeStatus(
            course.id, content.id, LearningItemStatus.PUBLISHED, requireNotNull(teacher.id), false,
        )
        assertTrue(published.compatibility.compatible)
        assertEquals(1, contentService.list(course.id, requireNotNull(student.user.id), false).size)

        program.educationLanguage = "ru"
        programRepository.save(program)
        assertTrue(contentService.list(course.id, requireNotNull(student.user.id), false).isEmpty())
        val ownerView = contentService.list(course.id, requireNotNull(teacher.id), false).single()
        assertFalse(ownerView.compatibility.compatible)
        assertTrue(ownerView.compatibility.issues.map { it.code }.containsAll(setOf(
            "COURSE_PROGRAM_LANGUAGE_MISMATCH",
            "CONTENT_PROGRAM_LANGUAGE_MISMATCH",
        )))

        program.educationLanguage = "uz"
        programRepository.save(program)
        assertThrows<IllegalArgumentException> {
            courseService.update(
                course.id, CourseUpdateRequest(language = "ru"), requireNotNull(teacher.id), false,
            )
        }

        program.distanceDurationMonths = null
        programRepository.save(program)
        val durationView = contentService.list(course.id, requireNotNull(teacher.id), false).single()
        assertTrue(durationView.compatibility.issues.any { it.code == "PROGRAM_DURATION_NON_COMPLIANT" })
        assertThrows<IllegalArgumentException> {
            courseService.update(
                course.id, CourseUpdateRequest(title = "Davomiylik gate testi"), requireNotNull(teacher.id), false,
            )
        }

        program.distanceDurationMonths = 48
        program.fullTimeAvailable = null
        program.fullTimeBasisReference = null
        programRepository.save(program)
        val counterpartView = contentService.list(course.id, requireNotNull(teacher.id), false).single()
        assertTrue(counterpartView.compatibility.issues.any { it.code == "PROGRAM_FULL_TIME_COUNTERPART_REQUIRED" })
        assertThrows<IllegalArgumentException> {
            courseService.update(
                course.id, CourseUpdateRequest(title = "Kunduzgi asos gate testi"), requireNotNull(teacher.id), false,
            )
        }
    }

    @Test
    fun `noto'g'ri kontent tili ekspertizadan va begona dastur talabasi enrollmentdan bloklanadi`() {
        val teacher = user("compatibility-block-teacher")
        val targetProgram = program("Axborot tizimlari", "uz")
        val otherProgram = program("Rus tili", "ru")
        val subject = subject("Ma'lumotlar bazasi", targetProgram)
        val course = courseService.create(CourseCreateRequest(
            title = "Til nazorati", subjectId = requireNotNull(subject.id), language = "uz",
        ), requireNotNull(teacher.id))
        val module = moduleService.create(
            course.id, CourseModuleRequest("Til moduli"), requireNotNull(teacher.id), false,
        )
        moduleService.changeStatus(course.id, module.id, LearningItemStatus.PUBLISHED, requireNotNull(teacher.id), false)
        val wrongContent = contentService.create(
            course.id, module.id, content("ru", "1.0"), requireNotNull(teacher.id), false,
        )

        assertFalse(wrongContent.compatibility.compatible)
        assertTrue(wrongContent.compatibility.issues.map { it.code }.containsAll(setOf(
            "CONTENT_COURSE_LANGUAGE_MISMATCH",
            "CONTENT_PROGRAM_LANGUAGE_MISMATCH",
        )))
        assertThrows<IllegalArgumentException> {
            reviewService.submit(course.id, wrongContent.id, requireNotNull(teacher.id), false)
        }

        val wrongStudent = student("10000000000772", "COMPAT-772", otherProgram, "ru")
        assertThrows<IllegalArgumentException> {
            enrollmentService.enroll(
                course.id, setOf(requireNotNull(wrongStudent.id)), requireNotNull(teacher.id), false,
            )
        }
        assertTrue(enrollmentService.list(course.id, requireNotNull(teacher.id), false).isEmpty())
    }

    private fun content(language: String, version: String) = CourseContentRequest(
        title = "Metodik material",
        contentType = CourseContentType.DOCUMENT,
        contentUrl = "https://content.example.uz/material-$version.pdf",
        languageCode = language,
        authorName = "Metodika bo'limi",
        contentVersion = version,
        sourceName = "Tasdiqlangan metodik fond",
        validFrom = LocalDate.now(),
        validUntil = LocalDate.now().plusYears(1),
    )

    private fun program(name: String, language: String) = programRepository.save(Program(
        name = name,
        active = true,
        distanceEnabled = true,
        fullTimeAvailable = true,
        fullTimeBasisReference = "BUYRUQ-3/2026",
        fullTimeDurationMonths = 48,
        distanceDurationMonths = 48,
        educationLanguage = language,
    ))

    private fun subject(name: String, program: Program) = subjectRepository.save(Subject(
        name = name, active = true, program = program,
    ))

    private fun user(username: String) = userRepository.save(User(
        username = username, password = "test-password-hash", fullName = username,
    ))

    private fun student(pinfl: String, number: String, program: Program, language: String) =
        studentRepository.save(StudentProfile(
            user = user("student-$number"),
            pinfl = pinfl,
            lastName = "Moslik",
            firstName = "Talaba",
            birthDate = LocalDate.of(2002, 1, 1),
            gender = Gender.MALE,
            studentNumber = number,
            programId = requireNotNull(program.id),
            educationLanguage = language,
        ))
}
