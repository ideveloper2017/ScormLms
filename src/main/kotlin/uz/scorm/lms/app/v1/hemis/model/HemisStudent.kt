package uz.scorm.lms.app.v1.hemis.model

import jakarta.persistence.Embeddable

data class HemisStudent(
    val id: Long,
    val first_name: String,
    val second_name: String,
    val third_name: String,
    val full_name: String,
    val short_name: String,
    val university: String,
    val student_id_number: String,
    val image: String?,
    val birth_date: Long,
    val email: String?,
    val group: Group,
    val faculty: Faculty,
    val educationLang: CodeName,
    val semester: Semester,
    val specialty: CodeName,
    val level: CodeName,
    val educationForm: CodeName,
    val educationType: CodeName,
    val paymentForm: CodeName,
    val studentStatus: CodeName,
    val country: CodeName,
    val district: CodeName,
    val province: CodeName,
    val address: String?,
    val socialCategory: CodeName,
    val accommodation: CodeName,
    val validateUrl: String?,
    val hash: String
)

@Embeddable
data class CodeName(
    val code: String,
    val name: String
)

// Education year with current flag
@Embeddable
data class EducationYear(
    val code: String,
    val name: String,
    val current: Boolean
)

// Semester information
@Embeddable
data class Semester(
    val id: Long,
    val code: String,
    val name: String,
    val current: Boolean,
    val education_year: EducationYear
)

@Embeddable
// Group information
data class Group(
    val id: Long,
    val name: String,
    val educationLang: CodeName
)

@Embeddable
// Faculty/Department structure
data class Faculty(
    val id: Long,
    val name: String,
    val code: String,
    val parent: Long,
    val active: Boolean,
    val structureType: CodeName,
    val localityType: CodeName
)