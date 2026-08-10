package uz.scorm.lms.app.v1.student.dto

data class StudentRegistryPageDto(
    val items: List<StudentSummaryDto>,
    val page: Int,
    val size: Int,
    val totalElements: Long,
    val totalPages: Int,
)

data class StudentRegistryExport(
    val bytes: ByteArray,
    val filename: String,
    val contentType: String = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
)
