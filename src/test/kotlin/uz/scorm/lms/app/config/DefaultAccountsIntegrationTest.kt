package uz.scorm.lms.app.config

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import org.springframework.http.MediaType
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.post
import uz.scorm.lms.app.v1.user.repository.UserRepository

/**
 * Yangi baza migratsiya qilinganda har rol uchun standart akkaunt bor va u o'z roli bilan tizimga kira oladi.
 */
@SpringBootTest(properties = ["app.seed.default-accounts=true"])
@AutoConfigureMockMvc
@ActiveProfiles("test")
class DefaultAccountsIntegrationTest {
    @Autowired private lateinit var mockMvc: MockMvc
    @Autowired private lateinit var userRepository: UserRepository

    @Test
    fun `har rol uchun standart akkaunt yaratilgan va rolga bog'langan`() {
        DEFAULT_ACCOUNTS.forEach { account ->
            val user = requireNotNull(userRepository.findByUsername(account.username)) { "${account.username} yaratilmagan" }
            assertEquals(account.role, user.role?.name, "${account.username} roli")
        }
    }

    @Test
    fun `standart login va parol bilan kirish mumkin`() {
        DEFAULT_ACCOUNTS.forEach { account ->
            mockMvc.post("/api/v1/auth/login") {
                contentType = MediaType.APPLICATION_JSON
                content = """{"username":"${account.username}","password":"$DEFAULT_ACCOUNT_PASSWORD"}"""
            }.andExpect {
                status { isOk() }
                jsonPath("$.data.accessToken") { isNotEmpty() }
                jsonPath("$.data.user.username") { value(account.username) }
            }
        }
    }
}
