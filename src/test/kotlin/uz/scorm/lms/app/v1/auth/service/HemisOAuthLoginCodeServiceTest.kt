package uz.scorm.lms.app.v1.auth.service

import io.mockk.every
import io.mockk.mockk
import io.mockk.slot
import org.junit.jupiter.api.Assertions.assertNotEquals
import org.junit.jupiter.api.Assertions.assertSame
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Test
import uz.scorm.lms.app.v1.auth.model.HemisOAuthLoginCode
import uz.scorm.lms.app.v1.auth.repository.HemisOAuthLoginCodeRepository
import uz.scorm.lms.app.v1.user.model.User

class HemisOAuthLoginCodeServiceTest {
    @Test
    fun `issued code is stored hashed and can only be consumed once`() {
        val repository = mockk<HemisOAuthLoginCodeRepository>()
        val saved = slot<HemisOAuthLoginCode>()
        every { repository.deleteByExpiresAtBefore(any()) } returns 0
        every { repository.save(capture(saved)) } answers { saved.captured }
        every { repository.findByCodeHashForUpdate(any()) } answers { saved.captured }
        val service = HemisOAuthLoginCodeService(repository, 60)
        val user = mockk<User>()

        val rawCode = service.issue(user)
        val consumedUser = service.consume(rawCode)

        assertSame(user, consumedUser)
        assertNotEquals(rawCode, saved.captured.codeHash)
        assertThrows(IllegalArgumentException::class.java) { service.consume(rawCode) }
    }

    @Test
    fun `unsafe TTL configuration is rejected`() {
        assertThrows(IllegalArgumentException::class.java) {
            HemisOAuthLoginCodeService(mockk(), 600)
        }
    }
}
