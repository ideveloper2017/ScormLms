package uz.scorm.lms.app.v1.compliance.uat

import tools.jackson.databind.JsonNode
import tools.jackson.databind.ObjectMapper
import org.springframework.core.io.ClassPathResource
import org.springframework.stereotype.Service
import org.springframework.web.util.HtmlUtils
import java.security.MessageDigest

@Service
class Decision559UatRequirementCatalog(
    private val objectMapper: ObjectMapper,
) {
    private val catalog by lazy { loadAndValidate() }

    init {
        catalog
    }

    fun list(): List<Decision559UatRequirementGuidanceDto> = catalog

    fun requirement(band: Int, requirementId: String): Decision559UatRequirementGuidanceDto =
        catalog.singleOrNull { it.band == band && it.id == requirementId }
            ?: throw IllegalArgumentException("Band va requirement ID 559 UAT katalogiga mos emas")

    fun manualEvidencePack(): PrivateEvidenceFile {
        val partial = catalog.filter { it.baselineStatus == "PARTIAL" }
        val bytes = manualEvidencePackHtml(partial).toByteArray(Charsets.UTF_8)
        return PrivateEvidenceFile(
            bytes = bytes,
            contentType = "text/html;charset=UTF-8",
            originalName = "decision-559-manual-evidence-intake-pack.html",
            sha256 = MessageDigest.getInstance("SHA-256").digest(bytes).joinToString("") { "%02x".format(it) },
        )
    }

    private fun loadAndValidate(): List<Decision559UatRequirementGuidanceDto> {
        val root = ClassPathResource(RESOURCE_PATH).inputStream.use(objectMapper::readTree)
        require(root.path("schemaVersion").asInt() == 2) { "559 UAT katalog schemaVersion=2 bo'lishi kerak" }
        require(root.path("decisionNumber").asInt() == 559) { "559 UAT katalog qaror raqami noto'g'ri" }
        require(root.path("source").path("sha256").asText() == Decision559UatService.SOURCE_SHA256) {
            "559 UAT katalog manba SHA-256 qiymati tasdiqlangan PDFga mos emas"
        }

        val requirementsNode = root.path("requirements")
        require(requirementsNode.isArray) { "559 UAT katalog requirements massivi mavjud emas" }
        val requirements = requirementsNode.values().map(::toGuidance)
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
        val manualEvidence = node.optionalTextList("manualEvidence")
        if (status == "PARTIAL") {
            require(manualEvidence.isNotEmpty()) { "$id PARTIAL bandi uchun real manualEvidence ro'yxati majburiy" }
        } else {
            require(manualEvidence.isEmpty()) { "$id AUTOMATED_PASS bandiga manualEvidence yozilmasligi kerak" }
        }
        return Decision559UatRequirementGuidanceDto(
            id = id,
            band = band,
            title = node.requiredText("title"),
            baselineStatus = status,
            owner = node.requiredText("owner"),
            evidence = evidence,
            blockedBy = blockedBy,
            manualEvidence = manualEvidence,
            note = node.requiredText("note"),
        )
    }

    private fun manualEvidencePackHtml(partial: List<Decision559UatRequirementGuidanceDto>): String = buildString {
        append("<!doctype html>\n<html lang=\"uz\"><head><meta charset=\"utf-8\">\n")
        append("<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">\n")
        append("<title>559-son qaror manual dalillar intake paketi</title>\n")
        append("<style>@page{size:A4;margin:14mm}body{font-family:Arial,sans-serif;color:#111;font-size:11px;line-height:1.4}h1{font-size:20px;text-align:center}table{width:100%;border-collapse:collapse}th,td{border:1px solid #555;padding:6px;vertical-align:top}th{background:#eee}tr{break-inside:avoid}ul{margin:0;padding-left:18px}.mono{font-family:monospace;word-break:break-all}.fill{height:28px}</style>\n")
        append("</head><body data-decision-number=\"559\" data-partial-count=\"").append(partial.size).append("\">\n")
        append("<h1>559-son qaror bo'yicha real/manual dalillar intake paketi</h1>\n")
        append("<p><strong>Maqsad:</strong> quyidagi hujjatlar texnik testlarni almashtirmaydi; ular 14 ta PARTIAL bandni vakolatli mas'ullar bilan real UATda yakunlash uchun yig'iladi.</p>\n")
        append("<p class=\"mono\"><strong>Qaror PDF SHA-256:</strong> ").append(Decision559UatService.SOURCE_SHA256).append("</p>\n")
        append("<table><thead><tr><th>Band</th><th>Talab</th><th>Mas'ul</th><th>Real dalillar</th><th>DEP</th><th>Rekvizit / muddat / imzo</th></tr></thead><tbody>\n")
        partial.sortedBy { it.band }.forEach { item ->
            append("<tr data-requirement-id=\"").append(html(item.id)).append("\"><td>").append(item.band)
                .append("</td><td><strong>").append(html(item.title)).append("</strong><br><span class=\"mono\">")
                .append(html(item.id)).append("</span></td><td>").append(html(item.owner)).append("</td><td><ul>")
            item.manualEvidence.forEach { evidence -> append("<li>").append(html(evidence)).append("</li>") }
            append("</ul></td><td>").append(html(item.blockedBy.joinToString(", ").ifBlank { "-" }))
                .append("</td><td class=\"fill\"></td></tr>\n")
        }
        append("</tbody></table>\n")
        append("<h2>Qabul tartibi</h2><ol><li>Mas'ul asl hujjat yoki tekshiriladigan rekvizitni beradi.</li><li>UAT_WRITE foydalanuvchi bandga private PDF/PNG/JPEG yuklaydi.</li><li>Boshqa UAT_APPROVE foydalanuvchi dalilni mustaqil review qiladi.</li><li>27/27 final qabuldan keyin runtime protokol loyihasi olinib komissiya imzolaydi.</li></ol>\n")
        append("</body></html>\n")
    }

    private fun html(value: String): String = HtmlUtils.htmlEscape(value)

    private fun JsonNode.requiredText(field: String): String = path(field).asText().trim().also {
        require(it.isNotEmpty()) { "559 UAT katalog $field maydoni bo'sh bo'lmasligi kerak" }
    }

    private fun JsonNode.requiredTextList(field: String): List<String> {
        val value = path(field)
        require(value.isArray) { "559 UAT katalog $field massivi mavjud emas" }
        return value.values().map { it.asText().trim() }.also { items ->
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
