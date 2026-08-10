package uz.scorm.lms.app.v1.student

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
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
import org.springframework.test.web.servlet.patch
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.audit.repository.AuditLogRepository
import uz.scorm.lms.app.v1.student.dto.StudentAccountAccessRequest
import uz.scorm.lms.app.v1.student.dto.StudentPersonalProfileUpdateRequest
import uz.scorm.lms.app.v1.student.dto.StudentRegistrationRequest
import uz.scorm.lms.app.v1.student.model.Gender
import uz.scorm.lms.app.v1.student.model.StudentProfile
import uz.scorm.lms.app.v1.student.model.StudentStatus
import uz.scorm.lms.app.v1.student.repository.StudentRepository
import uz.scorm.lms.app.v1.student.service.StudentAccountService
import uz.scorm.lms.app.v1.student.service.StudentService
import uz.scorm.lms.app.v1.user.model.User
import uz.scorm.lms.app.v1.user.model.UserStatus
import uz.scorm.lms.app.v1.user.repository.UserRepository
import java.time.LocalDate

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class StudentAccountWorkflowIntegrationTest {
    @Autowired private lateinit var accountService: StudentAccountService
    @Autowired private lateinit var studentService: StudentService
    @Autowired private lateinit var studentRepository: StudentRepository
    @Autowired private lateinit var userRepository: UserRepository
    @Autowired private lateinit var auditLogRepository: AuditLogRepository
    @Autowired private lateinit var mockMvc: MockMvc

    @Test
    fun `faol talaba akkaunti sabab bilan bloklanadi va qayta yoqiladi`() {
        val actor = user("account-admin")
        val student = student(StudentStatus.ACTIVE, UserStatus.ACTIVE)

        val blocked = accountService.changeAccess(
            requireNotNull(student.id), StudentAccountAccessRequest(false, "Axborot xavfsizligi murojaati"), requireNotNull(actor.id),
        )
        assertEquals(UserStatus.BLOCKED, blocked.accountStatus)
        assertFalse(blocked.accountEnabled)

        val enabled = accountService.changeAccess(
            requireNotNull(student.id), StudentAccountAccessRequest(true, "Administrator tekshiruvi yakunlandi"), requireNotNull(actor.id),
        )
        assertEquals(UserStatus.ACTIVE, enabled.accountStatus)
        assertTrue(enabled.accountEnabled)

        val audits = auditLogRepository.findByUsernameOrderByTimestampDesc(requireNotNull(actor.id).toString())
        assertTrue(audits.any { it.action == "STUDENT_ACCOUNT_BLOCKED" && it.details.orEmpty().contains("student=${student.id}") })
        assertTrue(audits.any { it.action == "STUDENT_ACCOUNT_ENABLED" })
    }

    @Test
    fun `qabul qilinmagan talaba akkauntini yoqish rad etiladi`() {
        val actor = user("account-guard-admin")
        val student = student(StudentStatus.REGISTERED, UserStatus.INACTIVE)
        val error = assertThrows<IllegalArgumentException> {
            accountService.changeAccess(
                requireNotNull(student.id), StudentAccountAccessRequest(true, "Qabuldan oldin yoqish urinish"), requireNotNull(actor.id),
            )
        }
        assertTrue(error.message.orEmpty().contains("ACTIVE"))
        assertEquals(UserStatus.INACTIVE, studentRepository.findById(requireNotNull(student.id)).orElseThrow().user.status)
    }

    @Test
    fun `shaxsiy kartochka amallari PII siz alohida auditlanadi`() {
        val actor = user("personal-card-admin")
        val suffix = System.nanoTime().toString()
        val pinfl = suffix.takeLast(14).padStart(14, '8')
        val created = studentService.register(StudentRegistrationRequest(
            pinfl = pinfl,
            lastName = "Rahimov",
            firstName = "Aziz",
            birthDate = LocalDate.of(2003, 4, 5),
            gender = Gender.MALE,
            studentNumber = "CARD-$suffix",
            password = "Student@12345",
        ), requireNotNull(actor.id))
        studentService.updatePersonalProfile(requireNotNull(created.id), StudentPersonalProfileUpdateRequest(
            lastName = "Rahimov",
            firstName = "Azizbek",
            phoneNumber = "+998901234567",
        ), requireNotNull(actor.id))

        val audits = auditLogRepository.findByUsernameOrderByTimestampDesc(requireNotNull(actor.id).toString())
        assertTrue(audits.any { it.action == "STUDENT_PERSONAL_CARD_CREATED" })
        assertTrue(audits.any { it.action == "STUDENT_PERSONAL_PROFILE_UPDATED" })
        assertFalse(audits.joinToString("|") { it.details.orEmpty() }.contains(pinfl))
    }

    @Test
    @WithMockUser(username = "account-read-only", authorities = ["USER_READ"])
    fun `akkaunt endpointi USER_MANAGE siz taqiqlanadi`() {
        userRepository.save(User(
            username = "account-read-only",
            password = "encoded-password",
            fullName = "Faqat ko'rish foydalanuvchisi",
            status = UserStatus.ACTIVE,
        ))
        val target = student(StudentStatus.ACTIVE, UserStatus.ACTIVE)
        mockMvc.patch("/api/v1/students/${target.id}/account-access") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"enabled":false,"reason":"Xavfsizlik tekshiruvi"}"""
        }.andExpect { status { isForbidden() } }
    }

    private fun student(studentStatus: StudentStatus, accountStatus: UserStatus): StudentProfile {
        val login = user("student-account").also { it.status = accountStatus }
        return studentRepository.save(StudentProfile(
            user = login,
            pinfl = System.nanoTime().toString().takeLast(14).padStart(14, '6'),
            lastName = "Karimov",
            firstName = "Ali",
            birthDate = LocalDate.of(2002, 1, 1),
            gender = Gender.MALE,
            studentNumber = "ACC-${System.nanoTime()}",
            studentStatus = studentStatus,
        ))
    }

    private fun user(prefix: String) = userRepository.save(User(
        username = "$prefix-${System.nanoTime()}",
        password = "encoded-password",
        fullName = "Test foydalanuvchi",
        status = UserStatus.ACTIVE,
    ))
}
