package uz.scorm.lms.app.v1.hemis.sync.repository

import jakarta.persistence.LockModeType
import org.springframework.data.jpa.repository.EntityGraph
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Lock
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import uz.scorm.lms.app.v1.hemis.sync.model.*

interface HemisSyncRunRepository : JpaRepository<HemisSyncRun, Long> {
    fun countByDeletedFalse(): Long

    @EntityGraph(attributePaths = ["startedBy"])
    fun findAllByDeletedFalseOrderByCreatedAtDesc(): List<HemisSyncRun>

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @EntityGraph(attributePaths = ["startedBy"])
    @Query("SELECT r FROM HemisSyncRun r WHERE r.id = :id AND r.deleted = false")
    fun lockById(@Param("id") id: Long): HemisSyncRun?
}

interface HemisSyncControlRepository : JpaRepository<HemisSyncControl, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @EntityGraph(attributePaths = ["currentRun"])
    @Query("SELECT c FROM HemisSyncControl c WHERE c.id = 1")
    fun lockControl(): HemisSyncControl
}

interface HemisGroupMappingRepository : JpaRepository<HemisGroupMapping, Long> {
    @EntityGraph(attributePaths = ["localGroup", "localGroup.program", "localGroup.program.department", "localGroup.program.department.faculty"])
    fun findByHemisGroupIdAndDeletedFalse(hemisGroupId: Long): HemisGroupMapping?

    @EntityGraph(attributePaths = ["localGroup", "localGroup.program"])
    fun findAllByDeletedFalseOrderByHemisGroupNameAsc(): List<HemisGroupMapping>
}

interface HemisSyncItemRepository : JpaRepository<HemisSyncItem, Long> {
    @EntityGraph(attributePaths = ["localStudent"])
    fun findAllByRunIdAndDeletedFalseOrderByIdAsc(runId: Long): List<HemisSyncItem>
    fun existsByRunIdAndHemisStudentId(runId: Long, hemisStudentId: Long): Boolean
}

interface HemisSyncConflictRepository : JpaRepository<HemisSyncConflict, Long> {
    @EntityGraph(attributePaths = ["run", "item", "localStudent", "resolvedBy"])
    fun findAllByDeletedFalseOrderByCreatedAtDesc(): List<HemisSyncConflict>

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @EntityGraph(attributePaths = ["run", "item", "localStudent", "resolvedBy"])
    @Query("SELECT c FROM HemisSyncConflict c WHERE c.id = :id AND c.deleted = false")
    fun lockById(@Param("id") id: Long): HemisSyncConflict?

    fun countByStatusAndDeletedFalse(status: HemisSyncConflictStatus): Long
}
