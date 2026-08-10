package uz.scorm.lms.app.v1.classifier.service

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.audit.service.AuditService
import uz.scorm.lms.app.v1.classifier.dto.ClassifierDatasetSourceDto
import uz.scorm.lms.app.v1.classifier.dto.ClassifierDatasetStatusDto
import uz.scorm.lms.app.v1.classifier.dto.ClassifierImportRunDto
import uz.scorm.lms.app.v1.classifier.model.ClassifierImportRun
import uz.scorm.lms.app.v1.classifier.model.ClassifierImportStatus
import uz.scorm.lms.app.v1.classifier.model.CountryClassifier
import uz.scorm.lms.app.v1.classifier.model.DistrictClassifier
import uz.scorm.lms.app.v1.classifier.model.RegionClassifier
import uz.scorm.lms.app.v1.classifier.repository.ClassifierImportControlRepository
import uz.scorm.lms.app.v1.classifier.repository.ClassifierImportRunRepository
import uz.scorm.lms.app.v1.classifier.repository.CountryClassifierRepository
import uz.scorm.lms.app.v1.classifier.repository.DistrictClassifierRepository
import uz.scorm.lms.app.v1.classifier.repository.RegionClassifierRepository
import java.time.Instant

@Service
class GeographyClassifierImportService(
    private val catalog: GeographyClassifierDatasetCatalog,
    private val countries: CountryClassifierRepository,
    private val regions: RegionClassifierRepository,
    private val districts: DistrictClassifierRepository,
    private val runs: ClassifierImportRunRepository,
    private val control: ClassifierImportControlRepository,
    private val auditService: AuditService,
) {
    @Transactional(readOnly = true)
    fun status(): ClassifierDatasetStatusDto {
        val snapshot = catalog.snapshot()
        val lastRun = runs.findFirstByDeletedFalseOrderByCreatedAtDesc()
        return statusDto(snapshot, lastRun)
    }

    @Transactional
    fun importBundledDataset(actorId: Long): ClassifierDatasetStatusDto {
        control.lockControl()
        val snapshot = catalog.snapshot()
        val dataset = snapshot.dataset
        val counter = ImportCounter()
        val run = runs.saveAndFlush(ClassifierImportRun(
            datasetId = dataset.datasetId,
            datasetVersion = dataset.datasetVersion,
            manifestSha256 = snapshot.manifestSha256,
            startedByUserId = actorId,
            countriesTotal = dataset.countries.size,
            regionsTotal = dataset.regions.size,
            districtsTotal = dataset.districts.size,
        ))

        importCountries(dataset, counter)
        val importedRegions = importRegions(dataset, counter)
        importDistricts(dataset, importedRegions, counter)
        deactivateMissing(dataset, counter)

        run.createdCount = counter.created
        run.updatedCount = counter.updated
        run.unchangedCount = counter.unchanged
        run.deactivatedCount = counter.deactivated
        run.status = ClassifierImportStatus.COMPLETED
        run.finishedAt = Instant.now()
        runs.saveAndFlush(run)
        auditService.logAction(
            "GEOGRAPHY_CLASSIFIER_DATASET_IMPORTED",
            actorId,
            "dataset=${dataset.datasetId}; version=${dataset.datasetVersion}; sha256=${snapshot.manifestSha256}; created=${counter.created}; updated=${counter.updated}; unchanged=${counter.unchanged}; deactivated=${counter.deactivated}",
        )
        return statusDto(snapshot, run)
    }

    private fun importCountries(dataset: GeographyClassifierDataset, counter: ImportCounter) {
        val version = "ISO-3166-1 / CLDR-48.2.0"
        dataset.countries.forEach { item ->
            val current = countries.findByManagedSourceAndSourceCode(COUNTRY_SOURCE, item.code)
                ?: countries.findByCode(item.code)
            if (current == null) {
                countries.save(CountryClassifier(item.code, item.name, true, item.sortOrder, COUNTRY_SOURCE, item.code, version))
                counter.created++
            } else {
                val changed = current.nameUz != item.name || !current.active || current.sortOrder != item.sortOrder ||
                    current.deleted || current.managedSource != COUNTRY_SOURCE || current.sourceCode != item.code || current.sourceVersion != version
                current.nameUz = item.name
                current.active = true
                current.sortOrder = item.sortOrder
                current.deleted = false
                current.managedSource = COUNTRY_SOURCE
                current.sourceCode = item.code
                current.sourceVersion = version
                if (changed) { countries.save(current); counter.updated++ } else counter.unchanged++
            }
        }
    }

    private fun importRegions(dataset: GeographyClassifierDataset, counter: ImportCounter): Map<String, RegionClassifier> {
        val existing = regions.findAll()
        val byName = existing.filterNot { it.deleted }.associateBy { normalize(it.nameUz) }
        val result = linkedMapOf<String, RegionClassifier>()
        dataset.regions.forEach { item ->
            val current = regions.findByManagedSourceAndSourceCode(SOATO_SOURCE, item.code)
                ?: regions.findByCode(item.code)
                ?: byName[normalize(item.name)]
            val value = current ?: RegionClassifier(item.code, item.name)
            val changed = current == null || value.nameUz != item.name || !value.active || value.sortOrder != item.sortOrder ||
                value.deleted || value.managedSource != SOATO_SOURCE || value.sourceCode != item.code || value.sourceVersion != dataset.sources.soato.version
            value.nameUz = item.name
            value.active = true
            value.sortOrder = item.sortOrder
            value.deleted = false
            value.managedSource = SOATO_SOURCE
            value.sourceCode = item.code
            value.sourceVersion = dataset.sources.soato.version
            val saved = if (changed) regions.save(value) else value
            if (current == null) counter.created++ else if (changed) counter.updated++ else counter.unchanged++
            result[item.code] = saved
        }
        return result
    }

    private fun importDistricts(dataset: GeographyClassifierDataset, importedRegions: Map<String, RegionClassifier>, counter: ImportCounter) {
        val existing = districts.findAll()
        val byName = existing.filterNot { it.deleted }.associateBy { districtNameKey(requireNotNull(it.region.id), it.nameUz) }.toMutableMap()
        dataset.districts.forEach { item ->
            val region = requireNotNull(importedRegions[item.regionCode]) { "SOATO ota hudud topilmadi: ${item.regionCode}" }
            val regionId = requireNotNull(region.id)
            val normalizedName = normalize(item.name)
            val cityAlias = if (!normalizedName.endsWith(" tumani") && !normalizedName.endsWith(" shahri")) "$normalizedName shahri" else normalizedName
            val current = districts.findByManagedSourceAndSourceCode(SOATO_SOURCE, item.code)
                ?: districts.findByCode(item.code)
                ?: byName["$regionId|$normalizedName"]
                ?: byName["$regionId|$cityAlias"]
            val value = current ?: DistrictClassifier(item.code, item.name, region)
            val changed = current == null || value.nameUz != item.name || value.region.id != regionId || !value.active ||
                value.sortOrder != item.sortOrder || value.deleted || value.managedSource != SOATO_SOURCE ||
                value.sourceCode != item.code || value.sourceVersion != dataset.sources.soato.version
            value.nameUz = item.name
            value.region = region
            value.active = true
            value.sortOrder = item.sortOrder
            value.deleted = false
            value.managedSource = SOATO_SOURCE
            value.sourceCode = item.code
            value.sourceVersion = dataset.sources.soato.version
            val saved = if (changed) districts.save(value) else value
            if (current == null) counter.created++ else if (changed) counter.updated++ else counter.unchanged++
            byName[districtNameKey(regionId, saved.nameUz)] = saved
        }
    }

    private fun deactivateMissing(dataset: GeographyClassifierDataset, counter: ImportCounter) {
        val countryCodes = dataset.countries.mapTo(hashSetOf()) { it.code }
        countries.findAllByManagedSource(COUNTRY_SOURCE).filter { it.sourceCode !in countryCodes && it.active }.forEach {
            it.active = false; countries.save(it); counter.deactivated++
        }
        val regionCodes = dataset.regions.mapTo(hashSetOf()) { it.code }
        regions.findAllByManagedSource(SOATO_SOURCE).filter { it.sourceCode !in regionCodes && it.active }.forEach {
            it.active = false; regions.save(it); counter.deactivated++
        }
        val districtCodes = dataset.districts.mapTo(hashSetOf()) { it.code }
        districts.findAllByManagedSource(SOATO_SOURCE).filter { it.sourceCode !in districtCodes && it.active }.forEach {
            it.active = false; districts.save(it); counter.deactivated++
        }
    }

    private fun statusDto(snapshot: GeographyDatasetSnapshot, lastRun: ClassifierImportRun?): ClassifierDatasetStatusDto {
        val dataset = snapshot.dataset
        return ClassifierDatasetStatusDto(
            datasetId = dataset.datasetId,
            datasetVersion = dataset.datasetVersion,
            manifestSha256 = snapshot.manifestSha256,
            countriesTotal = dataset.countries.size,
            regionsTotal = dataset.regions.size,
            districtsTotal = dataset.districts.size,
            sources = listOf(dataset.sources.soato, dataset.sources.countryCodes, dataset.sources.countryNames).map {
                ClassifierDatasetSourceDto(it.authority, it.title, it.version, it.url, it.sha256)
            },
            current = lastRun?.status == ClassifierImportStatus.COMPLETED && lastRun.manifestSha256 == snapshot.manifestSha256,
            lastRun = lastRun?.let(::runDto),
        )
    }

    private fun runDto(value: ClassifierImportRun) = ClassifierImportRunDto(
        id = requireNotNull(value.id), datasetVersion = value.datasetVersion, manifestSha256 = value.manifestSha256,
        status = value.status.name, countriesTotal = value.countriesTotal, regionsTotal = value.regionsTotal,
        districtsTotal = value.districtsTotal, createdCount = value.createdCount, updatedCount = value.updatedCount,
        unchangedCount = value.unchangedCount, deactivatedCount = value.deactivatedCount,
        startedAt = value.startedAt, finishedAt = value.finishedAt,
    )

    private fun districtNameKey(regionId: Long, name: String) = "$regionId|${normalize(name)}"
    private fun normalize(value: String) = value.lowercase()
        .replace(Regex("[ʻ‘’`´]"), "'")
        .replace(Regex("\\s+"), " ")
        .trim()

    private data class ImportCounter(var created: Int = 0, var updated: Int = 0, var unchanged: Int = 0, var deactivated: Int = 0)

    companion object {
        const val COUNTRY_SOURCE = "ISO_3166_1"
        const val SOATO_SOURCE = "SOATO"
    }
}
