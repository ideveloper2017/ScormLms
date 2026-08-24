package uz.scorm.lms.app.v1.systemcatalog.repository

import org.springframework.data.jpa.repository.JpaRepository
import uz.scorm.lms.app.v1.systemcatalog.model.Nationality
import uz.scorm.lms.app.v1.systemcatalog.model.ReferenceLabel
import uz.scorm.lms.app.v1.systemcatalog.model.SystemLanguage
import uz.scorm.lms.app.v1.systemcatalog.model.SystemSetting
import uz.scorm.lms.app.v1.systemcatalog.model.TranslationCategory
import uz.scorm.lms.app.v1.systemcatalog.model.TranslationMessage

interface ReferenceLabelRepository : JpaRepository<ReferenceLabel, Long> {
    fun findAllByDeletedFalseOrderByModuleNameAscKeyAsc(): List<ReferenceLabel>
    fun findByIdAndDeletedFalse(id: Long): ReferenceLabel?
    fun findByKeyIgnoreCaseAndModuleNameIgnoreCaseAndDeletedFalse(key: String, moduleName: String): ReferenceLabel?
}

interface NationalityRepository : JpaRepository<Nationality, Long> {
    fun findAllByDeletedFalseOrderByNameAsc(): List<Nationality>
    fun findByIdAndDeletedFalse(id: Long): Nationality?
    fun findByNameIgnoreCaseAndDeletedFalse(name: String): Nationality?
}

interface SystemLanguageRepository : JpaRepository<SystemLanguage, Long> {
    fun findAllByDeletedFalseOrderBySortOrderAsc(): List<SystemLanguage>
}

interface SystemSettingRepository : JpaRepository<SystemSetting, Long> {
    fun findAllByDeletedFalseOrderByKeyAsc(): List<SystemSetting>
    fun findByIdAndDeletedFalse(id: Long): SystemSetting?
}

interface TranslationMessageRepository : JpaRepository<TranslationMessage, Long> {
    fun findAllByDeletedFalseOrderByCategoryAscKeyAsc(): List<TranslationMessage>
    fun findByIdAndDeletedFalse(id: Long): TranslationMessage?
    fun findByKeyIgnoreCaseAndCategoryAndDeletedFalse(key: String, category: TranslationCategory): TranslationMessage?
}
