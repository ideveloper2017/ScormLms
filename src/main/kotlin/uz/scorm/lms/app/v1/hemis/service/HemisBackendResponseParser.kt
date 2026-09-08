package uz.scorm.lms.app.v1.hemis.service

import tools.jackson.databind.JsonNode
import tools.jackson.databind.node.ObjectNode
import tools.jackson.module.kotlin.jacksonObjectMapper
import uz.scorm.lms.app.v1.hemis.model.HemisStudent

/** Backend API uses a pagination envelope; Swagger also documents singleton arrays. */
internal object HemisBackendResponseParser {
    private val mapper = jacksonObjectMapper()

    data class Page(val items: List<JsonNode>, val total: Long, val size: Int)

    fun page(root: JsonNode, requestedSize: Int): Page {
        check(root.path("success").asBoolean(false)) { "HEMIS_RESPONSE_INVALID" }
        val data = singleObject(root.path("data"))
        val items = data.path("items")
        check(items.isArray) { "HEMIS_ITEMS_INVALID" }
        val pagination = data.path("pagination").takeUnless { it.isMissingNode || it.isNull }?.let(::singleObject)
        val total = (pagination?.path("totalCount") ?: data.path("total")).asLong(-1)
        val size = pagination?.path("pageSize")?.asInt(requestedSize) ?: requestedSize
        check(total >= 0 && size in 1..200) { "HEMIS_PAGINATION_INVALID" }
        return Page(items.toList(), total, size)
    }

    fun student(raw: JsonNode): HemisStudent {
        val node = singleObject(raw).deepCopy()
        if (node.path("university").isObject) node.put("university", node.path("university").path("name").asText())
        if (!node.hasNonNull("faculty")) node.set("faculty", node.path("department"))
        if (!node.hasNonNull("educationLang")) node.set("educationLang", node.path("group").path("educationLang"))
        val semester = node.path("semester") as? ObjectNode ?: error("HEMIS_SEMESTER_INVALID")
        if (!semester.hasNonNull("education_year")) semester.set("education_year", node.path("educationYear"))
        return mapper.treeToValue(node, HemisStudent::class.java)
    }

    private fun singleObject(node: JsonNode): ObjectNode {
        val value = if (node.isArray && node.size() == 1) node[0] else node
        return value as? ObjectNode ?: error("HEMIS_ENVELOPE_INVALID")
    }
}
