package uz.scorm.lms.app.v1.systemcatalog.dto

import uz.scorm.lms.app.v1.systemcatalog.model.TranslationCategory
import java.time.Instant

data class LocalizedValuesDto(
    val uzLatin: String = "",
    val uzCyrillic: String = "",
    val kaa: String = "",
    val ru: String = "",
    val en: String = "",
)

data class ReferenceLabelDto(
    val id: Long,
    val key: String,
    val label: String,
    val moduleName: String,
    val active: Boolean,
    val translations: LocalizedValuesDto,
    val createdAt: Instant?,
    val updatedAt: Instant?,
)

data class SaveReferenceLabelRequest(
    val key: String,
    val label: String,
    val moduleName: String,
    val active: Boolean = true,
    val translations: LocalizedValuesDto = LocalizedValuesDto(),
)

data class NationalityDto(
    val id: Long,
    val name: String,
    val active: Boolean,
    val translations: LocalizedValuesDto,
    val createdAt: Instant?,
    val updatedAt: Instant?,
)

data class SaveNationalityRequest(
    val name: String,
    val active: Boolean = true,
    val translations: LocalizedValuesDto = LocalizedValuesDto(),
)

data class SystemLanguageDto(
    val id: Long,
    val code: String,
    val name: String,
    val active: Boolean,
    val sortOrder: Int,
)

data class SystemSettingDto(
    val id: Long,
    val key: String,
    val value: String,
    val active: Boolean,
    val updatedAt: Instant?,
)

data class UpdateSystemSettingRequest(
    val value: String,
    val active: Boolean = true,
)

data class TranslationMessageDto(
    val id: Long,
    val key: String,
    val category: TranslationCategory,
    val message: String,
    val active: Boolean,
    val translations: LocalizedValuesDto,
    val createdAt: Instant?,
    val updatedAt: Instant?,
)

data class SaveTranslationMessageRequest(
    val key: String,
    val category: TranslationCategory,
    val active: Boolean = true,
    val translations: LocalizedValuesDto,
)
