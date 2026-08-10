package uz.scorm.lms.app.v1.classifier.dto

data class ClassifierItemDto(
    val id: Long,
    val code: String,
    val name: String,
    val active: Boolean,
    val sortOrder: Int,
    val managedSource: String? = null,
    val sourceCode: String? = null,
    val sourceVersion: String? = null,
)

data class DistrictClassifierDto(
    val id: Long,
    val code: String,
    val name: String,
    val regionId: Long,
    val active: Boolean,
    val sortOrder: Int,
    val managedSource: String? = null,
    val sourceCode: String? = null,
    val sourceVersion: String? = null,
)

data class ClassifierUpsertRequest(
    val code: String,
    val name: String,
    val active: Boolean = true,
    val sortOrder: Int = 0,
)

data class DistrictClassifierUpsertRequest(
    val code: String,
    val name: String,
    val regionId: Long,
    val active: Boolean = true,
    val sortOrder: Int = 0,
)

data class ClassifierDatasetSourceDto(
    val authority: String,
    val title: String,
    val version: String,
    val url: String,
    val sha256: String? = null,
)

data class ClassifierImportRunDto(
    val id: Long,
    val datasetVersion: String,
    val manifestSha256: String,
    val status: String,
    val countriesTotal: Int,
    val regionsTotal: Int,
    val districtsTotal: Int,
    val createdCount: Int,
    val updatedCount: Int,
    val unchangedCount: Int,
    val deactivatedCount: Int,
    val startedAt: java.time.Instant,
    val finishedAt: java.time.Instant?,
)

data class ClassifierDatasetStatusDto(
    val datasetId: String,
    val datasetVersion: String,
    val manifestSha256: String,
    val countriesTotal: Int,
    val regionsTotal: Int,
    val districtsTotal: Int,
    val sources: List<ClassifierDatasetSourceDto>,
    val current: Boolean,
    val lastRun: ClassifierImportRunDto?,
)
