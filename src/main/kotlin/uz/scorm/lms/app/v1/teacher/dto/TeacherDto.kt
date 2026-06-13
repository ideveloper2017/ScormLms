package uz.scorm.lms.app.v1.teacher.dto

import java.time.Instant

data class SubjectRef(
    val id: Long,
    val name: String
)

data class TeacherDto(
    val id: Long? = null,
    val fullName: String,
    val phone: String? = null,
    val email: String? = null,
    val academicDegree: String? = null,
    val academicRank: String? = null,
    val position: String? = null,
    val active: Boolean = true,
    val departmentId: Long? = null,
    val departmentName: String? = null,
    val userId: Long? = null,
    val username: String? = null,
    val subjects: List<SubjectRef> = emptyList(),
    val createdAt: Instant? = null,
    val updatedAt: Instant? = null
)

data class TeacherCreateRequest(
    val fullName: String,
    val phone: String? = null,
    val email: String? = null,
    val academicDegree: String? = null,
    val academicRank: String? = null,
    val position: String? = null,
    val active: Boolean = true,
    val departmentId: Long? = null,
    val subjectIds: List<Long> = emptyList(),
    // Ixtiyoriy: agar ikkalasi ham berilsa, role=teacher login yaratiladi
    val username: String? = null,
    val password: String? = null
)

data class TeacherUpdateRequest(
    val fullName: String? = null,
    val phone: String? = null,
    val email: String? = null,
    val academicDegree: String? = null,
    val academicRank: String? = null,
    val position: String? = null,
    val active: Boolean? = null,
    val departmentId: Long? = null,
    val subjectIds: List<Long>? = null
)
