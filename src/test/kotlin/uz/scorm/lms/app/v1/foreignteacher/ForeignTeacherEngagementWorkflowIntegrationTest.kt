package uz.scorm.lms.app.v1.foreignteacher

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.security.test.context.support.WithMockUser
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.get
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.courses.model.Course
import uz.scorm.lms.app.v1.courses.repository.CourseRepository
import uz.scorm.lms.app.v1.foreignteacher.dto.SaveForeignTeacherEngagementRequest
import uz.scorm.lms.app.v1.foreignteacher.dto.VerifyForeignTeacherEngagementRequest
import uz.scorm.lms.app.v1.foreignteacher.service.ForeignTeacherEngagementService
import uz.scorm.lms.app.v1.program.model.Program
import uz.scorm.lms.app.v1.program.repository.ProgramRepository
import uz.scorm.lms.app.v1.subject.model.Subject
import uz.scorm.lms.app.v1.subject.repository.SubjectRepository
import uz.scorm.lms.app.v1.teacher.model.Teacher
import uz.scorm.lms.app.v1.teacher.repository.TeacherRepository
import uz.scorm.lms.app.v1.user.model.User
import uz.scorm.lms.app.v1.user.repository.UserRepository
import java.time.LocalDate

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class ForeignTeacherEngagementWorkflowIntegrationTest {
    @Autowired private lateinit var service: ForeignTeacherEngagementService
    @Autowired private lateinit var userRepository: UserRepository
    @Autowired private lateinit var programRepository: ProgramRepository
    @Autowired private lateinit var subjectRepository: SubjectRepository
    @Autowired private lateinit var teacherRepository: TeacherRepository
    @Autowired private lateinit var courseRepository: CourseRepository
    @Autowired private lateinit var mockMvc: MockMvc

    @Test
    @WithMockUser(authorities = ["TEACHER_READ"])
    fun `ordinary teacher cannot read HR engagement evidence`() {
        mockMvc.get("/api/v1/foreign-teacher-engagements").andExpect { status { isForbidden() } }
    }

    @Test
    @WithMockUser(authorities = ["TEACHER_WRITE"])
    fun `teacher registry writer may read HR engagement evidence`() {
        mockMvc.get("/api/v1/foreign-teacher-engagements").andExpect { status { isOk() } }
    }

    @Test
    fun `25-band verifies foreign teacher only for assigned distance course and independent reviewer`() {
        val author = user("foreign-author")
        val verifier = user("foreign-verifier")
        val program = programRepository.save(Program(name = "Masofaviy IT", code = "DIT-${System.nanoTime()}", active = true, distanceEnabled = true, informationTechnologyProgram = true))
        val subject = subjectRepository.save(Subject(name = "Bulutli tizimlar", code = "CLOUD-${System.nanoTime()}", active = true, program = program))
        val teacher = teacherRepository.save(Teacher(fullName = "David Cohen", active = true, academicDegree = "PhD", subjects = mutableSetOf(subject)))
        val course = courseRepository.save(Course(
            title = "Cloud Architecture", subject = subject, subjectName = subject.name,
            startDate = LocalDate.of(2026, 9, 10), endDate = LocalDate.of(2027, 1, 20),
        ))
        val request = request(requireNotNull(teacher.id), requireNotNull(course.id))

        val nonDistanceProgram = programRepository.save(Program(name = "Kunduzgi dastur", code = "FT-${System.nanoTime()}", active = true, distanceEnabled = false))
        val nonDistanceSubject = subjectRepository.save(Subject(name = "Kunduzgi fan", code = "FTS-${System.nanoTime()}", active = true, program = nonDistanceProgram))
        val nonDistanceCourse = courseRepository.save(Course(title = "Kunduzgi kurs", subject = nonDistanceSubject, subjectName = nonDistanceSubject.name))
        val wrongDelivery = assertThrows<IllegalArgumentException> {
            service.create(request.copy(courseIds = setOf(requireNotNull(nonDistanceCourse.id))), requireNotNull(author.id))
        }
        assertTrue(wrongDelivery.message.orEmpty().contains("faol masofaviy"))

        val foreignSubject = subjectRepository.save(Subject(name = "Biriktirilmagan fan", code = "OTHER-${System.nanoTime()}", active = true, program = program))
        val foreignCourse = courseRepository.save(Course(title = "Biriktirilmagan kurs", subject = foreignSubject, subjectName = foreignSubject.name))
        val wrongSubject = assertThrows<IllegalArgumentException> {
            service.create(request.copy(courseIds = setOf(requireNotNull(foreignCourse.id))), requireNotNull(author.id))
        }
        assertTrue(wrongSubject.message.orEmpty().contains("pedagogning fanlar"))

        val domestic = assertThrows<IllegalArgumentException> {
            service.create(request.copy(citizenshipCountryCode = "UZ"), requireNotNull(author.id))
        }
        assertTrue(domestic.message.orEmpty().contains("UZdan boshqa"))

        val unconfirmed = service.create(
            request.copy(contractNumber = "FT-2026-002", remoteTeachingConfirmed = false),
            requireNotNull(author.id),
        )
        val remoteError = assertThrows<IllegalArgumentException> {
            service.verify(unconfirmed.id, VerifyForeignTeacherEngagementRequest("Barcha hujjatlar tekshirildi"), requireNotNull(verifier.id))
        }
        assertTrue(remoteError.message.orEmpty().contains("masofadan dars"))

        val created = service.create(request, requireNotNull(author.id))
        assertEquals("DRAFT", created.status)
        assertEquals("IL", created.citizenshipCountryCode)
        assertEquals(1, created.courses.size)
        assertThrows<IllegalArgumentException> {
            service.verify(created.id, VerifyForeignTeacherEngagementRequest("Barcha hujjatlar tekshirildi"), requireNotNull(author.id))
        }

        val verified = service.verify(
            created.id,
            VerifyForeignTeacherEngagementRequest("Shartnoma, buyruq va malaka hujjatlari asl nusxasi tekshirildi"),
            requireNotNull(verifier.id),
        )
        assertEquals("VERIFIED", verified.status)
        assertNotNull(verified.verifiedAt)
        assertEquals(1, service.list().count { it.status == "VERIFIED" && it.teacherId == teacher.id })
    }

    private fun request(teacherId: Long, courseId: Long) = SaveForeignTeacherEngagementRequest(
        teacherId = teacherId,
        academicYear = "2026-2027",
        citizenshipCountryCode = "il",
        citizenshipEvidenceReference = "HR-FOREIGN/CITIZENSHIP-441",
        qualificationReference = "HR-FOREIGN/PHD-2020-17",
        contractNumber = "FT-2026-001",
        contractDate = LocalDate.of(2026, 8, 1),
        engagementOrderNumber = "ORDER-FT-2026-31",
        engagementOrderDate = LocalDate.of(2026, 8, 5),
        engagementStartDate = LocalDate.of(2026, 9, 1),
        engagementEndDate = LocalDate.of(2027, 1, 31),
        remoteTeachingConfirmed = true,
        evidenceReference = "HR-ARCHIVE/FT-2026-001",
        courseIds = setOf(courseId),
    )

    private fun user(prefix: String) = userRepository.save(User(
        username = "$prefix-${System.nanoTime()}", password = "encoded-password", fullName = "Xalqaro bo'lim xodimi",
    ))
}
