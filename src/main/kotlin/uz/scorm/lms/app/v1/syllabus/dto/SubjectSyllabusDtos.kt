package uz.scorm.lms.app.v1.syllabus.dto

import uz.scorm.lms.app.v1.syllabus.model.SyllabusLanguage
import uz.scorm.lms.app.v1.syllabus.model.SyllabusTopicType
import java.time.Instant

data class SubjectSyllabusDto(
    val id: Long,
    /** null — dastur hali o'quv reja faniga biriktirilmagan */
    val subjectId: Long?,
    val subjectCode: String?,
    val subjectName: String?,
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
    val modelProgramId: Long? = null,
    val academicYear: String? = null,
    val semester: Int? = null,
    /** Dastur tuzilmasi: modullar va ularning darslari (eski revision JSON'larida bo'lmaydi) */
    val modules: List<SyllabusModuleDto> = emptyList(),
    /** Natijalar (har biri yangi qatordan) */
    val learningOutcomes: String? = null,
    /** Muqova rasmi yuklangan */
    val coverImageAvailable: Boolean = false,
    /** Yuklangan tanishtiruv videosi nomi (null — yuklanmagan) */
    val introVideoName: String? = null,
    val introVideoUrl: String? = null,
)

data class SyllabusTopicDto(
    val id: Long? = null,
    val type: SyllabusTopicType,
    val sortOrder: Int,
    val title: String,
    val description: String? = null,
    val hours: Int? = null,
    val part: Int? = null,
    val moduleId: Long? = null,
    val lessonOrder: Int? = null,
    /** Dars kontenti: darsga kiritilgan materiallar soni */
    val materialCount: Int = 0,
    /** Darsning Test va Savol/Javob resurslari soni */
    val quizCount: Int = 0,
)

/** Modul: nomi, ma'lumoti va darslari (dars — mavzu, mashg'ulot turi bilan) */
data class SyllabusModuleDto(
    val id: Long,
    val sortOrder: Int,
    val name: String,
    val description: String? = null,
    val lessons: List<SyllabusTopicDto> = emptyList(),
)

/** Modulni saqlash: id berilsa joyida yangilanadi; darslar ro'yxati modul darslarini to'liq almashtiradi */
data class SyllabusModuleRequest(
    val id: Long? = null,
    val name: String,
    val description: String? = null,
    val lessons: List<SyllabusTopicRequest> = emptyList(),
)

data class SyllabusWorkflowRequest(val action: String)
data class SyllabusRevisionDto(val revisionNumber: Int, val content: SubjectSyllabusDto, val approvedByName: String, val approvedAt: Instant)

data class SubjectSyllabusRequest(
    /** Ixtiyoriy: fan o'quv reja taxtasida dastur biriktirilganda yoziladi */
    val subjectId: Long? = null,
    // Berilmasa fan nomi olinadi; fansiz dasturda majburiy
    val name: String? = null,
    val language: SyllabusLanguage,
    val shortDescription: String,
    val requirements: String? = null,
    val fullDescription: String,
    val active: Boolean = true,
    val learningOutcomes: String? = null,
    /** Tanishtiruv videosi havolasi (fayl alohida yuklanadi) */
    val introVideoUrl: String? = null,
    // null — mavzular o'zgartirilmaydi; ro'yxat berilsa, to'liq almashtiriladi
    val topics: List<SyllabusTopicRequest>? = null,
)

data class SyllabusTopicRequest(
    val type: SyllabusTopicType,
    val title: String,
    val description: String? = null,
    // Ixtiyoriy — soatlar fan bo'yicha o'quv rejada
    val hours: Int? = null,
    // Mavjud mavzu id'si — berilsa mavzu joyida yangilanadi (kurs bo'limlari bilan bog'lanish saqlanadi)
    val id: Long? = null,
    // Ko'p semestrli fanda qism raqami (1, 2, ...)
    val part: Int? = null,
)
