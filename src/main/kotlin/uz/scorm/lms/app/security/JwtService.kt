package uz.scorm.lms.app.security

import io.jsonwebtoken.Claims
import io.jsonwebtoken.Jwts
import io.jsonwebtoken.SignatureAlgorithm
import io.jsonwebtoken.io.Decoders
import io.jsonwebtoken.security.Keys
import mu.KotlinLogging
import org.springframework.beans.factory.annotation.Value
import org.springframework.security.core.GrantedAuthority
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.stereotype.Service

import java.nio.charset.StandardCharsets
import java.security.Key
import java.util.*
import kotlin.math.log

private val logger = KotlinLogging.logger {}

@Service
class JwtService(
    @Value("\${app.jwt.secret}") private val secret: String,
    @Value("\${app.jwt.expiration-ms:86400000}") private val expirationMs: Long,
    @Value("\${app.jwt.expiration}")
    private val accessTokenExpirationInMs: Long,
    @Value("\${app.jwt.refresh-expiration:2592000000}") // 30 days default
    private val refreshTokenExpirationInMs: Long
) {
    private val key: Key = Keys.hmacShaKeyFor(secret.toByteArray())
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

    fun extractUsername(token: String): String? = extractAllClaims(token).subject

    fun extractRoles(token: String): List<String> =
        (extractAllClaims(token)["roles"] as? List<*>)?.filterIsInstance<String>() ?: emptyList()

    fun isTokenValid(token: String, userDetails: UserDetails): Boolean {
        val username = extractUsername(token)
        val expiration = extractAllClaims(token).expiration
        return (username == userDetails.username) && expiration.after(Date())
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
