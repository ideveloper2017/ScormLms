// StudentResponse.kt
package uz.scorm.lms.app.v1.student.dto

import java.math.BigDecimal

data class StudentResponse(
    val items: List<StudentDto> = emptyList()
)

data class StudentDto(
    val id: Long? = null,
    val metaId: Long = 0,
    val fullName: String,
    val shortName: String? = null,
    val firstName: String? = null,
    val secondName: String? = null,
    val thirdName: String? = null,
    val image: String? = null,
    val studentIdNumber: String? = null,
    val birthDate: Long? = null,
    val avgGpa: BigDecimal? = null,
    val avgGrade: BigDecimal? = null,
    val totalCredit: BigDecimal? = null,
    val university: UniversityDto? = null,
    val gender: CodeNameDto? = null,
    val department: DepartmentDto? = null,
    val specialty: SpecialtyDto? = null,
    val group: GroupDto? = null,
    val educationYear: CodeNameDto? = null,
    val country: CodeNameDto? = null,
    val province: CodeNameDto? = null,
    val district: CodeNameDto? = null,
    val terrain: CodeNameDto? = null,
    val citizenship: CodeNameDto? = null,
    val semester: SemesterDto? = null,
    val level: CodeNameDto? = null,
    val educationForm: CodeNameDto? = null,
    val educationType: CodeNameDto? = null,
    val paymentForm: CodeNameDto? = null,
    val studentType: CodeNameDto? = null,
    val socialCategory: CodeNameDto? = null,
    val accommodation: CodeNameDto? = null,
    val studentStatus: CodeNameDto? = null,
    val curriculum: Long? = null,
    val hash: String? = null
)

// DTO classes for nested objects
data class UniversityDto(val code: String? = null, val name: String? = null)
data class DepartmentDto(
    val id: Long? = null,
    val name: String? = null,
    val code: String? = null,
    val parent: Long? = null,
    val active: Boolean? = null,
    val structureType: CodeNameDto? = null,
    val localityType: CodeNameDto? = null
)
data class SpecialtyDto(val id: Long? = null, val name: String? = null, val code: String? = null)
data class GroupDto(val id: Long? = null, val name: String? = null, val educationLang: CodeNameDto? = null)
data class SemesterDto(val id: Long? = null, val code: String? = null, val name: String? = null)
data class CodeNameDto(val code: String? = null, val name: String? = null)