package uz.scorm.lms.app.v1.hemis.dto

import java.time.Instant

data class HemisConnectionStatus(
    val status: String,
    val host: String?,
    val apiBasePath: String?,
    val missingFields: List<String>,
    val message: String,
    val checkedAt: Instant? = null,
    val groupsTotal: Long? = null,
)
