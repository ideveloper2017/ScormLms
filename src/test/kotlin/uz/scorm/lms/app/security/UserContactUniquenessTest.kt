package uz.scorm.lms.app.security

import io.mockk.every
import io.mockk.mockk
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertDoesNotThrow
import org.junit.jupiter.api.assertThrows
import org.springframework.dao.DataIntegrityViolationException
import org.springframework.http.HttpStatus
import uz.scorm.lms.app.common.RestExceptionHandler
import uz.scorm.lms.app.v1.user.repository.UserRepository
import uz.scorm.lms.app.v1.user.service.UserService

class UserContactUniquenessTest {
    private val users = mockk<UserRepository>()
    private val service = UserService(users, mockk(relaxed = true), mockk(relaxed = true), mockk(relaxed = true),
        mockk(relaxed = true), mockk(relaxed = true), mockk(relaxed = true), PasswordPolicy())

    @Test
    fun `boshqa foydalanuvchidagi telefon yoki email saqlashdan oldin rad etiladi`() {
        every { users.existsByPhone("+998902194617") } returns true
        every { users.existsByEmail(any()) } returns false
        every { users.existsByPhoneAndIdNot("+998902194617", 28) } returns false
        every { users.existsByEmailAndIdNot("band@example.test", 28) } returns true

        val phone = assertThrows<IllegalArgumentException> { service.requireContactAvailable("+998902194617", null) }
        assertEquals("Bu telefon raqami boshqa foydalanuvchida bor: +998902194617", phone.message)
        // O'z raqami (tahrirlashda) — mumkin; boshqaning emaili — yo'q
        assertDoesNotThrow { service.requireContactAvailable("+998902194617", null, 28) }
        assertThrows<IllegalArgumentException> { service.requireContactAvailable(null, "band@example.test", 28) }
        assertDoesNotThrow { service.requireContactAvailable(" ", "", null) }
    }

    @Test
    fun `tekshirilmagan unikallik xatosi 500 emas, tushunarli 409`() {
        val error = DataIntegrityViolationException("could not execute batch",
            RuntimeException("ERROR: duplicate key value violates unique constraint \"users_phone_key\""))

        val response = RestExceptionHandler().conflict(error)

        assertEquals(HttpStatus.CONFLICT, response.statusCode)
        assertEquals("Bu telefon raqami boshqa foydalanuvchida bor", response.body?.message)
    }
}
