package uz.scorm.lms.app.v1.scorm.dto

import uz.scorm.lms.app.v1.scorm.model.ScormAttemptStatus
import uz.scorm.lms.app.v1.scorm.model.ScormPackageStatus
import uz.scorm.lms.app.v1.scorm.model.ScormVersion
import java.time.Instant

data class ScormPackageDto(
    val id: Long,
    val courseId: Long,
    val title: String,
    val version: ScormVersion,
    val manifestIdentifier: String?,
    val entryPoint: String,
    val status: ScormPackageStatus,
    val importedBy: String,
    val createdAt: Instant?,
)

data class ScormLaunchDto(
    val packageId: Long,
    val attemptId: Long,
    val courseId: Long,
    val title: String,
    val version: ScormVersion,
    val launchUrl: String,
    val status: ScormAttemptStatus,
    val runtimeData: Map<String, String>,
)

data class ScormRuntimeUpdateRequest(
    val values: Map<String, String> = emptyMap(),
    val finish: Boolean = false,
)

data class ScormAttemptDto(
    val id: Long,
    val packageId: Long,
    val status: ScormAttemptStatus,
    val scoreRaw: Double?,
    val progressMeasure: Double?,
    val totalTimeSeconds: Long,
    val runtimeData: Map<String, String>,
    val startedAt: Instant?,
    val completedAt: Instant?,
    val lastAccessedAt: Instant?,
)

data class ScormLaunchResult(
    val dto: ScormLaunchDto,
    val cookieToken: String,
    val cookiePath: String,
)
