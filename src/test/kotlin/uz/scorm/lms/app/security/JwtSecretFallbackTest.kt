package uz.scorm.lms.app.security

import io.jsonwebtoken.Jwts
import io.jsonwebtoken.SignatureAlgorithm
import io.jsonwebtoken.security.Keys
import org.springframework.mock.env.MockEnvironment
import java.util.Date
import org.springframework.security.core.userdetails.User
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertNotNull
import kotlin.test.assertNull
import kotlin.test.assertTrue

/**
 * Yaroqsiz JWT_SECRET deployni yiqitmasligi, lekin zaif kalit bilan ham ishlamasligi kerak:
 * ilova tasodifiy kalitga o'tadi (ilgari ProductionSecretsGuard ilovani ishga tushirmasdi).
 */
class JwtSecretFallbackTest {

    private val strong = "k".repeat(64)
    private val envExample = "CHANGE_ME_WITH_A_RANDOM_SECRET_OF_AT_LEAST_64_BYTES_NEVER_COMMIT_REAL_VALUE"
    private val devDefault = "dev-only-secret-do-not-use-in-production-0123456789abcdefghijklmnop"
    private val user = User.withUsername("ali").password("x").authorities("ROLE_STUDENT").build()

    private fun service(secret: String, vararg profiles: String) = JwtService(
        configuredSecret = secret,
        expirationMs = 60_000,
        accessTokenExpirationInMs = 60_000,
        refreshTokenExpirationInMs = 60_000,
        environment = MockEnvironment().apply { setActiveProfiles(*profiles) },
    )

    @Test
    fun `yaroqli kalit muammo emas`() {
        assertNull(jwtSecretProblem(strong, production = true))
        assertNull(jwtSecretProblem(devDefault, production = false))
    }

    @Test
    fun `bo'sh, qisqa, namuna va productiondagi dev kaliti yaroqsiz`() {
        assertNotNull(jwtSecretProblem("", production = true))
        assertNotNull(jwtSecretProblem("k".repeat(63), production = true))
        assertNotNull(jwtSecretProblem(envExample, production = true))
        assertNotNull(jwtSecretProblem(envExample, production = false))
        assertNotNull(jwtSecretProblem(devDefault, production = true))
    }

    @Test
    fun `yaroqsiz kalit bilan ham servis ishga tushadi va token beradi`() {
        for (bad in listOf("", "qisqa", envExample, devDefault)) {
            val jwt = service(bad, "postgresql-prod")
            val token = jwt.generateToken(user)

            assertEquals("ali", jwt.extractUsername(token))
            assertTrue(jwt.isTokenValid(token, user))
        }
    }

    @Test
    fun `namuna kalit ishlatilmaydi - u bilan imzolangan token rad etiladi`() {
        // Hujumchi .env.example dagi hammaga ma'lum kalit bilan token yasaydi
        val forged = Jwts.builder()
            .setSubject("ali")
            .setExpiration(Date(System.currentTimeMillis() + 60_000))
            .signWith(Keys.hmacShaKeyFor(envExample.toByteArray()), SignatureAlgorithm.HS256)
            .compact()
        val server = service(envExample, "postgresql-prod")

        assertFalse(runCatching { server.isTokenValid(forged, user) }.getOrDefault(false))
    }

    @Test
    fun `har ishga tushishda tasodifiy kalit boshqacha`() {
        val first = service("", "postgresql-prod")
        val second = service("", "postgresql-prod")

        val token = first.generateToken(user)
        assertTrue(first.isTokenValid(token, user))
        assertFalse(runCatching { second.isTokenValid(token, user) }.getOrDefault(false))
    }

    @Test
    fun `yaroqli kalit o'zgarishsiz ishlatiladi - qayta ishga tushganda tokenlar amal qiladi`() {
        val token = service(strong, "postgresql-prod").generateToken(user)

        assertTrue(service(strong, "postgresql-prod").isTokenValid(token, user))
    }
}
