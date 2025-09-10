package uz.scorm.lms.app.security

import io.jsonwebtoken.Claims
import io.jsonwebtoken.Jwts
import io.jsonwebtoken.SignatureAlgorithm
import io.jsonwebtoken.io.Decoders
import io.jsonwebtoken.security.Keys
import org.springframework.beans.factory.annotation.Value
import org.springframework.security.core.GrantedAuthority
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.stereotype.Service
import java.nio.charset.StandardCharsets
import java.security.Key
import java.util.*

@Service
class JwtService(
    @Value("\${app.jwt.secret}") private val secret: String,
    @Value("\${app.jwt.expiration-ms:86400000}") private val expirationMs: Long
) {

    private fun getSigningKey(): Key {
        val keyBytes = secret.toByteArray(StandardCharsets.UTF_8)
        return Keys.hmacShaKeyFor(keyBytes)
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
}
