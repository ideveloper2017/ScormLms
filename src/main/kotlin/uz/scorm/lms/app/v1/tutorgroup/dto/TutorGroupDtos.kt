package uz.scorm.lms.app.v1.tutorgroup.dto

data class TutorGroupDto(
    val id: Long, val name: String, val code: String, val facultyId: Long?, val facultyName: String?,
    val tutorId: Long?, val tutorName: String?, val nameUz: String?, val nameRu: String?, val nameEn: String?, val active: Boolean,
)
data class SaveTutorGroupRequest(
    val name: String, val code: String, val facultyId: Long? = null, val tutorId: Long? = null,
    val nameUz: String? = null, val nameRu: String? = null, val nameEn: String? = null, val active: Boolean = true,
)
data class TutorGroupOptionsDto(val faculties: List<IdNameDto>, val tutors: List<IdNameDto>)
data class IdNameDto(val id: Long, val name: String)
