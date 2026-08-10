package uz.scorm.lms.app.v1.academicperiod.dto

import java.time.LocalDate

data class AcademicYearDto(
    val id: Long,
    val code: String,
    val startsOn: LocalDate,
    val endsOn: LocalDate,
    val active: Boolean,
    val current: Boolean,
)

data class CreateAcademicYearRequest(
    val code: String,
    val active: Boolean = true,
    val current: Boolean = false,
)

data class UpdateAcademicYearStateRequest(
    val active: Boolean,
    val current: Boolean,
)

data class AcademicSemesterDto(
    val id: Long,
    val semesterNumber: Int,
    val nameUz: String,
    val courseNumber: Int,
    val active: Boolean,
)

data class UpdateAcademicSemesterRequest(
    val nameUz: String,
    val active: Boolean,
)
