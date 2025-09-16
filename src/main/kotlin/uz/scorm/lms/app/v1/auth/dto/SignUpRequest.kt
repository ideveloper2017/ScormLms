package uz.idev.app.v1.auth.dto

data class SignUpRequest(
    val username: String,
    val phone: String,
    val email: String,
    val password: String,
    val firstName: String? = null,
    val lastName: String? = null
)
