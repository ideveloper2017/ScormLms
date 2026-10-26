package uz.scorm.lms.app.v1.syllabus.dto

import uz.scorm.lms.app.v1.syllabus.model.SyllabusLanguage
import uz.scorm.lms.app.v1.syllabus.model.SyllabusTopicType
import java.time.Instant

data class SubjectSyllabusDto(
    val id: Long,
    val subjectId: Long,
    val subjectCode: String?,
    val subjectName: String,
    val name: String,
    val language: SyllabusLanguage,
    val shortDescription: String,
    val requirements: String?,
    val fullDescription: String,
    val active: Boolean,
    val createdAt: Instant?,
    val updatedAt: Instant?,
    val status: String = "DRAFT",
    val revisionNumber: Int = 1,
    val topics: List<SyllabusTopicDto> = emptyList(),
    val theoreticalHours: Int = 0,
    val practicalHours: Int = 0,
    val laboratoryHours: Int = 0,
    val seminarHours: Int = 0,
)

data class SyllabusTopicDto(
    val id: Long? = null,
    val type: SyllabusTopicType,
    val sortOrder: Int,
    val title: String,
    val description: String? = null,
    val hours: Int,
)

data class SyllabusWorkflowRequest(val action: String)
data class SyllabusRevisionDto(val revisionNumber: Int, val content: SubjectSyllabusDto, val approvedByName: String, val approvedAt: Instant)

data class SubjectSyllabusRequest(
    val subjectId: Long,
    // Berilmasa fan nomi olinadi — dastur fan bilan aniqlanadi
    val name: String? = null,
    val language: SyllabusLanguage,
    val shortDescription: String,
    val requirements: String? = null,
    val fullDescription: String,
    val active: Boolean = true,
    // null — mavzular o'zgartirilmaydi; ro'yxat berilsa, to'liq almashtiriladi
    val topics: List<SyllabusTopicRequest>? = null,
)

data class SyllabusTopicRequest(
    val type: SyllabusTopicType,
    val title: String,
    val description: String? = null,
    val hours: Int,
    // Mavjud mavzu id'si — berilsa mavzu joyida yangilanadi (kurs bo'limlari bilan bog'lanish saqlanadi)
    val id: Long? = null,
)
