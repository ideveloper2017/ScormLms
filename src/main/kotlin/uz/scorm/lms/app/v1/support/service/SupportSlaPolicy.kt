package uz.scorm.lms.app.v1.support.service

import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component
import uz.scorm.lms.app.v1.support.model.SupportPriority
import java.time.Duration

data class SupportSlaTarget(val response: Duration, val resolution: Duration)

@Component
class SupportSlaPolicy(
    @param:Value("\${app.support.sla.policy-version:1.0}") val version: String,
    @Value("\${app.support.sla.low-response-hours:24}") lowResponse: Long,
    @Value("\${app.support.sla.low-resolution-hours:120}") lowResolution: Long,
    @Value("\${app.support.sla.normal-response-hours:8}") normalResponse: Long,
    @Value("\${app.support.sla.normal-resolution-hours:72}") normalResolution: Long,
    @Value("\${app.support.sla.high-response-hours:4}") highResponse: Long,
    @Value("\${app.support.sla.high-resolution-hours:24}") highResolution: Long,
    @Value("\${app.support.sla.urgent-response-hours:1}") urgentResponse: Long,
    @Value("\${app.support.sla.urgent-resolution-hours:4}") urgentResolution: Long,
) {
    private val targets = mapOf(
        SupportPriority.LOW to target(lowResponse, lowResolution, "LOW"),
        SupportPriority.NORMAL to target(normalResponse, normalResolution, "NORMAL"),
        SupportPriority.HIGH to target(highResponse, highResolution, "HIGH"),
        SupportPriority.URGENT to target(urgentResponse, urgentResolution, "URGENT"),
    )

    init { require(version.isNotBlank() && version.length <= 20) { "Support SLA policy version 1..20 belgidan iborat bo'lishi kerak" } }

    fun target(priority: SupportPriority): SupportSlaTarget = targets.getValue(priority)

    private fun target(responseHours: Long, resolutionHours: Long, label: String): SupportSlaTarget {
        require(responseHours > 0 && resolutionHours > responseHours) { "$label SLA: resolution response'dan katta musbat soat bo'lishi kerak" }
        return SupportSlaTarget(Duration.ofHours(responseHours), Duration.ofHours(resolutionHours))
    }
}
