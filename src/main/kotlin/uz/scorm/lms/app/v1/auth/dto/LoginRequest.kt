package uz.scorm.lms.app.v1.auth.dto

data class LoginRequest(
    val username: String,
    val password: String
)