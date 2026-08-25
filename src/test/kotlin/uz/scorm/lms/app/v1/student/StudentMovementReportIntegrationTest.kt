package uz.scorm.lms.app.v1.student

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
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.courses.model.Course
import uz.scorm.lms.app.v1.courses.model.CourseEnrollment
import uz.scorm.lms.app.v1.courses.model.CourseEnrollmentStatus
import uz.scorm.lms.app.v1.courses.repository.CourseEnrollmentRepository
import uz.scorm.lms.app.v1.courses.repository.CourseRepository
import uz.scorm.lms.app.v1.group.model.Group
import uz.scorm.lms.app.v1.group.repository.GroupRepository
import uz.scorm.lms.app.v1.program.model.Program
import uz.scorm.lms.app.v1.program.repository.ProgramRepository
import uz.scorm.lms.app.v1.student.model.Gender
import uz.scorm.lms.app.v1.student.model.StudentLifecycleEvent
import uz.scorm.lms.app.v1.student.model.StudentLifecycleEventType
import uz.scorm.lms.app.v1.student.model.StudentProfile
import uz.scorm.lms.app.v1.student.model.StudentStatus
import uz.scorm.lms.app.v1.student.repository.StudentLifecycleEventRepository
import uz.scorm.lms.app.v1.student.repository.StudentRepository
import uz.scorm.lms.app.v1.student.service.StudentMovementReportService
import uz.scorm.lms.app.v1.subject.model.Subject
import uz.scorm.lms.app.v1.subject.repository.SubjectRepository
import uz.scorm.lms.app.v1.user.model.User
import uz.scorm.lms.app.v1.user.repository.UserRepository
import java.time.Instant
import java.time.LocalDate

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class StudentMovementReportIntegrationTest {
    @Autowired private lateinit var reportService: StudentMovementReportService
    @Autowired private lateinit var eventRepository: StudentLifecycleEventRepository
    @Autowired private lateinit var studentRepository: StudentRepository
    @Autowired private lateinit var userRepository: UserRepository
    @Autowired private lateinit var programRepository: ProgramRepository
    @Autowired private lateinit var groupRepository: GroupRepository
    @Autowired private lateinit var subjectRepository: SubjectRepository
    @Autowired private lateinit var courseRepository: CourseRepository
    @Autowired private lateinit var enrollmentRepository: CourseEnrollmentRepository
    @Autowired private lateinit var mockMvc: MockMvc

    @Test
    fun `latest reinstatement and current subjects are returned as one read-only report`() {
        val fixture = fixture()

        val report = reportService.reinstatementSubjects(fixture.student.studentNumber, "2026-2027", 0, 10)

        assertEquals(1, report.totalElements)
        val item = report.items.single()
        assertEquals(fixture.student.id, item.studentId)
        assertEquals("TIK-NEW/2026", item.orderNumber)
        assertEquals("KI-26", item.groupName)
        assertEquals(1, item.subjects.size)
        assertEquals(fixture.subjectCode, item.subjects.single().subjectCode)
        assertEquals("Dasturlash asoslari", item.subjects.single().subjectName)
        assertEquals(CourseEnrollmentStatus.ACTIVE, item.subjects.single().status)
        assertEquals(30, item.subjects.single().progress)

        assertTrue(reportService.reinstatementSubjects("begona", null, 0, 10).items.isEmpty())
        assertTrue(reportService.reinstatementSubjects(null, "2025-2026", 0, 10).items.isEmpty())
    }

    @Test
    @WithMockUser(authorities = ["USER_READ", "ACADEMIC_READ"])
    fun `report endpoint requires REPORT_READ in addition to student and academic read`() {
        mockMvc.get("/api/v1/students/reinstatements/subjects-report")
            .andExpect { status { isForbidden() } }
    }

    @Test
    @WithMockUser(authorities = ["USER_READ", "ACADEMIC_READ", "REPORT_READ"])
    fun `authorized report endpoint returns latest reinstatement`() {
        val fixture = fixture()

        mockMvc.get("/api/v1/students/reinstatements/subjects-report") {
            param("search", fixture.student.studentNumber)
            param("academicYear", "2026-2027")
            param("page", "0")
            param("size", "10")
        }.andExpect {
            status { isOk() }
            jsonPath("$.totalElements") { value(1) }
            jsonPath("$.items[0].orderNumber") { value("TIK-NEW/2026") }
            jsonPath("$.items[0].subjects[0].subjectCode") { value(fixture.subjectCode) }
        }
    }

    private fun fixture(): Fixture {
        val suffix = System.nanoTime().toString()
        val actor = userRepository.save(User(
            username = "movement-actor-$suffix",
            password = "encoded-password",
            fullName = "Registrator",
        ))
        val studentUser = userRepository.save(User(
            username = "movement-student-$suffix",
            password = "encoded-password",
            fullName = "Ali Karimov",
        ))
        val program = programRepository.save(Program(
            name = "Dasturiy injiniring",
            code = "60610400-$suffix",
            degreeLevel = "BACHELOR",
            active = true,
        ))
        val group = groupRepository.save(Group(
            name = "KI-26",
            educationYear = "2026-2027",
            language = "uz",
            program = program,
        ))
        val student = studentRepository.save(StudentProfile(
            user = studentUser,
            pinfl = suffix.takeLast(14).padStart(14, '8'),
            lastName = "Karimov",
            firstName = "Ali",
            birthDate = LocalDate.of(2001, 1, 1),
            gender = Gender.MALE,
            studentNumber = "ST-R-$suffix",
            programId = program.id,
            groupId = group.id,
            academicYear = "2026-2027",
            semesterNumber = 3,
            studentStatus = StudentStatus.ACTIVE,
        ))
        val subject = subjectRepository.save(Subject(
            name = "Dasturlash asoslari",
            code = "DAST-101-$suffix",
            credits = 6,
            program = program,
        ))
        val course = courseRepository.save(Course(
            title = "Dasturlash asoslari kursi",
            subjectName = "Dasturlash asoslari",
            subject = subject,
            userId = actor.id,
        ))
        enrollmentRepository.save(CourseEnrollment(
            course = course,
            student = student,
            status = CourseEnrollmentStatus.ACTIVE,
            progress = 30,
            academicYear = "2026-2027",
            semester = 3,
            credits = 6,
            required = true,
        ))
        eventRepository.save(reinstatement(student, actor, program, group, "TIK-OLD/2026", 4))
        eventRepository.save(reinstatement(student, actor, program, group, "TIK-NEW/2026", 1))
        return Fixture(student, requireNotNull(subject.code))
    }

    private fun reinstatement(
        student: StudentProfile,
        actor: User,
        program: Program,
        group: Group,
        orderNumber: String,
        daysAgo: Long,
    ) = StudentLifecycleEvent(
        student = student,
        eventType = StudentLifecycleEventType.REINSTATEMENT,
        fromStatus = StudentStatus.SUSPENDED,
        toStatus = StudentStatus.ACTIVE,
        fromProgram = program,
        toProgram = program,
        fromProgramNameSnapshot = program.name,
        toProgramNameSnapshot = program.name,
        fromGroupId = group.id,
        toGroupId = group.id,
        orderNumber = orderNumber,
        orderDate = LocalDate.now().minusDays(daysAgo + 1),
        effectiveDate = LocalDate.now().minusDays(daysAgo),
        legalBasis = "559-son qaror va talabalar harakati reglamenti",
        reason = "Akademik ta'tildan qayta tiklash komissiyasi qarori",
        recordedBy = actor,
        recordedAt = Instant.now().minusSeconds(daysAgo * 86_400),
    )

    private data class Fixture(
        val student: StudentProfile,
        val subjectCode: String,
    )
}
