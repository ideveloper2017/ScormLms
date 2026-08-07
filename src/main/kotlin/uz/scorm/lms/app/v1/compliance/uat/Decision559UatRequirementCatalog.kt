package uz.scorm.lms.app.v1.compliance.uat

import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.ObjectMapper
import org.springframework.core.io.ClassPathResource
import org.springframework.stereotype.Service

@Service
class Decision559UatRequirementCatalog(
    private val objectMapper: ObjectMapper,
) {
    private val catalog by lazy { loadAndValidate() }

    init {
        catalog
    }

    fun list(): List<Decision559UatRequirementGuidanceDto> = catalog

    private fun loadAndValidate(): List<Decision559UatRequirementGuidanceDto> {
        val root = ClassPathResource(RESOURCE_PATH).inputStream.use(objectMapper::readTree)
        require(root.path("schemaVersion").asInt() == 1) { "559 UAT katalog schemaVersion=1 bo'lishi kerak" }
        require(root.path("decisionNumber").asInt() == 559) { "559 UAT katalog qaror raqami noto'g'ri" }
        require(root.path("source").path("sha256").asText() == Decision559UatService.SOURCE_SHA256) {
            "559 UAT katalog manba SHA-256 qiymati tasdiqlangan PDFga mos emas"
        }

        val requirementsNode = root.path("requirements")
        require(requirementsNode.isArray) { "559 UAT katalog requirements massivi mavjud emas" }
        val requirements = requirementsNode.map(::toGuidance)
        require(requirements.map { it.band }.toSet() == Decision559UatService.REQUIRED_BANDS) {
            "559 UAT katalog aynan 3 va 8..33-bandlarni qamrashi kerak"
        }
        require(requirements.map { it.id }.toSet().size == requirements.size) {
            "559 UAT katalog requirement ID qiymatlari takrorlanmasligi kerak"
        }
        return requirements.sortedBy { it.band }
    }

    private fun toGuidance(node: JsonNode): Decision559UatRequirementGuidanceDto {
        val band = node.path("band").asInt(-1)
        val expectedId = "UAT-559-${band.toString().padStart(2, '0')}"
        val id = node.requiredText("id")
        require(id == expectedId) { "559 UAT katalog ID bandga mos emas: $expectedId" }
        val status = node.requiredText("status")
        require(status in BASELINE_STATUSES) { "559 UAT katalog baseline statusi noto'g'ri: $status" }
        val evidence = node.requiredTextList("evidence")
        require(evidence.isNotEmpty()) { "$id uchun texnik baseline dalili mavjud emas" }
        val blockedBy = node.optionalTextList("blockedBy")
        require(blockedBy.all { DEPENDENCY_PATTERN.matches(it) }) { "$id blockedBy formati noto'g'ri" }
        return Decision559UatRequirementGuidanceDto(
            id = id,
            band = band,
            title = node.requiredText("title"),
            baselineStatus = status,
            owner = node.requiredText("owner"),
            evidence = evidence,
            blockedBy = blockedBy,
            note = node.requiredText("note"),
        )
    }

    private fun JsonNode.requiredText(field: String): String = path(field).asText().trim().also {
        require(it.isNotEmpty()) { "559 UAT katalog $field maydoni bo'sh bo'lmasligi kerak" }
    }

    private fun JsonNode.requiredTextList(field: String): List<String> {
        val value = path(field)
        require(value.isArray) { "559 UAT katalog $field massivi mavjud emas" }
        return value.map { it.asText().trim() }.also { items ->
            require(items.all(String::isNotEmpty)) { "559 UAT katalog $field qiymati bo'sh bo'lmasligi kerak" }
        }
    }

    private fun JsonNode.optionalTextList(field: String): List<String> =
        if (has(field)) requiredTextList(field) else emptyList()

    companion object {
        private const val RESOURCE_PATH = "uat/decision-559-uat-evidence.json"
        private val BASELINE_STATUSES = setOf("AUTOMATED_PASS", "PARTIAL")
        private val DEPENDENCY_PATTERN = Regex("DEP-\\d{2}")
    }
}
