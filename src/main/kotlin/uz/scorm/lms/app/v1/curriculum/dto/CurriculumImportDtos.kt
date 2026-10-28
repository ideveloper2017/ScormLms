package uz.scorm.lms.app.v1.curriculum.dto

import uz.scorm.lms.app.v1.curriculum.model.CurriculumComponentType
import uz.scorm.lms.app.v1.curriculum.model.CurriculumCourseWorkType
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
    /** KI — kurs ishi, KL — kurs loyihasi (ko'p semestrli fanda oxirgi semestrga yoziladi) */
    val courseWorkType: CurriculumCourseWorkType? = null,
)

/** Fayl sarlavhasi: yo'nalish, akademik daraja, ta'lim shakli, o'qish muddati, kvalifikatsiya. */
data class CurriculumImportHeaderDto(
    val programCode: String? = null,
    val programName: String? = null,
    val degree: String? = null,
    val educationForm: String? = null,
    val educationFormText: String? = null,
    val durationYears: Int? = null,
    val qualification: String? = null,
)

/** Malakaviy amaliyot / YaDA: semestr kredit yoki o'quv jarayoni jadvalidan (topilmasa — oxirgi semestr) */
data class CurriculumImportComponentDto(
    val type: CurriculumComponentType,
    val name: String,
    val semester: Int? = null,
    val credits: Int = 0,
    val hours: Int = 0,
    val weeks: Int? = null,
)

data class CurriculumImportPreviewDto(
    val sheets: List<CurriculumImportSheetDto>,
    val sheet: String?,
    val rows: List<CurriculumImportRowDto>,
    val header: CurriculumImportHeaderDto? = null,
    /** Fayl sarlavhasi rejaga mos kelmasa (yo'nalish, ta'lim shakli, o'qish muddati) */
    val warnings: List<String> = emptyList(),
    val components: List<CurriculumImportComponentDto> = emptyList(),
    /** "I. O'quv jarayoni jadvali" */
    val schedule: List<CurriculumScheduleDto> = emptyList(),
)

/** Ko'rib chiqishdagi qatorlar (qarorlar bilan); amaliyot/YaDA, jadval va kvalifikatsiya ham shu fayldan */
data class CurriculumImportApplyRequest(
    val rows: List<CurriculumImportRowDto>,
    val components: List<CurriculumImportComponentDto> = emptyList(),
    val schedule: List<CurriculumScheduleDto> = emptyList(),
    val qualification: String? = null,
)

data class CurriculumImportResultDto(
    val subjectsCreated: Int,
    val itemsAdded: Int,
    val itemsSkipped: Int,
    val curriculum: CurriculumVersionDto,
    val componentsAdded: Int = 0,
)
