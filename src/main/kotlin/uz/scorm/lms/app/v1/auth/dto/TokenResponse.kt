package uz.scorm.lms.app.v1.auth.dto

data class TokenResponse(
    val succees: Boolean,
    val error:String?,
    val code:Int,
    val data: TokenData,
)

data class TokenData(
    val token: String,
);