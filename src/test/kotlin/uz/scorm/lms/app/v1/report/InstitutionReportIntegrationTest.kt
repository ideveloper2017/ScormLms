package uz.scorm.lms.app.v1.report

import jakarta.transaction.Transactional
import org.apache.poi.xssf.usermodel.XSSFWorkbook
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.security.test.context.support.WithMockUser
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.get
import uz.scorm.lms.app.v1.courses.model.Course
import uz.scorm.lms.app.v1.courses.model.CourseStatus
import uz.scorm.lms.app.v1.courses.repository.CourseRepository
import uz.scorm.lms.app.v1.student.model.Gender
import uz.scorm.lms.app.v1.student.model.StudentProfile
import uz.scorm.lms.app.v1.student.model.StudentStatus
import uz.scorm.lms.app.v1.student.repository.StudentRepository
import uz.scorm.lms.app.v1.user.model.User
import uz.scorm.lms.app.v1.user.repository.UserRepository
import java.io.ByteArrayInputStream
import java.nio.charset.StandardCharsets
import java.time.LocalDate

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class InstitutionReportIntegrationTest {
    @Autowired private lateinit var service: InstitutionReportService
    @Autowired private lateinit var mockMvc: MockMvc
    @Autowired private lateinit var courseRepository: CourseRepository
    @Autowired private lateinit var userRepository: UserRepository
    @Autowired private lateinit var studentRepository: StudentRepository

    @Test
    fun `oqituvchi faqat oz kurslarini tashkilot esa barcha kurslarni koradi`() {
        val firstTeacher = user("report-teacher-one")
        val secondTeacher = user("report-teacher-two")
        val firstCourse = course(firstTeacher, "Birinchi hisobot kursi")
        val secondCourse = course(secondTeacher, "Ikkinchi hisobot kursi")
        student("10000000000991", "REPORT-991", StudentStatus.ACTIVE)
        student("10000000000992", "REPORT-992", StudentStatus.SUSPENDED)

        val rangeStart = LocalDate.now().minusMonths(1)
        val teacherReport = service.report(requireNotNull(firstTeacher.id), false, rangeStart, LocalDate.now())
        val institutionReport = service.report(requireNotNull(firstTeacher.id), true, rangeStart, LocalDate.now())

        assertEquals("TEACHER", teacherReport.scope)
        assertEquals(listOf(firstCourse.id), teacherReport.courses.map { it.courseId })
        assertTrue(teacherReport.courses.none { it.courseId == secondCourse.id })
        assertEquals("INSTITUTION", institutionReport.scope)
        assertTrue(institutionReport.courses.any { it.courseId == firstCourse.id })
        assertTrue(institutionReport.courses.any { it.courseId == secondCourse.id })
        assertEquals(courseRepository.countByDeletedFalse().toDouble(), institutionReport.metric("COURSES"))
        assertEquals(studentRepository.count().toDouble(), institutionReport.metric("STUDENTS"))
        assertEquals(
            studentRepository.countByStudentStatus(StudentStatus.ACTIVE).toDouble(),
            institutionReport.metric("ACTIVE_STUDENTS"),
        )
    }

    @Test
    fun `CSV formulani zararsizlantiradi va XLSX haqiqiy ish kitobi yaratadi`() {
        val teacher = user("report-export-teacher")
        course(teacher, "=HYPERLINK(\"https://example.test\")")
        val from = LocalDate.now().minusDays(1)
        val to = LocalDate.now()

        val csv = service.export(requireNotNull(teacher.id), false, from, to, ReportExportFormat.CSV)
        val csvText = csv.bytes.toString(StandardCharsets.UTF_8)
        assertEquals("text/csv; charset=UTF-8", csv.contentType)
        assertTrue(csvText.startsWith("\uFEFF"))
        assertTrue(csvText.contains("'=HYPERLINK"))

        val xlsx = service.export(requireNotNull(teacher.id), false, from, to, ReportExportFormat.XLSX)
        XSSFWorkbook(ByteArrayInputStream(xlsx.bytes)).use { workbook ->
            assertEquals(listOf("Ko'rsatkichlar", "Kurslar"), (0 until workbook.numberOfSheets).map(workbook::getSheetName))
            assertEquals("=HYPERLINK(\"https://example.test\")", workbook.getSheet("Kurslar").getRow(1).getCell(1).stringCellValue)
        }
    }

    @Test
    @WithMockUser(username = "report-http-teacher", authorities = ["REPORT_READ", "ROLE_TEACHER"])
    fun `teacher HTTP endpointida faqat teacher scope qaytadi`() {
        user("report-http-teacher")
        mockMvc.get("/api/v1/reports/institution")
            .andExpect {
                status { isOk() }
                jsonPath("$.data.scope") { value("TEACHER") }
            }
    }

    @Test
    @WithMockUser(username = "report-http-monitor", authorities = ["STAT_READ", "ROLE_MONITORING"])
    fun `monitoring HTTP endpointida tashkilot scope qaytadi`() {
        user("report-http-monitor")
        mockMvc.get("/api/v1/reports/institution")
            .andExpect {
                status { isOk() }
                jsonPath("$.data.scope") { value("INSTITUTION") }
            }
    }

    private fun InstitutionReportDto.metric(code: String) = metrics.first { it.code == code }.value

    private fun user(username: String) = userRepository.save(User(
        username = username,
        password = "test-password-hash",
        fullName = username,
    ))

    private fun course(owner: User, title: String) = courseRepository.save(Course(
        title = title,
        slug = "${owner.username}-${title.hashCode()}",
        userId = requireNotNull(owner.id),
        status = CourseStatus.PUBLISHED.name,
    ))

    private fun student(pinfl: String, number: String, status: StudentStatus) = studentRepository.save(StudentProfile(
        user = user("student-$number"),
        pinfl = pinfl,
        lastName = "Hisobot",
        firstName = "Talaba",
        birthDate = LocalDate.of(2002, 1, 1),
        gender = Gender.MALE,
        studentNumber = number,
        studentStatus = status,
    ))
}
