package uz.scorm.lms.app.v1.syllabus.dto

import uz.scorm.lms.app.v1.syllabus.model.SyllabusLanguage
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
)

data class SyllabusWorkflowRequest(val action: String)
data class SyllabusRevisionDto(val revisionNumber: Int, val content: SubjectSyllabusDto, val approvedByName: String, val approvedAt: Instant)

data class SubjectSyllabusRequest(
    val subjectId: Long,
    val name: String,
    val language: SyllabusLanguage,
    val shortDescription: String,
    val requirements: String? = null,
    val fullDescription: String,
    val active: Boolean = true,
)
