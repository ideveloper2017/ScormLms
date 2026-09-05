package uz.scorm.lms.app.v1.student.dto

import uz.scorm.lms.app.v1.student.model.Citizenship
import uz.scorm.lms.app.v1.student.model.Gender
import java.time.LocalDate

enum class StudentLookupSource { LOCAL, HEMIS, NOT_FOUND }

data class HemisStudentCandidateDto(
    val hemisId: Long,
    val pinfl: String,
    val passportSeries: String?,
    val passportNumber: String?,
    val firstName: String,
    val lastName: String,
    val middleName: String?,
    val fullName: String,
    val birthDate: LocalDate?,
    val gender: Gender?,
    val citizenship: Citizenship,
    val studentNumber: String,
    val email: String?,
    val photoUrl: String?,
    val faculty: String,
    val group: String,
    val specialty: String,
)

data class StudentIdentityLookupDto(
    val source: StudentLookupSource,
    val localStudent: StudentDto? = null,
    val hemisStudent: HemisStudentCandidateDto? = null,
    val hemisChecked: Boolean,
    val manualEntryAllowed: Boolean,
    val message: String,
)
