package uz.scorm.lms.app.v1.employee.dto

data class EmployeeResponse(
    val items: List<EmployeeDto> = emptyList()
)

data class EmployeeDto(
    val id: Long? = null,
    val metaId: Long = 0,
    val fullName: String,
    val shortName: String? = null,
    val firstName: String? = null,
    val secondName: String? = null,
    val thirdName: String? = null,
    val image: String? = null,
    val yearOfEnter: String? = null,
    val employeeIdNumber: Long? = null,
    val gender: CodeNameDto? = null,
    val department: DepartmentDto? = null,
    val academicDegree: CodeNameDto? = null,
    val academicRank: CodeNameDto? = null,
    val employmentForm: CodeNameDto? = null,
    val employmentStaff: CodeNameDto? = null,
    val staffPosition: CodeNameDto? = null,
    val employeeStatus: CodeNameDto? = null,
    val employeeType: CodeNameDto? = null,
    val specialty: String? = null,
    val contractNumber: String? = null,
    val decreeNumber: String? = null,
    val contractDate: Long? = null,
    val decreeDate: Long? = null,
    val birthDate: Long? = null,
    val updateAt: Long? = null,
    val hash: String? = null,
    val active: Boolean = true
)

// DTO classes for nested objects
data class DepartmentDto(
    val id: Long? = null,
    val name: String? = null,
    val code: String? = null,
    val parent: Long? = null,
    val active: Boolean? = null,
    val structureType: CodeNameDto? = null,
    val localityType: CodeNameDto? = null
)

data class CodeNameDto(
    val code: String? = null,
    val name: String? = null
)