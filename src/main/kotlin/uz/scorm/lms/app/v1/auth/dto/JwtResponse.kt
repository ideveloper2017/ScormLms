package uz.idev.app.v1.auth.dto

data class JwtResponse(
    val accessToken: String,
    val refreshToken: String,
    val tokenType: String = "Bearer",
    val expiresIn: Long
)
