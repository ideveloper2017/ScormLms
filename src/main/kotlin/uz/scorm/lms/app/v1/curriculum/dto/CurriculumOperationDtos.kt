package uz.scorm.lms.app.v1.curriculum.dto

import java.time.LocalDate

data class CurriculumSemesterPeriodRequest(
    val semesterNumber: Int,
    val startsOn: LocalDate,
    val endsOn: LocalDate,
    val active: Boolean = true,
)

data class CurriculumSemesterPeriodDto(
    val id: Long,
    val curriculumId: Long,
    val academicYear: String,
    val semesterNumber: Int,
    val startsOn: LocalDate,
    val endsOn: LocalDate,
    val active: Boolean,
)

data class AssignCurriculumStudentsRequest(
    val studentIds: Set<Long>,
    val semesterNumber: Int,
)

data class CurriculumStudentAssignmentDto(
    val id: Long,
    val curriculumId: Long,
    val studentId: Long,
    val studentNumber: String,
    val fullName: String,
    val groupId: Long?,
    val academicYear: String,
    val semesterNumber: Int,
    val startsOn: LocalDate,
    val endsOn: LocalDate,
    val active: Boolean,
)
