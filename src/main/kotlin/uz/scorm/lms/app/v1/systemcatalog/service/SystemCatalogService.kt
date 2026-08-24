package uz.scorm.lms.app.v1.systemcatalog.service

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.audit.service.AuditService
import uz.scorm.lms.app.v1.systemcatalog.dto.LocalizedValuesDto
import uz.scorm.lms.app.v1.systemcatalog.dto.NationalityDto
import uz.scorm.lms.app.v1.systemcatalog.dto.ReferenceLabelDto
import uz.scorm.lms.app.v1.systemcatalog.dto.SaveNationalityRequest
import uz.scorm.lms.app.v1.systemcatalog.dto.SaveReferenceLabelRequest
import uz.scorm.lms.app.v1.systemcatalog.dto.SaveTranslationMessageRequest
import uz.scorm.lms.app.v1.systemcatalog.dto.SystemLanguageDto
import uz.scorm.lms.app.v1.systemcatalog.dto.SystemSettingDto
import uz.scorm.lms.app.v1.systemcatalog.dto.TranslationMessageDto
import uz.scorm.lms.app.v1.systemcatalog.dto.UpdateSystemSettingRequest
import uz.scorm.lms.app.v1.systemcatalog.model.LocalizedText
import uz.scorm.lms.app.v1.systemcatalog.model.Nationality
import uz.scorm.lms.app.v1.systemcatalog.model.ReferenceLabel
import uz.scorm.lms.app.v1.systemcatalog.model.TranslationMessage
import uz.scorm.lms.app.v1.systemcatalog.repository.NationalityRepository
import uz.scorm.lms.app.v1.systemcatalog.repository.ReferenceLabelRepository
import uz.scorm.lms.app.v1.systemcatalog.repository.SystemLanguageRepository
import uz.scorm.lms.app.v1.systemcatalog.repository.SystemSettingRepository
import uz.scorm.lms.app.v1.systemcatalog.repository.TranslationMessageRepository

@Service
class SystemCatalogService(
    private val labels: ReferenceLabelRepository,
    private val nationalities: NationalityRepository,
    private val languages: SystemLanguageRepository,
    private val settings: SystemSettingRepository,
    private val messages: TranslationMessageRepository,
    private val auditService: AuditService,
) {
    @Transactional(readOnly = true)
    fun listLabels(): List<ReferenceLabelDto> = labels.findAllByDeletedFalseOrderByModuleNameAscKeyAsc().map(::labelDto)

    @Transactional
    fun createLabel(request: SaveReferenceLabelRequest, actorId: Long): ReferenceLabelDto {
        val key = required(request.key, "Kalit", 1, 180)
        val module = required(request.moduleName, "Modul nomi", 1, 120)
        require(labels.findByKeyIgnoreCaseAndModuleNameIgnoreCaseAndDeletedFalse(key, module) == null) {
            "Bu modulda yorliq kaliti mavjud: $key"
        }
        val entity = ReferenceLabel(
            key = key,
            label = required(request.label, "Yorliq", 1, 500),
            moduleName = module,
            active = request.active,
            translations = localized(request.translations, request.label),
        )
        val saved = labels.save(entity)
        auditService.logAction("REFERENCE_LABEL_CREATED", actorId, "id=${saved.id}; key=$key; module=$module")
        return labelDto(saved)
    }

    @Transactional
    fun updateLabel(id: Long, request: SaveReferenceLabelRequest, actorId: Long): ReferenceLabelDto {
        val entity = labels.findByIdAndDeletedFalse(id) ?: throw NoSuchElementException("Yorliq topilmadi: $id")
        val key = required(request.key, "Kalit", 1, 180)
        val module = required(request.moduleName, "Modul nomi", 1, 120)
        val duplicate = labels.findByKeyIgnoreCaseAndModuleNameIgnoreCaseAndDeletedFalse(key, module)
        require(duplicate == null || duplicate.id == entity.id) { "Bu modulda yorliq kaliti mavjud: $key" }
        entity.key = key
        entity.label = required(request.label, "Yorliq", 1, 500)
        entity.moduleName = module
        entity.active = request.active
        entity.translations = localized(request.translations, entity.label)
        val saved = labels.save(entity)
        auditService.logAction("REFERENCE_LABEL_UPDATED", actorId, "id=$id; key=$key; module=$module")
        return labelDto(saved)
    }

    @Transactional
    fun deleteLabel(id: Long, actorId: Long) {
        val entity = labels.findByIdAndDeletedFalse(id) ?: throw NoSuchElementException("Yorliq topilmadi: $id")
        entity.deleted = true
        entity.active = false
        labels.save(entity)
        auditService.logAction("REFERENCE_LABEL_DELETED", actorId, "id=$id; key=${entity.key}")
    }

    @Transactional(readOnly = true)
    fun listNationalities(): List<NationalityDto> = nationalities.findAllByDeletedFalseOrderByNameAsc().map(::nationalityDto)

    @Transactional
    fun createNationality(request: SaveNationalityRequest, actorId: Long): NationalityDto {
        val name = required(request.name, "Millat nomi", 1, 250)
        require(nationalities.findByNameIgnoreCaseAndDeletedFalse(name) == null) { "Millat mavjud: $name" }
        val saved = nationalities.save(Nationality(
            name = name,
            active = request.active,
            translations = localized(request.translations, name),
        ))
        auditService.logAction("NATIONALITY_CREATED", actorId, "id=${saved.id}; name=$name")
        return nationalityDto(saved)
    }

    @Transactional
    fun updateNationality(id: Long, request: SaveNationalityRequest, actorId: Long): NationalityDto {
        val entity = nationalities.findByIdAndDeletedFalse(id) ?: throw NoSuchElementException("Millat topilmadi: $id")
        val name = required(request.name, "Millat nomi", 1, 250)
        val duplicate = nationalities.findByNameIgnoreCaseAndDeletedFalse(name)
        require(duplicate == null || duplicate.id == entity.id) { "Millat mavjud: $name" }
        entity.name = name
        entity.active = request.active
        entity.translations = localized(request.translations, name)
        val saved = nationalities.save(entity)
        auditService.logAction("NATIONALITY_UPDATED", actorId, "id=$id; name=$name")
        return nationalityDto(saved)
    }

    @Transactional
    fun deleteNationality(id: Long, actorId: Long) {
        val entity = nationalities.findByIdAndDeletedFalse(id) ?: throw NoSuchElementException("Millat topilmadi: $id")
        entity.deleted = true
        entity.active = false
        nationalities.save(entity)
        auditService.logAction("NATIONALITY_DELETED", actorId, "id=$id; name=${entity.name}")
    }

    @Transactional(readOnly = true)
    fun listLanguages(): List<SystemLanguageDto> = languages.findAllByDeletedFalseOrderBySortOrderAsc().map {
        SystemLanguageDto(requireNotNull(it.id), it.code, it.name, it.active, it.sortOrder)
    }

    @Transactional(readOnly = true)
    fun listSettings(): List<SystemSettingDto> = settings.findAllByDeletedFalseOrderByKeyAsc().map(::settingDto)

    @Transactional
    fun updateSetting(id: Long, request: UpdateSystemSettingRequest, actorId: Long): SystemSettingDto {
        val entity = settings.findByIdAndDeletedFalse(id) ?: throw NoSuchElementException("Sozlama topilmadi: $id")
        entity.value = required(request.value, "Qiymat", 1, 2000)
        entity.active = request.active
        val saved = settings.save(entity)
        auditService.logAction("SYSTEM_SETTING_UPDATED", actorId, "id=$id; key=${saved.key}; active=${saved.active}")
        return settingDto(saved)
    }

    @Transactional(readOnly = true)
    fun listTranslations(): List<TranslationMessageDto> =
        messages.findAllByDeletedFalseOrderByCategoryAscKeyAsc().map(::messageDto)

    @Transactional
    fun createTranslation(request: SaveTranslationMessageRequest, actorId: Long): TranslationMessageDto {
        val key = required(request.key, "Kalit", 1, 250)
        require(messages.findByKeyIgnoreCaseAndCategoryAndDeletedFalse(key, request.category) == null) {
            "Bu toifada tarjima kaliti mavjud: $key"
        }
        val values = localized(request.translations, null, requireUzLatin = true)
        val saved = messages.save(TranslationMessage(key, request.category, request.active, values))
        auditService.logAction("TRANSLATION_MESSAGE_CREATED", actorId, "id=${saved.id}; key=$key; category=${request.category}")
        return messageDto(saved)
    }

    @Transactional
    fun updateTranslation(id: Long, request: SaveTranslationMessageRequest, actorId: Long): TranslationMessageDto {
        val entity = messages.findByIdAndDeletedFalse(id) ?: throw NoSuchElementException("Tarjima topilmadi: $id")
        val key = required(request.key, "Kalit", 1, 250)
        val duplicate = messages.findByKeyIgnoreCaseAndCategoryAndDeletedFalse(key, request.category)
        require(duplicate == null || duplicate.id == entity.id) { "Bu toifada tarjima kaliti mavjud: $key" }
        entity.key = key
        entity.category = request.category
        entity.active = request.active
        entity.translations = localized(request.translations, null, requireUzLatin = true)
        val saved = messages.save(entity)
        auditService.logAction("TRANSLATION_MESSAGE_UPDATED", actorId, "id=$id; key=$key; category=${request.category}")
        return messageDto(saved)
    }

    @Transactional
    fun deleteTranslation(id: Long, actorId: Long) {
        val entity = messages.findByIdAndDeletedFalse(id) ?: throw NoSuchElementException("Tarjima topilmadi: $id")
        entity.deleted = true
        entity.active = false
        messages.save(entity)
        auditService.logAction("TRANSLATION_MESSAGE_DELETED", actorId, "id=$id; key=${entity.key}")
    }

    private fun localized(values: LocalizedValuesDto, fallback: String?, requireUzLatin: Boolean = false): LocalizedText {
        val uzLatin = values.uzLatin.trim().ifBlank { fallback?.trim().orEmpty() }
        if (requireUzLatin) require(uzLatin.isNotBlank()) { "O'zbekcha qiymat majburiy" }
        return LocalizedText(
            uzLatin = limited(uzLatin, "O'zbekcha qiymat", 1000),
            uzCyrillic = limited(values.uzCyrillic.trim(), "Ўзбекча qiymat", 1000),
            kaa = limited(values.kaa.trim(), "Qaraqalpaqsha qiymat", 1000),
            ru = limited(values.ru.trim(), "Русский qiymat", 1000),
            en = limited(values.en.trim(), "English qiymat", 1000),
        )
    }

    private fun required(value: String, label: String, min: Int, max: Int): String {
        val normalized = value.trim()
        require(normalized.length in min..max) { "$label $min-$max belgi bo'lishi kerak" }
        return normalized
    }

    private fun limited(value: String, label: String, max: Int): String {
        require(value.length <= max) { "$label $max belgidan oshmasligi kerak" }
        return value
    }

    private fun localizedDto(value: LocalizedText) = LocalizedValuesDto(
        uzLatin = value.uzLatin,
        uzCyrillic = value.uzCyrillic,
        kaa = value.kaa,
        ru = value.ru,
        en = value.en,
    )

    private fun labelDto(value: ReferenceLabel) = ReferenceLabelDto(
        id = requireNotNull(value.id), key = value.key, label = value.label, moduleName = value.moduleName,
        active = value.active, translations = localizedDto(value.translations),
        createdAt = value.createdAt, updatedAt = value.updatedAt,
    )

    private fun nationalityDto(value: Nationality) = NationalityDto(
        id = requireNotNull(value.id), name = value.name, active = value.active,
        translations = localizedDto(value.translations), createdAt = value.createdAt, updatedAt = value.updatedAt,
    )

    private fun settingDto(value: uz.scorm.lms.app.v1.systemcatalog.model.SystemSetting) = SystemSettingDto(
        id = requireNotNull(value.id), key = value.key, value = value.value,
        active = value.active, updatedAt = value.updatedAt,
    )

    private fun messageDto(value: TranslationMessage) = TranslationMessageDto(
        id = requireNotNull(value.id), key = value.key, category = value.category,
        message = value.translations.uzLatin, active = value.active,
        translations = localizedDto(value.translations), createdAt = value.createdAt, updatedAt = value.updatedAt,
    )
}
