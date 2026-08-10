package uz.scorm.lms.app.v1.subjectgroup.dto

import uz.scorm.lms.app.v1.student.model.StudentStatus

data class CreateAcademicSubjectGroupRequest(
    val curriculumSubjectId: Long,
    val code: String,
    val name: String,
    val capacity: Int = 30,
    val active: Boolean = true,
)

data class UpdateAcademicSubjectGroupRequest(
    val code: String,
    val name: String,
    val capacity: Int,
    val active: Boolean,
)

data class AssignAcademicSubjectGroupStudentsRequest(val studentIds: Set<Long>)

data class AcademicSubjectGroupDto(
    val id: Long,
    val code: String,
    val name: String,
    val capacity: Int,
    val active: Boolean,
    val memberCount: Long,
    val curriculumId: Long,
    val curriculumVersionCode: String,
    val programId: Long,
    val programName: String,
    val academicYear: String,
    val curriculumSubjectId: Long,
    val subjectId: Long?,
    val subjectCode: String,
    val subjectName: String,
    val semester: Int,
)

data class AcademicSubjectGroupStudentDto(
    val studentId: Long,
    val studentNumber: String,
    val fullName: String,
    val status: StudentStatus,
    val semesterNumber: Int?,
    val primaryGroupId: Long?,
)

data class AcademicSubjectGroupCandidatePageDto(
    val items: List<AcademicSubjectGroupStudentDto>,
    val page: Int,
    val size: Int,
    val totalElements: Long,
    val totalPages: Int,
)
