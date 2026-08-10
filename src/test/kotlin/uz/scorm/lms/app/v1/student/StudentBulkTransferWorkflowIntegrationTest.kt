package uz.scorm.lms.app.v1.student

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.http.MediaType
import org.springframework.security.test.context.support.WithMockUser
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.post
import uz.scorm.lms.app.v1.audit.repository.AuditLogRepository
import uz.scorm.lms.app.v1.group.model.Group
import uz.scorm.lms.app.v1.group.repository.GroupRepository
import uz.scorm.lms.app.v1.program.model.Program
import uz.scorm.lms.app.v1.program.repository.ProgramRepository
import uz.scorm.lms.app.v1.student.dto.StudentBulkTransferRequest
import uz.scorm.lms.app.v1.student.model.DegreeLevel
import uz.scorm.lms.app.v1.student.model.EducationForm
import uz.scorm.lms.app.v1.student.model.Gender
import uz.scorm.lms.app.v1.student.model.StudentProfile
import uz.scorm.lms.app.v1.student.model.StudentStatus
import uz.scorm.lms.app.v1.student.repository.StudentRepository
import uz.scorm.lms.app.v1.student.service.StudentBulkTransferService
import uz.scorm.lms.app.v1.student.service.StudentLifecycleService
import uz.scorm.lms.app.v1.user.model.User
import uz.scorm.lms.app.v1.user.model.UserStatus
import uz.scorm.lms.app.v1.user.repository.UserRepository
import java.time.LocalDate

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class StudentBulkTransferWorkflowIntegrationTest {
    @Autowired private lateinit var bulkTransferService: StudentBulkTransferService
    @Autowired private lateinit var lifecycleService: StudentLifecycleService
    @Autowired private lateinit var studentRepository: StudentRepository
    @Autowired private lateinit var userRepository: UserRepository
    @Autowired private lateinit var programRepository: ProgramRepository
    @Autowired private lateinit var groupRepository: GroupRepository
    @Autowired private lateinit var auditLogRepository: AuditLogRepository
    @Autowired private lateinit var mockMvc: MockMvc

    @Test
    fun `ikki talaba bitta buyruq bilan deterministik ko'chiriladi`() {
        val actor = user("bulk-transfer-actor")
        val source = program("Boshlang'ich dastur")
        val target = program("Yangi dastur")
        val group = groupRepository.save(Group(name = "YANGI-26", educationYear = "2026-2027", language = "uz", program = target))
        val first = student(source, StudentStatus.ACTIVE)
        val second = student(source, StudentStatus.SUSPENDED)

        val result = bulkTransferService.transfer(
            request(listOf(requireNotNull(second.id), requireNotNull(first.id)), requireNotNull(target.id), requireNotNull(group.id)),
            requireNotNull(actor.id),
        )

        assertEquals(2, result.processedCount)
        assertEquals(listOf(requireNotNull(first.id), requireNotNull(second.id)).sorted(), result.items.map { it.studentId })
        assertTrue(result.items.all { it.toProgramId == target.id && it.toGroupId == group.id })
        assertEquals(StudentStatus.ACTIVE, result.items.first { it.studentId == first.id }.studentStatus)
        assertEquals(StudentStatus.SUSPENDED, result.items.first { it.studentId == second.id }.studentStatus)
        assertTrue(listOf(first, second).all {
            val saved = studentRepository.findById(requireNotNull(it.id)).orElseThrow()
            saved.programId == target.id && saved.groupId == group.id
        })
        assertTrue(listOf(first, second).all { lifecycleService.history(requireNotNull(it.id)).single().orderNumber == "BULK-12/2026" })
        val audit = auditLogRepository.findByUsernameOrderByTimestampDesc(requireNotNull(actor.id).toString())
            .first { it.action == "STUDENT_BULK_TRANSFER_COMPLETED" }
        assertTrue(audit.details.orEmpty().contains("count=2"))
    }

    @Test
    fun `bitta yaroqsiz talaba butun ommaviy transferni rollback qiladi`() {
        val actor = user("bulk-rollback-actor")
        val source = program("Rollback manba")
        val target = program("Rollback maqsad")
        val valid = student(source, StudentStatus.ACTIVE)
        val invalid = student(source, StudentStatus.REGISTERED)

        val error = assertThrows<IllegalArgumentException> {
            bulkTransferService.transfer(
                request(listOf(requireNotNull(valid.id), requireNotNull(invalid.id)), requireNotNull(target.id), null),
                requireNotNull(actor.id),
            )
        }
        assertTrue(error.message.orEmpty().contains("Talaba ${invalid.id}"))
        assertEquals(source.id, studentRepository.findById(requireNotNull(valid.id)).orElseThrow().programId)
        assertTrue(lifecycleService.history(requireNotNull(valid.id)).isEmpty())
        assertTrue(lifecycleService.history(requireNotNull(invalid.id)).isEmpty())
        assertTrue(auditLogRepository.findByUsernameOrderByTimestampDesc(requireNotNull(actor.id).toString())
            .none { it.action == "STUDENT_BULK_TRANSFER_COMPLETED" })
    }

    @Test
    fun `takroriy ID va bittalik paket serverda rad etiladi`() {
        val actor = user("bulk-limit-actor")
        val source = program("Limit manba")
        val target = program("Limit maqsad")
        val candidate = student(source, StudentStatus.ACTIVE)
        val id = requireNotNull(candidate.id)

        assertThrows<IllegalArgumentException> {
            bulkTransferService.transfer(request(listOf(id), requireNotNull(target.id), null), requireNotNull(actor.id))
        }
        assertThrows<IllegalArgumentException> {
            bulkTransferService.transfer(request(listOf(id, id), requireNotNull(target.id), null), requireNotNull(actor.id))
        }
        assertEquals(source.id, studentRepository.findById(id).orElseThrow().programId)
    }

    @Test
    @WithMockUser(username = "bulk-read-only", authorities = ["ACADEMIC_READ", "USER_READ"])
    fun `bulk transfer endpointi ACADEMIC_WRITE siz taqiqlanadi`() {
        userRepository.save(User(
            username = "bulk-read-only",
            password = "encoded-password",
            fullName = "Faqat o'qish foydalanuvchisi",
            status = UserStatus.ACTIVE,
        ))
        mockMvc.post("/api/v1/students/bulk-transfer") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"studentIds":[1,2],"targetProgramId":3,"orderNumber":"B-1","orderDate":"2026-08-01","effectiveDate":"2026-08-01","legalBasis":"Huquqiy asos","reason":"Ko'chirish sababi"}"""
        }.andExpect { status { isForbidden() } }
    }

    private fun request(studentIds: List<Long>, targetProgramId: Long, targetGroupId: Long?) = StudentBulkTransferRequest(
        studentIds = studentIds,
        targetProgramId = targetProgramId,
        targetGroupId = targetGroupId,
        academicYear = "2026-2027",
        orderNumber = "BULK-12/2026",
        orderDate = LocalDate.now().minusDays(2),
        effectiveDate = LocalDate.now().minusDays(1),
        legalBasis = "559-son qaror va talabalar harakati reglamenti",
        reason = "Talabalarni boshqa ta'lim dasturiga ommaviy ko'chirish buyrug'i",
    )

    private fun program(name: String) = programRepository.save(Program(
        name = name,
        code = "BULK-${System.nanoTime()}",
        degreeLevel = "BACHELOR",
        active = true,
        educationLanguage = "uz",
    ))

    private fun student(program: Program, status: StudentStatus): StudentProfile {
        val login = user("bulk-student").also { it.status = if (status == StudentStatus.ACTIVE) UserStatus.ACTIVE else UserStatus.INACTIVE }
        return studentRepository.save(StudentProfile(
            user = login,
            pinfl = System.nanoTime().toString().takeLast(14).padStart(14, '7'),
            lastName = "Karimov",
            firstName = "Ali",
            birthDate = LocalDate.of(2002, 2, 2),
            gender = Gender.MALE,
            studentNumber = "BULK-ST-${System.nanoTime()}",
            programId = program.id,
            degreeLevel = DegreeLevel.BACHELOR,
            educationForm = EducationForm.FULL_TIME,
            educationLanguage = "uz",
            academicYear = "2026-2027",
            studentStatus = status,
        ))
    }

    private fun user(prefix: String) = userRepository.save(User(
        username = "$prefix-${System.nanoTime()}",
        password = "encoded-password",
        fullName = "Test foydalanuvchi",
        status = UserStatus.ACTIVE,
    ))
}
