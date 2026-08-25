package uz.scorm.lms.app.v1.classifier

import tools.jackson.module.kotlin.jacksonObjectMapper
import io.mockk.every
import io.mockk.mockk
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import uz.scorm.lms.app.v1.audit.service.AuditService
import uz.scorm.lms.app.v1.classifier.model.ClassifierImportControl
import uz.scorm.lms.app.v1.classifier.model.ClassifierImportRun
import uz.scorm.lms.app.v1.classifier.model.CountryClassifier
import uz.scorm.lms.app.v1.classifier.model.DistrictClassifier
import uz.scorm.lms.app.v1.classifier.model.RegionClassifier
import uz.scorm.lms.app.v1.classifier.repository.ClassifierImportControlRepository
import uz.scorm.lms.app.v1.classifier.repository.ClassifierImportRunRepository
import uz.scorm.lms.app.v1.classifier.repository.CountryClassifierRepository
import uz.scorm.lms.app.v1.classifier.repository.DistrictClassifierRepository
import uz.scorm.lms.app.v1.classifier.repository.RegionClassifierRepository
import uz.scorm.lms.app.v1.classifier.service.GeographyClassifierDatasetCatalog
import uz.scorm.lms.app.v1.classifier.service.GeographyClassifierImportService

class GeographyClassifierImportServiceTest {
    @Test
    fun `official import is idempotent and preserves local admin rows`() {
        val countryRepo = mockk<CountryClassifierRepository>()
        val regionRepo = mockk<RegionClassifierRepository>()
        val districtRepo = mockk<DistrictClassifierRepository>()
        val runRepo = mockk<ClassifierImportRunRepository>()
        val controlRepo = mockk<ClassifierImportControlRepository>()
        val countryValues = mutableListOf(CountryClassifier("UZ", "O'zbekiston", sortOrder = 1).withId(1))
        val namangan = RegionClassifier("UZ-NG", "Namangan viloyati", sortOrder = 7).withId(2)
        val localRegion = RegionClassifier("LOCAL-01", "Mahalliy hudud", sortOrder = 99).withId(3)
        val regionValues = mutableListOf(namangan, localRegion)
        val districtValues = mutableListOf(
            DistrictClassifier("UZ-NG-MIN", "Mingbuloq tumani", namangan, sortOrder = 2).withId(4),
            DistrictClassifier("LOCAL-D", "Mahalliy tuman", localRegion, sortOrder = 1).withId(5),
        )
        val runValues = mutableListOf<ClassifierImportRun>()
        var nextId = 1000L

        every { controlRepo.lockControl() } returns ClassifierImportControl()
        every { countryRepo.findByManagedSourceAndSourceCode(any(), any()) } answers { countryValues.firstOrNull { it.managedSource == firstArg() && it.sourceCode == secondArg() } }
        every { countryRepo.findByCode(any()) } answers { countryValues.firstOrNull { it.code == firstArg() } }
        every { countryRepo.findAllByManagedSource(any()) } answers { countryValues.filter { it.managedSource == firstArg() } }
        every { countryRepo.save(any()) } answers { firstArg<CountryClassifier>().also { if (it.id == null) { it.id = nextId++; countryValues += it } } }
        every { regionRepo.findAll() } answers { regionValues.toList() }
        every { regionRepo.findByManagedSourceAndSourceCode(any(), any()) } answers { regionValues.firstOrNull { it.managedSource == firstArg() && it.sourceCode == secondArg() } }
        every { regionRepo.findByCode(any()) } answers { regionValues.firstOrNull { it.code == firstArg() } }
        every { regionRepo.findAllByManagedSource(any()) } answers { regionValues.filter { it.managedSource == firstArg() } }
        every { regionRepo.save(any()) } answers { firstArg<RegionClassifier>().also { if (it.id == null) { it.id = nextId++; regionValues += it } } }
        every { districtRepo.findAll() } answers { districtValues.toList() }
        every { districtRepo.findByManagedSourceAndSourceCode(any(), any()) } answers { districtValues.firstOrNull { it.managedSource == firstArg() && it.sourceCode == secondArg() } }
        every { districtRepo.findByCode(any()) } answers { districtValues.firstOrNull { it.code == firstArg() } }
        every { districtRepo.findAllByManagedSource(any()) } answers { districtValues.filter { it.managedSource == firstArg() } }
        every { districtRepo.save(any()) } answers { firstArg<DistrictClassifier>().also { if (it.id == null) { it.id = nextId++; districtValues += it } } }
        every { runRepo.saveAndFlush(any()) } answers { firstArg<ClassifierImportRun>().also { if (it.id == null) { it.id = nextId++; runValues += it } } }
        every { runRepo.findFirstByDeletedFalseOrderByCreatedAtDesc() } answers { runValues.lastOrNull() }

        val service = GeographyClassifierImportService(
            GeographyClassifierDatasetCatalog(jacksonObjectMapper()),
            countryRepo, regionRepo, districtRepo, runRepo, controlRepo, mockk<AuditService>(relaxed = true),
        )

        val first = service.importBundledDataset(42)
        val second = service.importBundledDataset(42)

        assertTrue(first.current)
        assertEquals(466, first.lastRun?.createdCount)
        assertEquals(3, first.lastRun?.updatedCount)
        assertEquals(469, second.lastRun?.unchangedCount)
        assertEquals(0, second.lastRun?.createdCount)
        assertEquals(0, second.lastRun?.updatedCount)
        assertEquals(249, countryValues.count { it.managedSource == "ISO_3166_1" })
        assertEquals(14, regionValues.count { it.managedSource == "SOATO" })
        assertEquals(206, districtValues.count { it.managedSource == "SOATO" })
        assertTrue(localRegion.active)
        assertTrue(districtValues.single { it.code == "LOCAL-D" }.active)
        assertEquals(null, localRegion.managedSource)
    }

    private fun <T : uz.scorm.lms.app.common.BaseEntity> T.withId(value: Long): T = apply { id = value }
}
