package uz.scorm.lms.app.v1.student

import jakarta.transaction.Transactional
import org.apache.poi.ss.usermodel.CellType
import org.apache.poi.xssf.usermodel.XSSFWorkbook
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.security.test.context.support.WithMockUser
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.get
import uz.scorm.lms.app.v1.audit.repository.AuditLogRepository
import uz.scorm.lms.app.v1.group.model.Group
import uz.scorm.lms.app.v1.group.repository.GroupRepository
import uz.scorm.lms.app.v1.program.model.Program
import uz.scorm.lms.app.v1.program.repository.ProgramRepository
import uz.scorm.lms.app.v1.student.model.Gender
import uz.scorm.lms.app.v1.student.model.StudentProfile
import uz.scorm.lms.app.v1.student.model.StudentStatus
import uz.scorm.lms.app.v1.student.repository.StudentRepository
import uz.scorm.lms.app.v1.student.service.StudentRegistryService
import uz.scorm.lms.app.v1.user.model.User
import uz.scorm.lms.app.v1.user.repository.UserRepository
import java.io.ByteArrayInputStream
import java.nio.file.Files
import java.nio.file.Path
import java.time.LocalDate

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class StudentRegistryIntegrationTest {
    @Autowired private lateinit var service: StudentRegistryService
    @Autowired private lateinit var studentRepository: StudentRepository
    @Autowired private lateinit var userRepository: UserRepository
    @Autowired private lateinit var programRepository: ProgramRepository
    @Autowired private lateinit var groupRepository: GroupRepository
    @Autowired private lateinit var auditLogRepository: AuditLogRepository
    @Autowired private lateinit var mockMvc: MockMvc

    @Test
    fun `server qidiruvi status filtri va PII xavfsiz Excel auditi ishlaydi`() {
        val actor = user("registry-export-actor")
        val program = programRepository.save(Program(name = "Dastur =X", code = "606100", degreeLevel = "BACHELOR"))
        val group = groupRepository.save(Group(name = "=XAVFLI-GURUH", educationYear = "2026-2027", language = "uz", program = program))
        student(
            pinfl = "12345678901234", number = "=REG-001", lastName = "Saidov", firstName = "Bekzod",
            status = StudentStatus.ACTIVE, phone = "+998 90 123 45 67", email = "saidov@example.uz",
            programId = requireNotNull(program.id), groupId = requireNotNull(group.id),
        )
        student(
            pinfl = "99999999999999", number = "REG-002", lastName = "Karimov", firstName = "Ali",
            status = StudentStatus.SUSPENDED, phone = "+998 91 765 43 21", email = "ali@example.uz",
        )

        val page = service.search("Saidov", StudentStatus.ACTIVE, 0, 10)
        assertEquals(1, page.totalElements)
        assertEquals("=REG-001", page.items.single().studentNumber)
        assertEquals(0, page.page)

        val export = service.export("Saidov", StudentStatus.ACTIVE, requireNotNull(actor.id))
        val output = Path.of("build", "test-results", "student-registry-v60.xlsx")
        Files.createDirectories(output.parent)
        Files.write(output, export.bytes)

        XSSFWorkbook(ByteArrayInputStream(export.bytes)).use { workbook ->
            assertEquals(listOf("Talabalar"), (0 until workbook.numberOfSheets).map(workbook::getSheetName))
            val sheet = workbook.getSheet("Talabalar")
            val row = sheet.getRow(4)
            assertEquals("'=REG-001", row.getCell(1).stringCellValue)
            assertEquals("**********1234", row.getCell(3).stringCellValue)
            assertEquals("+*** ** *** ** 67", row.getCell(4).stringCellValue)
            assertEquals("s***@example.uz", row.getCell(5).stringCellValue)
            assertEquals("'=XAVFLI-GURUH", row.getCell(13).stringCellValue)
            assertEquals(4, sheet.paneInformation.horizontalSplitPosition.toInt())
            assertEquals("A4:O5", sheet.ctWorksheet.autoFilter.ref)
            sheet.forEach { excelRow -> excelRow.forEach { assertFalse(it.cellType == CellType.FORMULA) } }
            val allText = sheet.flatMap { excelRow -> excelRow.map { it.toString() } }.joinToString("|")
            assertFalse(allText.contains("12345678901234"))
            assertFalse(allText.contains("+998 90 123 45 67"))
            assertFalse(allText.contains("saidov@example.uz"))
        }

        val audit = auditLogRepository.findByUsernameOrderByTimestampDesc(requireNotNull(actor.id).toString())
            .first { it.action == "STUDENT_REGISTRY_EXPORTED" }
        assertTrue(audit.details.orEmpty().contains("pii=MASKED"))
        assertTrue(audit.details.orEmpty().contains("rows=1"))
        assertFalse(audit.details.orEmpty().contains("Saidov"))
    }

    @Test
    @WithMockUser(username = "registry-http-reader", authorities = ["USER_READ"])
    fun `Excel eksport REPORT_READ siz taqiqlanadi`() {
        user("registry-http-reader")
        mockMvc.get("/api/v1/students/export").andExpect { status { isForbidden() } }
    }

    @Test
    @WithMockUser(username = "registry-http-reporter", authorities = ["USER_READ", "REPORT_READ"])
    fun `Excel eksport ruxsat bilan private no-store qaytadi`() {
        user("registry-http-reporter")
        mockMvc.get("/api/v1/students/export")
            .andExpect {
                status { isOk() }
                header { string("Cache-Control", "private, no-store") }
                header { string("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") }
            }
    }

    private fun user(username: String) = userRepository.save(User(
        username = username,
        password = "test-password-hash",
        fullName = username,
    ))

    private fun student(
        pinfl: String,
        number: String,
        lastName: String,
        firstName: String,
        status: StudentStatus,
        phone: String,
        email: String,
        programId: Long? = null,
        groupId: Long? = null,
    ) = studentRepository.save(StudentProfile(
        user = user("student-${number.hashCode()}"),
        pinfl = pinfl,
        lastName = lastName,
        firstName = firstName,
        birthDate = LocalDate.of(2002, 1, 1),
        gender = Gender.MALE,
        phoneNumber = phone,
        email = email,
        studentNumber = number,
        programId = programId,
        groupId = groupId,
        academicYear = programId?.let { "2026-2027" },
        semesterNumber = programId?.let { 1 },
        courseNumber = 1,
        studentStatus = status,
    ))
}
