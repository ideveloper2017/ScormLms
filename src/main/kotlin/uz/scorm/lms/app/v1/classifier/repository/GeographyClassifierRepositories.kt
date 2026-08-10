package uz.scorm.lms.app.v1.classifier.repository

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Lock
import org.springframework.data.jpa.repository.Query
import jakarta.persistence.LockModeType
import uz.scorm.lms.app.v1.classifier.model.CountryClassifier
import uz.scorm.lms.app.v1.classifier.model.ClassifierImportControl
import uz.scorm.lms.app.v1.classifier.model.ClassifierImportRun
import uz.scorm.lms.app.v1.classifier.model.DistrictClassifier
import uz.scorm.lms.app.v1.classifier.model.RegionClassifier

interface CountryClassifierRepository : JpaRepository<CountryClassifier, Long> {
    fun findAllByDeletedFalseOrderBySortOrderAscNameUzAsc(): List<CountryClassifier>
    fun findByCodeAndDeletedFalse(code: String): CountryClassifier?
    fun findByCode(code: String): CountryClassifier?
    fun findByManagedSourceAndSourceCode(managedSource: String, sourceCode: String): CountryClassifier?
    fun findAllByManagedSource(managedSource: String): List<CountryClassifier>
}

interface RegionClassifierRepository : JpaRepository<RegionClassifier, Long> {
    fun findAllByDeletedFalseOrderBySortOrderAscNameUzAsc(): List<RegionClassifier>
    fun findByCodeAndDeletedFalse(code: String): RegionClassifier?
    fun findByCode(code: String): RegionClassifier?
    fun findByManagedSourceAndSourceCode(managedSource: String, sourceCode: String): RegionClassifier?
    fun findAllByManagedSource(managedSource: String): List<RegionClassifier>
}

interface DistrictClassifierRepository : JpaRepository<DistrictClassifier, Long> {
    fun findAllByRegionIdAndDeletedFalseOrderBySortOrderAscNameUzAsc(regionId: Long): List<DistrictClassifier>
    fun findByCodeAndDeletedFalse(code: String): DistrictClassifier?
    fun findByCode(code: String): DistrictClassifier?
    fun findByManagedSourceAndSourceCode(managedSource: String, sourceCode: String): DistrictClassifier?
    fun findAllByManagedSource(managedSource: String): List<DistrictClassifier>
}

interface ClassifierImportRunRepository : JpaRepository<ClassifierImportRun, Long> {
    fun findFirstByDeletedFalseOrderByCreatedAtDesc(): ClassifierImportRun?
}

interface ClassifierImportControlRepository : JpaRepository<ClassifierImportControl, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT c FROM ClassifierImportControl c WHERE c.id = 1")
    fun lockControl(): ClassifierImportControl
}
