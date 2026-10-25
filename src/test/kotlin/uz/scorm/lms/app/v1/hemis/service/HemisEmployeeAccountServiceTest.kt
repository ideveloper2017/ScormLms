package uz.scorm.lms.app.v1.hemis.service

import io.mockk.every
import io.mockk.mockk
import io.mockk.slot
import io.mockk.verify
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertSame
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Test
import org.springframework.security.oauth2.core.user.DefaultOAuth2User
import uz.scorm.lms.app.v1.teacher.model.Teacher
import uz.scorm.lms.app.v1.teacher.repository.TeacherRepository
import uz.scorm.lms.app.v1.user.model.User
import uz.scorm.lms.app.v1.user.model.UserStatus
import uz.scorm.lms.app.v1.user.repository.UserRepository
import uz.scorm.lms.app.v1.user.service.UserService

class HemisEmployeeAccountServiceTest {
    private val teachers = mockk<TeacherRepository>(relaxed = true)
    private val users = mockk<UserRepository>(relaxed = true)
    private val userService = mockk<UserService>()
    private val service = HemisEmployeeAccountService(teachers, users, userService, "employee_id_number", "login")

    init {
        every { teachers.save(any<Teacher>()) } answers { firstArg() }
    }

    @Test
    fun `HEMIS xodim identifikatori boyicha oqituvchi akkaunti topiladi`() {
        val user = User(username = "aliyev")
        val teacher = Teacher(fullName = "Aliyev Vali", hemisEmployeeId = "3051", user = user).apply { id = 5 }
        every { teachers.findByHemisEmployeeId("3051") } returns teacher
        every { teachers.findByHemisLoginIgnoreCase("aliyev.v") } returns null

        val resolved = service.resolveActiveUser(principal("3051", "aliyev.v"))

        assertSame(user, resolved)
    }

    @Test
    fun `login boyicha bog'langan oqituvchiga akkaunt yaratiladi va ID eslab qolinadi`() {
        val teacher = Teacher(fullName = "Karimova Zuhra", hemisLogin = "karimova.z", email = "z@univ.uz").apply { id = 6 }
        every { teachers.findByHemisEmployeeId("4100") } returns null
        every { teachers.findByHemisLoginIgnoreCase("karimova.z") } returns teacher
        every { users.existsByUsername("karimova.z") } returns false
        every { users.findByEmail("z@univ.uz") } returns null
        val password = slot<String>()
        every { userService.register("karimova.z", capture(password), "teacher") } answers { User(username = firstArg()) }
        every { users.save(any()) } answers { firstArg() }

        val resolved = service.resolveTeacher("4100", "karimova.z")

        assertEquals("karimova.z", resolved.username)
        assertEquals("Karimova Zuhra", resolved.fullName)
        assertEquals("z@univ.uz", resolved.email)
        assertSame(resolved, teacher.user)
        assertEquals("4100", teacher.hemisEmployeeId)
        assert(password.captured.length >= 32)
        verify { teachers.save(teacher) }
    }

    @Test
    fun `boglanmagan HEMIS xodimi rad etiladi`() {
        every { teachers.findByHemisEmployeeId(any()) } returns null
        every { teachers.findByHemisLoginIgnoreCase(any()) } returns null

        val error = assertThrows(NoSuchElementException::class.java) { service.resolveTeacher("1", "nobody") }

        assertEquals("HEMIS_ACCOUNT_NOT_LINKED", error.message)
    }

    @Test
    fun `ID va login turli oqituvchilarga tegishli bolsa ziddiyat`() {
        every { teachers.findByHemisEmployeeId("1") } returns Teacher(fullName = "A").apply { id = 1 }
        every { teachers.findByHemisLoginIgnoreCase("b") } returns Teacher(fullName = "B").apply { id = 2 }

        val error = assertThrows(IllegalStateException::class.java) { service.resolveTeacher("1", "b") }

        assertEquals("HEMIS_ACCOUNT_CONFLICT", error.message)
    }

    @Test
    fun `nofaol oqituvchi yoki akkaunt kira olmaydi`() {
        every { teachers.findByHemisEmployeeId("7") } returns Teacher(fullName = "C", active = false, hemisEmployeeId = "7")
        assertThrows(IllegalStateException::class.java) { service.resolveTeacher("7", null) }

        every { teachers.findByHemisEmployeeId("8") } returns
            Teacher(fullName = "D", hemisEmployeeId = "8", user = User(username = "d", status = UserStatus.BLOCKED))
        val error = assertThrows(IllegalStateException::class.java) { service.resolveTeacher("8", null) }
        assertEquals("HEMIS_ACCOUNT_INACTIVE", error.message)
    }

    private fun principal(employeeId: String, login: String) = DefaultOAuth2User(
        emptyList(),
        mapOf("id" to 99, "employee_id_number" to employeeId, "login" to login),
        "id",
    )
}
