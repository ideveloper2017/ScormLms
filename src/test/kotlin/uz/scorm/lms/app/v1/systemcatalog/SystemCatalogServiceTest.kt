package uz.scorm.lms.app.v1.systemcatalog

import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import uz.scorm.lms.app.v1.audit.service.AuditService
import uz.scorm.lms.app.v1.systemcatalog.dto.LocalizedValuesDto
import uz.scorm.lms.app.v1.systemcatalog.dto.SaveNationalityRequest
import uz.scorm.lms.app.v1.systemcatalog.dto.SaveReferenceLabelRequest
import uz.scorm.lms.app.v1.systemcatalog.dto.SaveTranslationMessageRequest
import uz.scorm.lms.app.v1.systemcatalog.dto.UpdateSystemSettingRequest
import uz.scorm.lms.app.v1.systemcatalog.model.LocalizedText
import uz.scorm.lms.app.v1.systemcatalog.model.Nationality
import uz.scorm.lms.app.v1.systemcatalog.model.ReferenceLabel
import uz.scorm.lms.app.v1.systemcatalog.model.SystemSetting
import uz.scorm.lms.app.v1.systemcatalog.model.TranslationCategory
import uz.scorm.lms.app.v1.systemcatalog.repository.NationalityRepository
import uz.scorm.lms.app.v1.systemcatalog.repository.ReferenceLabelRepository
import uz.scorm.lms.app.v1.systemcatalog.repository.SystemLanguageRepository
import uz.scorm.lms.app.v1.systemcatalog.repository.SystemSettingRepository
import uz.scorm.lms.app.v1.systemcatalog.repository.TranslationMessageRepository
import uz.scorm.lms.app.v1.systemcatalog.service.SystemCatalogService

class SystemCatalogServiceTest {
    private val labels = mockk<ReferenceLabelRepository>()
    private val nationalities = mockk<NationalityRepository>()
    private val languages = mockk<SystemLanguageRepository>()
    private val settings = mockk<SystemSettingRepository>()
    private val messages = mockk<TranslationMessageRepository>()
    private val audit = mockk<AuditService>(relaxed = true)
    private val service = SystemCatalogService(labels, nationalities, languages, settings, messages, audit)

    private val translations = LocalizedValuesDto(
        uzLatin = "Nomi",
        uzCyrillic = "Номи",
        kaa = "Atı",
        ru = "Название",
        en = "Name",
    )

    @Test
    fun `yorliq modul va beshta tarjima bilan yaratiladi`() {
        every { labels.findByKeyIgnoreCaseAndModuleNameIgnoreCaseAndDeletedFalse("name", "crm") } returns null
        every { labels.save(any()) } answers { firstArg<ReferenceLabel>().apply { id = 12 } }

        val result = service.createLabel(
            SaveReferenceLabelRequest(" name ", " Nomi ", " crm ", true, translations),
            actorId = 7,
        )

        assertEquals(12, result.id)
        assertEquals("name", result.key)
        assertEquals("Name", result.translations.en)
        verify { audit.logAction("REFERENCE_LABEL_CREATED", 7, match { it.contains("id=12") }) }
    }

    @Test
    fun `bir moduldagi takroriy yorliq kaliti rad etiladi`() {
        every { labels.findByKeyIgnoreCaseAndModuleNameIgnoreCaseAndDeletedFalse("name", "crm") } returns
            ReferenceLabel("name", "Nomi", "crm")

        assertThrows<IllegalArgumentException> {
            service.createLabel(SaveReferenceLabelRequest("name", "Nomi", "crm"), actorId = 1)
        }
    }

    @Test
    fun `sozlama kaliti ozgarmasdan qiymat va holat yangilanadi`() {
        val setting = SystemSetting("grid-pagination-limit", "20", true).apply { id = 9 }
        every { settings.findByIdAndDeletedFalse(9) } returns setting
        every { settings.save(setting) } returns setting

        val result = service.updateSetting(9, UpdateSystemSettingRequest(" 60 ", false), actorId = 2)

        assertEquals("grid-pagination-limit", result.key)
        assertEquals("60", result.value)
        assertFalse(result.active)
        verify { audit.logAction("SYSTEM_SETTING_UPDATED", 2, match { it.contains("grid-pagination-limit") }) }
    }

    @Test
    fun `tarjima uchun ozbekcha qiymat majburiy`() {
        every { messages.findByKeyIgnoreCaseAndCategoryAndDeletedFalse("Name", TranslationCategory.CRM) } returns null

        assertThrows<IllegalArgumentException> {
            service.createTranslation(
                SaveTranslationMessageRequest("Name", TranslationCategory.CRM, true, LocalizedValuesDto(en = "Name")),
                actorId = 3,
            )
        }
    }

    @Test
    fun `millat ochirilganda soft delete qilinadi`() {
        val nationality = Nationality("O'zbek", true, LocalizedText(uzLatin = "O'zbek")).apply { id = 5 }
        every { nationalities.findByIdAndDeletedFalse(5) } returns nationality
        every { nationalities.save(nationality) } returns nationality

        service.deleteNationality(5, actorId = 4)

        assertFalse(nationality.active)
        assertEquals(true, nationality.deleted)
        verify { audit.logAction("NATIONALITY_DELETED", 4, match { it.contains("id=5") }) }
    }
}
