package uz.scorm.lms.app.v1.classifier

import com.fasterxml.jackson.databind.ObjectMapper
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import uz.scorm.lms.app.v1.classifier.service.GeographyClassifierDatasetCatalog

class GeographyClassifierDatasetCatalogTest {
    private val catalog = GeographyClassifierDatasetCatalog(ObjectMapper().findAndRegisterModules())

    @Test
    fun `bundled official dataset has fixed version hash and complete classifier levels`() {
        val snapshot = catalog.snapshot()

        assertEquals("GEOGRAPHY_UZ_V64", snapshot.dataset.datasetId)
        assertEquals("5C2CC4EA41E75D19F5CB4E570A8E6781ECF1DB0F790C76C67F6619065F359A93", snapshot.manifestSha256)
        assertEquals(249, snapshot.dataset.countries.size)
        assertEquals(14, snapshot.dataset.regions.size)
        assertEquals(206, snapshot.dataset.districts.size)
        val regionCodes = snapshot.dataset.regions.map { it.code }.toSet()
        assertTrue(snapshot.dataset.districts.all { it.regionCode in regionCodes })
        assertEquals("Isroil", snapshot.dataset.countries.single { it.code == "IL" }.name)
        assertEquals("Namangan viloyati", snapshot.dataset.regions.single { it.code == "1714" }.name)
    }
}
