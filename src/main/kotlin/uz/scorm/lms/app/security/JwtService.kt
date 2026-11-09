package uz.scorm.lms.app.security

import io.jsonwebtoken.Claims
import io.jsonwebtoken.Jwts
import io.jsonwebtoken.SignatureAlgorithm
import io.jsonwebtoken.io.Decoders
import io.jsonwebtoken.security.Keys
import mu.KotlinLogging
import org.springframework.beans.factory.annotation.Value
import org.springframework.core.env.Environment
import org.springframework.core.env.Profiles
import org.springframework.security.core.GrantedAuthority
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.stereotype.Service

import java.nio.charset.StandardCharsets
import java.security.Key
import java.security.SecureRandom
import java.util.*
import kotlin.math.log

private val logger = KotlinLogging.logger {}

@Service
class JwtService(
    @Value("\${app.jwt.secret}") configuredSecret: String,
    @Value("\${app.jwt.expiration-ms:86400000}") private val expirationMs: Long,
    @Value("\${app.jwt.expiration}")
    private val accessTokenExpirationInMs: Long,
    @Value("\${app.jwt.refresh-expiration:2592000000}") // 30 days default
    private val refreshTokenExpirationInMs: Long,
    environment: Environment,
) {
    /**
     * Yaroqsiz JWT_SECRET ilovani to'xtatmaydi: uning o'rniga tasodifiy kalit ishlatiladi va logga ogohlantirish
     * yoziladi. Shunda zaif yoki namuna kalit bilan token soxtalashtirib bo'lmaydi, lekin deploy ham yiqilmaydi.
     * Tasodifiy kalit har ishga tushganda yangilanadi: foydalanuvchilar sessiyasi cookie orqali o'zi tiklanadi.
     */
    private val secret: String = run {
        val production = environment.acceptsProfiles(Profiles.of("postgresql-prod"))
        val problem = jwtSecretProblem(configuredSecret, production) ?: return@run configuredSecret
        logger.warn {
            "JWT_SECRET yaroqsiz ($problem): vaqtinchalik tasodifiy kalit ishlatilmoqda. " +
                "Doimiy kalit uchun JWT_SECRET ga kamida 64 belgili tasodifiy qiymat bering (openssl rand -base64 96)."
        }
        Base64.getEncoder().encodeToString(ByteArray(64).also { SecureRandom().nextBytes(it) })
    }

    private val key: Key = Keys.hmacShaKeyFor(secret.toByteArray(StandardCharsets.UTF_8))
    private fun getSigningKey(): Key {
        val keyBytes = secret.toByteArray(StandardCharsets.UTF_8)
        return Keys.hmacShaKeyFor(keyBytes)
    }

    fun generateAccessToken(userDetails: UserDetails): String {
        val now = Date()
        val expiryDate = Date(now.time + accessTokenExpirationInMs)
        val userDetailsImpl = userDetails as? UserDetailsImpl

        return Jwts.builder()
            .setSubject(userDetails.username)
            .claim("id", userDetailsImpl?.getId())
            .claim("type", "access")
            .setIssuedAt(now)
            .setExpiration(expiryDate)
            .signWith(key, SignatureAlgorithm.HS512)
            .compact()
    }

    fun generateRefreshToken(userDetails: UserDetails): String {
        val now = Date()
        val expiryDate = Date(now.time + refreshTokenExpirationInMs)
        val userDetailsImpl = userDetails as? UserDetailsImpl

        return Jwts.builder()
            .setSubject(userDetails.username)
            .claim("id", userDetailsImpl?.getId())
            .claim("type", "refresh")
            .setIssuedAt(now)
            .setExpiration(expiryDate)
            .signWith(key, SignatureAlgorithm.HS512)
            .compact()
    }

    fun isRefreshToken(token: String): Boolean {
        return try {
            val claims = Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .body

            claims["type"] == "refresh"
        } catch (e: Exception) {
            false
        }
    }

    fun getUsernameFromToken(token: String): String? {
        return try {
            Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .body
                .subject
        } catch (e: Exception) {
            logger.error(e) { "Error extracting username from token" }
            null
        }
    }

    fun generateToken(userDetails: UserDetails): String {
        val now = Date()
        val authorities = userDetails.authorities.map(GrantedAuthority::getAuthority)
        val claims = mutableMapOf<String, Any>(
            "roles" to authorities
        )

        return Jwts.builder()
            .setClaims(claims)
            .setSubject(userDetails.username)
            .setIssuedAt(now)
            .setExpiration(Date(now.time + expirationMs))
            .signWith(getSigningKey(), SignatureAlgorithm.HS256)
            .compact()
    }

    fun generateTokenForClaims(subject: String, claims: Map<String, Any?>): String {
        val now = Date()
        return Jwts.builder()
            .setClaims(claims.toMutableMap())
            .setSubject(subject)
            .setIssuedAt(now)
            .setExpiration(Date(now.time + accessTokenExpirationInMs))
            .signWith(key, SignatureAlgorithm.HS512)
            .compact()
    }

    fun extractUsername(token: String): String? = extractAllClaims(token).subject

    fun extractRoles(token: String): List<String> =
        (extractAllClaims(token)["roles"] as? List<*>)?.filterIsInstance<String>() ?: emptyList()

    fun isTokenValid(token: String, userDetails: UserDetails): Boolean {
        val claims = extractAllClaims(token)
        return claims.subject == userDetails.username &&
            claims.expiration.after(Date()) &&
            claims["type"] != "refresh"
    }

    private fun extractAllClaims(token: String): Claims = Jwts.parserBuilder()
        .setSigningKey(getSigningKey())
        .build()
        .parseClaimsJws(token)
        .body

    fun getExpirationInSeconds(token: String): Long {
        return try {
            val claims = Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .body

            (claims.expiration.time - Date().time) / 1000
        } catch (e: Exception) {
            0L
        }
    }

    fun validateToken(token: String, userDetails: UserDetails): Boolean {
        val username = getUsernameFromToken(token) ?: return false
        return (username == userDetails.username && !isTokenExpired(token) && !isRefreshToken(token))
    }

     fun isTokenExpired(token: String): Boolean {
        return try {
            val claims = Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .body

            claims.expiration.before(Date())
        } catch (e: Exception) {
            true
        }
    }
}

private val PLACEHOLDER_MARKERS = listOf("change_me", "changeme")
private val NON_PRODUCTION_MARKERS = listOf("dev-only", "test-only")

/**
 * JWT kaliti nega yaroqsizligini qaytaradi (yaroqli bo'lsa null). HS512 kamida 64 bayt talab qiladi;
 * `.env.example` dagi namuna qiymat hammaga ma'lum; production'da dev/test kalitlari ham qabul qilinmaydi.
 */
internal fun jwtSecretProblem(secret: String, production: Boolean): String? {
    val lowered = secret.lowercase()
    return when {
        secret.isBlank() -> "berilmagan"
        secret.toByteArray(StandardCharsets.UTF_8).size < 64 -> "64 baytdan qisqa"
        PLACEHOLDER_MARKERS.any { it in lowered } -> "namuna qiymat (.env.example)"
        production && NON_PRODUCTION_MARKERS.any { it in lowered } -> "dev/test uchun mo'ljallangan qiymat"
        else -> null
    }
}
