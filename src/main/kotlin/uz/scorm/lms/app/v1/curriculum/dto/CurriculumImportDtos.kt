package uz.scorm.lms.app.v1.curriculum.dto

import uz.scorm.lms.app.v1.curriculum.model.CurriculumPlanItemType

data class CurriculumImportSheetDto(val name: String, val rowCount: Int)

data class CurriculumImportSemesterCredit(val semester: Int, val credits: Int)

/** USE_EXISTING — tizimdagi fan, CREATE — katalogda yangi fan yaratiladi, SKIP — qator import qilinmaydi */
enum class CurriculumImportAction { USE_EXISTING, CREATE, SKIP }

/** Ishchi o'quv rejadagi fan qatori va tizimdagi fanga mosligi (ko'rib chiqishda foydalanuvchi o'zgartirishi mumkin). */
data class CurriculumImportRowDto(
    val rowNumber: String,
    val code: String,
    val name: String,
    val planItemType: CurriculumPlanItemType,
    val alternative: Boolean = false,
    val totalHours: Int = 0,
    val auditoryHours: Int = 0,
    val lectureHours: Int = 0,
    val practicalHours: Int = 0,
    val laboratoryHours: Int = 0,
    val seminarHours: Int = 0,
    val courseWorkHours: Int = 0,
    val selfStudyHours: Int = 0,
    val semesterCredits: List<CurriculumImportSemesterCredit> = emptyList(),
    val action: CurriculumImportAction = CurriculumImportAction.SKIP,
    val subjectId: Long? = null,
    val subjectCode: String? = null,
    val subjectName: String? = null,
    /** CREATE uchun katalogdagi yangi fan kodi (reja kodi band bo'lsa qo'shimcha bilan) */
    val createCode: String? = null,
    val issues: List<String> = emptyList(),
)

data class CurriculumImportPreviewDto(
    val sheets: List<CurriculumImportSheetDto>,
    val sheet: String?,
    val rows: List<CurriculumImportRowDto>,
)

data class CurriculumImportApplyRequest(val rows: List<CurriculumImportRowDto>)

data class CurriculumImportResultDto(
    val subjectsCreated: Int,
    val itemsAdded: Int,
    val itemsSkipped: Int,
    val curriculum: CurriculumVersionDto,
)
