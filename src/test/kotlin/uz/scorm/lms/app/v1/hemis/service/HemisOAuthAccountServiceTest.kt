package uz.scorm.lms.app.v1.hemis.service

import io.mockk.every
import io.mockk.mockk
import org.junit.jupiter.api.Assertions.assertSame
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Test
import org.springframework.security.oauth2.core.user.DefaultOAuth2User
import uz.scorm.lms.app.v1.student.model.StudentProfile
import uz.scorm.lms.app.v1.student.model.StudentStatus
import uz.scorm.lms.app.v1.student.repository.StudentRepository
import uz.scorm.lms.app.v1.user.model.User
import uz.scorm.lms.app.v1.user.model.UserStatus

class HemisOAuthAccountServiceTest {
    private val repository = mockk<StudentRepository>()
    private val service = HemisOAuthAccountService(repository, "id", "login")

    @Test
    fun `resolves an active student by stable HEMIS id`() {
        val user = activeUser()
        val student = activeStudent(1L, user)
        every { repository.findByHemisId(77L) } returns student
        every { repository.findByStudentNumber("S-100") } returns student

        val resolved = service.resolveActiveUser(principal(77L, "S-100"))

        assertSame(user, resolved)
    }

    @Test
    fun `rejects conflicting HEMIS id and student number`() {
        every { repository.findByHemisId(77L) } returns activeStudent(1L, activeUser())
        every { repository.findByStudentNumber("S-100") } returns activeStudent(2L, activeUser())

        val error = assertThrows(IllegalStateException::class.java) {
            service.resolveActiveUser(principal(77L, "S-100"))
        }

        kotlin.test.assertEquals("HEMIS_ACCOUNT_CONFLICT", error.message)
    }

    @Test
    fun `rejects a student number already linked to another HEMIS id`() {
        val student = activeStudent(1L, activeUser())
        every { student.hemisId } returns 88L
        every { repository.findByHemisId(77L) } returns null
        every { repository.findByStudentNumber("S-100") } returns student

        assertThrows(IllegalStateException::class.java) {
            service.resolveActiveUser(principal(77L, "S-100"))
        }
    }

    @Test
    fun `rejects inactive academic account`() {
        val user = activeUser()
        val student = mockk<StudentProfile>()
        every { student.id } returns 1L
        every { student.user } returns user
        every { student.studentStatus } returns StudentStatus.SUSPENDED
        every { student.hemisId } returns null
        every { repository.findByHemisId(77L) } returns student
        every { repository.findByStudentNumber("S-100") } returns student

        assertThrows(IllegalStateException::class.java) {
            service.resolveActiveUser(principal(77L, "S-100"))
        }
    }

    private fun principal(id: Long, login: String) = DefaultOAuth2User(
        emptyList(),
        mapOf("id" to id, "login" to login),
        "id",
    )

    private fun activeUser(): User = mockk<User>().also {
        every { it.status } returns UserStatus.ACTIVE
    }

    private fun activeStudent(id: Long, user: User): StudentProfile = mockk<StudentProfile>().also {
        every { it.id } returns id
        every { it.user } returns user
        every { it.studentStatus } returns StudentStatus.ACTIVE
        every { it.hemisId } returns null
    }
}
