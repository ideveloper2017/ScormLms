package uz.scorm.lms.app.v1.hemis.sync.model

import jakarta.persistence.*
import uz.scorm.lms.app.common.BaseEntity
import uz.scorm.lms.app.v1.group.model.Group
import uz.scorm.lms.app.v1.student.model.StudentProfile
import uz.scorm.lms.app.v1.user.model.User
import java.time.Instant

enum class HemisSyncTrigger { MANUAL, SCHEDULED }
enum class HemisSyncRunStatus { QUEUED, RUNNING, COMPLETED, PARTIAL, FAILED }
enum class HemisSyncItemOutcome { CREATED, UPDATED, UNCHANGED, CONFLICT, ERROR }
enum class HemisSyncConflictStatus { OPEN, RESOLVED }

@Entity
@Table(name = "hemis_sync_runs", indexes = [Index(name = "idx_hemis_sync_run_status", columnList = "run_status,created_at")])
class HemisSyncRun(
    @Enumerated(EnumType.STRING)
    @Column(name = "trigger_type", nullable = false, length = 20)
    var trigger: HemisSyncTrigger,

    @Enumerated(EnumType.STRING)
    @Column(name = "run_status", nullable = false, length = 20)
    var status: HemisSyncRunStatus = HemisSyncRunStatus.QUEUED,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "started_by_user_id")
    var startedBy: User? = null,

    @Column(name = "scope_group_id")
    var scopeGroupId: Long? = null,

    @Column(name = "checkpoint_group_id")
    var checkpointGroupId: Long? = null,

    @Column(name = "checkpoint_offset", nullable = false)
    var checkpointOffset: Int = 0,

    @Column(name = "groups_total", nullable = false)
    var groupsTotal: Int = 0,

    @Column(name = "groups_processed", nullable = false)
    var groupsProcessed: Int = 0,

    @Column(name = "records_seen", nullable = false)
    var recordsSeen: Int = 0,

    @Column(name = "created_count", nullable = false)
    var createdCount: Int = 0,

    @Column(name = "updated_count", nullable = false)
    var updatedCount: Int = 0,

    @Column(name = "unchanged_count", nullable = false)
    var unchangedCount: Int = 0,

    @Column(name = "conflict_count", nullable = false)
    var conflictCount: Int = 0,

    @Column(name = "error_count", nullable = false)
    var errorCount: Int = 0,

    @Column(name = "started_at")
    var startedAt: Instant? = null,

    @Column(name = "finished_at")
    var finishedAt: Instant? = null,

    @Column(name = "last_error_code", length = 100)
    var lastErrorCode: String? = null,

    @Column(name = "last_error_message", length = 1000)
    var lastErrorMessage: String? = null,
) : BaseEntity()

@Entity
@Table(name = "hemis_sync_control")
class HemisSyncControl(
    @Id
    var id: Long = 1,

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "current_run_id")
    var currentRun: HemisSyncRun? = null,

    @Column(name = "last_scheduled_at")
    var lastScheduledAt: Instant? = null,

    @Version
    var version: Long = 0,
)

@Entity
@Table(
    name = "hemis_group_mappings",
    uniqueConstraints = [UniqueConstraint(name = "uk_hemis_group_mapping", columnNames = ["hemis_group_id"])],
)
class HemisGroupMapping(
    @Column(name = "hemis_group_id", nullable = false)
    var hemisGroupId: Long,

    @Column(name = "hemis_group_name", nullable = false, length = 250)
    var hemisGroupName: String,

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "local_group_id")
    var localGroup: Group? = null,

    @Column(nullable = false)
    var active: Boolean = true,

    @Column(name = "last_seen_at", nullable = false)
    var lastSeenAt: Instant = Instant.now(),

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mapped_by_user_id")
    var mappedBy: User? = null,

    @Column(name = "mapped_at")
    var mappedAt: Instant? = null,
) : BaseEntity()

@Entity
@Table(
    name = "hemis_sync_items",
    uniqueConstraints = [UniqueConstraint(name = "uk_hemis_sync_item", columnNames = ["run_id", "hemis_student_id"])],
)
class HemisSyncItem(
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "run_id", nullable = false)
    var run: HemisSyncRun,

    @Column(name = "hemis_student_id", nullable = false)
    var hemisStudentId: Long,

    @Column(name = "student_number", nullable = false, length = 50)
    var studentNumber: String,

    @Column(name = "source_hash", nullable = false, length = 128)
    var sourceHash: String,

    @Enumerated(EnumType.STRING)
    @Column(name = "item_outcome", nullable = false, length = 20)
    var outcome: HemisSyncItemOutcome,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "local_student_id")
    var localStudent: StudentProfile? = null,

    @Column(name = "changed_fields", length = 1000)
    var changedFields: String? = null,

    @Column(name = "error_code", length = 100)
    var errorCode: String? = null,

    @Column(name = "error_message", length = 1000)
    var errorMessage: String? = null,
) : BaseEntity()

@Entity
@Table(name = "hemis_sync_conflicts", indexes = [Index(name = "idx_hemis_sync_conflict_status", columnList = "conflict_status,created_at")])
class HemisSyncConflict(
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "run_id", nullable = false)
    var run: HemisSyncRun,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "item_id", nullable = false)
    var item: HemisSyncItem,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "local_student_id")
    var localStudent: StudentProfile? = null,

    @Column(name = "conflict_code", nullable = false, length = 100)
    var code: String,

    @Column(name = "field_name", length = 100)
    var fieldName: String? = null,

    @Column(name = "local_value_masked", length = 500)
    var localValueMasked: String? = null,

    @Column(name = "source_value_masked", length = 500)
    var sourceValueMasked: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "conflict_status", nullable = false, length = 20)
    var status: HemisSyncConflictStatus = HemisSyncConflictStatus.OPEN,

    @Column(name = "resolution_note", length = 1000)
    var resolutionNote: String? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resolved_by_user_id")
    var resolvedBy: User? = null,

    @Column(name = "resolved_at")
    var resolvedAt: Instant? = null,
) : BaseEntity()
