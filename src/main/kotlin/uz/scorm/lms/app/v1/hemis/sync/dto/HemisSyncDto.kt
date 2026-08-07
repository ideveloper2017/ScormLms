package uz.scorm.lms.app.v1.hemis.sync.dto

import java.time.Instant

data class HemisSyncRunDto(
    val id: Long,
    val trigger: String,
    val status: String,
    val startedById: Long?,
    val startedByName: String?,
    val scopeGroupId: Long?,
    val checkpointGroupId: Long?,
    val checkpointOffset: Int,
    val groupsTotal: Int,
    val groupsProcessed: Int,
    val recordsSeen: Int,
    val created: Int,
    val updated: Int,
    val unchanged: Int,
    val conflicts: Int,
    val errors: Int,
    val startedAt: Instant?,
    val finishedAt: Instant?,
    val lastErrorCode: String?,
    val lastErrorMessage: String?,
    val createdAt: Instant?,
    val canResume: Boolean,
)

data class HemisSyncOverviewDto(
    val periodicEnabled: Boolean,
    val asyncEnabled: Boolean,
    val pageSize: Int,
    val cron: String,
    val currentRun: HemisSyncRunDto?,
    val lastRun: HemisSyncRunDto?,
    val openConflicts: Long,
    val mappingsTotal: Int,
    val mappingsReady: Int,
    val credentialsConfigured: Boolean,
    val canManage: Boolean,
)

data class HemisSyncItemDto(
    val id: Long,
    val hemisStudentId: Long,
    val studentNumberMasked: String,
    val outcome: String,
    val localStudentId: Long?,
    val changedFields: List<String>,
    val errorCode: String?,
    val errorMessage: String?,
    val createdAt: Instant?,
)

data class HemisSyncRunDetailDto(
    val run: HemisSyncRunDto,
    val items: List<HemisSyncItemDto>,
)

data class HemisGroupMappingDto(
    val hemisGroupId: Long,
    val hemisGroupName: String,
    val localGroupId: Long?,
    val localGroupName: String?,
    val active: Boolean,
    val lastSeenAt: Instant,
    val mappedAt: Instant?,
)

data class HemisLocalGroupDto(val id: Long, val name: String, val programName: String?)

data class HemisGroupMappingRequest(val localGroupId: Long?, val active: Boolean = true)

data class HemisSyncStartRequest(val groupId: Long? = null)

data class HemisSyncConflictDto(
    val id: Long,
    val runId: Long,
    val itemId: Long,
    val localStudentId: Long?,
    val studentNumberMasked: String,
    val code: String,
    val fieldName: String?,
    val localValueMasked: String?,
    val sourceValueMasked: String?,
    val status: String,
    val resolutionNote: String?,
    val resolvedByName: String?,
    val resolvedAt: Instant?,
    val createdAt: Instant?,
    val canResolve: Boolean,
)

data class ResolveHemisConflictRequest(val note: String)
