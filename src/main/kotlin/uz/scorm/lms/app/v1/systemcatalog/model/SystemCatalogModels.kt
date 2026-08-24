package uz.scorm.lms.app.v1.systemcatalog.model

import jakarta.persistence.Column
import jakarta.persistence.Embeddable
import jakarta.persistence.Embedded
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Table
import uz.scorm.lms.app.common.BaseEntity

@Embeddable
class LocalizedText(
    @Column(name = "text_uz_latin", nullable = false, length = 1000)
    var uzLatin: String = "",

    @Column(name = "text_uz_cyrillic", nullable = false, length = 1000)
    var uzCyrillic: String = "",

    @Column(name = "text_kaa", nullable = false, length = 1000)
    var kaa: String = "",

    @Column(name = "text_ru", nullable = false, length = 1000)
    var ru: String = "",

    @Column(name = "text_en", nullable = false, length = 1000)
    var en: String = "",
)

@Entity
@Table(name = "reference_labels")
class ReferenceLabel(
    @Column(name = "label_key", nullable = false, length = 180)
    var key: String,

    @Column(nullable = false, length = 500)
    var label: String,

    @Column(name = "module_name", nullable = false, length = 120)
    var moduleName: String,

    @Column(nullable = false)
    var active: Boolean = true,

    @Embedded
    var translations: LocalizedText = LocalizedText(),
) : BaseEntity()

@Entity
@Table(name = "nationalities")
class Nationality(
    @Column(nullable = false, length = 250)
    var name: String,

    @Column(nullable = false)
    var active: Boolean = true,

    @Embedded
    var translations: LocalizedText = LocalizedText(),
) : BaseEntity()

@Entity
@Table(name = "system_languages")
class SystemLanguage(
    @Column(nullable = false, length = 20)
    var code: String,

    @Column(nullable = false, length = 120)
    var name: String,

    @Column(nullable = false)
    var active: Boolean = true,

    @Column(name = "sort_order", nullable = false)
    var sortOrder: Int = 0,
) : BaseEntity()

@Entity
@Table(name = "system_settings")
class SystemSetting(
    @Column(name = "setting_key", nullable = false, length = 180)
    var key: String,

    @Column(name = "setting_value", nullable = false, length = 2000)
    var value: String,

    @Column(nullable = false)
    var active: Boolean = true,
) : BaseEntity()

enum class TranslationCategory {
    CRM,
    CABINET,
}

@Entity
@Table(name = "translation_messages")
class TranslationMessage(
    @Column(name = "message_key", nullable = false, length = 250)
    var key: String,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    var category: TranslationCategory,

    @Column(nullable = false)
    var active: Boolean = true,

    @Embedded
    var translations: LocalizedText = LocalizedText(),
) : BaseEntity()
