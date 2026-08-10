package uz.scorm.lms.app.v1.classifier.service

import com.fasterxml.jackson.databind.ObjectMapper
import org.springframework.core.io.ClassPathResource
import org.springframework.stereotype.Component
import java.security.MessageDigest

data class GeographyDatasetSource(
    val authority: String,
    val title: String,
    val version: String,
    val url: String,
    val sha256: String? = null,
)

data class GeographyDatasetSources(
    val soato: GeographyDatasetSource,
    val countryCodes: GeographyDatasetSource,
    val countryNames: GeographyDatasetSource,
)

data class CountryDatasetItem(val code: String, val name: String, val sortOrder: Int)
data class RegionDatasetItem(val code: String, val name: String, val sortOrder: Int)
data class DistrictDatasetItem(val code: String, val regionCode: String, val name: String, val sortOrder: Int)

data class GeographyClassifierDataset(
    val datasetId: String,
    val datasetVersion: String,
    val generatedAt: String,
    val sources: GeographyDatasetSources,
    val countries: List<CountryDatasetItem>,
    val regions: List<RegionDatasetItem>,
    val districts: List<DistrictDatasetItem>,
)

data class GeographyDatasetSnapshot(val dataset: GeographyClassifierDataset, val manifestSha256: String)

@Component
class GeographyClassifierDatasetCatalog(private val objectMapper: ObjectMapper) {
    private val snapshot: GeographyDatasetSnapshot by lazy(::readAndValidate)

    fun snapshot(): GeographyDatasetSnapshot = snapshot

    private fun readAndValidate(): GeographyDatasetSnapshot {
        val bytes = ClassPathResource(RESOURCE_PATH).inputStream.use { it.readBytes() }
        val dataset = objectMapper.readValue(bytes, GeographyClassifierDataset::class.java)
        require(dataset.datasetId.isNotBlank() && dataset.datasetVersion.isNotBlank()) { "Klassifikator paketi identifikatori yoki versiyasi yo'q" }
        require(dataset.countries.size == 249) { "ISO mamlakatlar soni 249 bo'lishi kerak" }
        require(dataset.regions.size == 14) { "SOATO hududlar soni 14 bo'lishi kerak" }
        require(dataset.districts.size == 206) { "SOATO tuman/shaharlar soni 206 bo'lishi kerak" }
        require(dataset.countries.all { it.code.matches(Regex("[A-Z]{2}")) && it.name.isNotBlank() }) { "ISO mamlakat yozuvi noto'g'ri" }
        requireUnique(dataset.countries.map { it.code }, "ISO mamlakat kodi")
        require(dataset.regions.all { it.code.matches(Regex("\\d{4}")) && it.name.isNotBlank() }) { "SOATO hudud yozuvi noto'g'ri" }
        requireUnique(dataset.regions.map { it.code }, "SOATO hudud kodi")
        val regionCodes = dataset.regions.mapTo(hashSetOf()) { it.code }
        require(dataset.districts.all { it.code.matches(Regex("\\d{7}")) && it.regionCode in regionCodes && it.name.isNotBlank() }) { "SOATO tuman/shahar yozuvi yoki ota hududi noto'g'ri" }
        requireUnique(dataset.districts.map { it.code }, "SOATO tuman/shahar kodi")
        listOfNotNull(dataset.sources.soato.sha256, dataset.sources.countryNames.sha256).forEach {
            require(it.matches(Regex("[A-F0-9]{64}"))) { "Manba SHA-256 qiymati noto'g'ri" }
        }
        return GeographyDatasetSnapshot(dataset, sha256(bytes))
    }

    private fun requireUnique(values: List<String>, label: String) {
        require(values.size == values.toSet().size) { "$label takrorlangan" }
    }

    private fun sha256(bytes: ByteArray) = MessageDigest.getInstance("SHA-256")
        .digest(bytes).joinToString("") { "%02X".format(it) }

    companion object {
        const val RESOURCE_PATH = "classifiers/geography-classifiers-v64.json"
    }
}
