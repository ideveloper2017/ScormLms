package uz.scorm.lms.app.v1.syllabus.dto

import uz.scorm.lms.app.v1.syllabus.model.SyllabusLanguage
import java.time.Instant

/** O'quv dasturi (namunaviy) va undan yaratilgan fan dasturlari (ishchi dasturlar) soni. */
data class SubjectModelProgramDto(
    val id: Long,
    val subjectId: Long,
    val subjectCode: String?,
    val subjectName: String,
    val subjectCredits: Int?,
    val language: SyllabusLanguage,
    val name: String,
    val shortDescription: String,
    val requirements: String?,
    val fullDescription: String,
    val active: Boolean,
    val workProgramCount: Int,
    val createdAt: Instant?,
    val updatedAt: Instant?,
)

data class SubjectModelProgramRequest(
    val subjectId: Long,
    val language: SyllabusLanguage,
    val shortDescription: String,
    val requirements: String? = null,
    val fullDescription: String,
    val active: Boolean = true,
)
