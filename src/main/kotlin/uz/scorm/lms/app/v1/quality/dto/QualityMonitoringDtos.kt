package uz.scorm.lms.app.v1.quality.dto

import uz.scorm.lms.app.v1.quality.model.QualityMonitoringMethod
import java.time.Instant

data class CreateQualityMonitoringStudyRequest(
    val method: QualityMonitoringMethod,
    val title: String,
    val objective: String,
    val academicYear: String,
    val startsAt: Instant,
    val endsAt: Instant,
    val locationDescription: String,
    val populationScope: String,
    val relatedSurveyId: Long? = null,
    val facilitatorUserId: Long? = null,
)

data class CompleteQualityMonitoringStudyRequest(
    val participantCount: Int,
    val summary: String,
    val findings: String,
    val recommendations: String,
    val evidenceReference: String,
)

data class QualityMonitoringStudyDto(
    val id: Long,
    val method: String,
    val title: String,
    val objective: String,
    val academicYear: String,
    val startsAt: Instant,
    val endsAt: Instant,
    val locationDescription: String,
    val populationScope: String,
    val relatedSurveyId: Long?,
    val facilitatorUserId: Long,
    val facilitatorName: String,
    val status: String,
    val participantCount: Int?,
    val summary: String?,
    val findings: String?,
    val recommendations: String?,
    val evidenceReference: String?,
    val participantIdentitiesStored: Boolean = false,
    val completedAt: Instant?,
    val approvedAt: Instant?,
    val approvedByName: String?,
    val cancelledAt: Instant?,
)

