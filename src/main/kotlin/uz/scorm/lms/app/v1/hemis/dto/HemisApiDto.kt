package uz.scorm.lms.app.v1.hemis.dto

import uz.scorm.lms.app.v1.hemis.model.HemisStudent

// ── HEMIS token response ──────────────────────────────────────────────────────

data class HemisTokenResponse(
    val success: Boolean,
    val error: String?,
    val data: HemisTokenData?,
    val code: Int,
)

data class HemisTokenData(val token: String)

// ── HEMIS student list ────────────────────────────────────────────────────────

data class HemisStudentListResponse(
    val success: Boolean,
    val error: String?,
    val data: HemisStudentListData?,
    val code: Int,
)

data class HemisStudentListData(
    val items: List<HemisStudent>,
    val total: Long,
    val limit: Int,
    val offset: Int,
)

// ── HEMIS group list ──────────────────────────────────────────────────────────

data class HemisGroupListResponse(
    val success: Boolean,
    val error: String?,
    val data: HemisGroupListData?,
    val code: Int,
)

data class HemisGroupListData(
    val items: List<HemisGroupItem>,
    val total: Long,
)

data class HemisGroupItem(
    val id: Long,
    val name: String,
    val studentsCount: Int?,
)

// ── Import DTOs (frontend ↔ backend) ─────────────────────────────────────────

data class HemisStudentPreviewDto(
    val hemisId: Long,
    val studentNumber: String,
    val fullName: String,
    val birthDate: String?,
    val email: String?,
    val faculty: String,
    val group: String,
    val specialty: String,
    val educationLang: String,
    val alreadyExists: Boolean,        // DB da allaqachon bor
)

data class HemisImportRequest(
    val groupId: Long,
    val studentNumbers: List<String>? = null, // null = hammasini import qilish
)

data class HemisImportResult(
    val total: Int,
    val created: Int,
    val updated: Int,
    val skipped: Int,
    val errors: List<String>,
)

data class HemisLoginResponse(
    val accessToken: String,
    val refreshToken: String,
    val user: HemisLoginUser,
)

data class HemisLoginUser(
    val username: String,
    val fullName: String?,
    val roles: List<String>,
)
