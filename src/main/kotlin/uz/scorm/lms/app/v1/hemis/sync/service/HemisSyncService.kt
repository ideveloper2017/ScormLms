package uz.scorm.lms.app.v1.hemis.sync.service

import tools.jackson.databind.ObjectMapper
import org.springframework.beans.factory.annotation.Value
import org.springframework.scheduling.annotation.Async
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Service
import org.springframework.transaction.PlatformTransactionManager
import org.springframework.transaction.annotation.Transactional
import org.springframework.transaction.support.TransactionTemplate
import uz.scorm.lms.app.v1.audit.service.AuditService
import uz.scorm.lms.app.v1.group.repository.GroupRepository
import uz.scorm.lms.app.v1.hemis.dto.HemisGroupItem
import uz.scorm.lms.app.v1.hemis.model.HemisStudent
import uz.scorm.lms.app.v1.hemis.service.HemisDirectoryClient
import uz.scorm.lms.app.v1.hemis.service.HemisService
import uz.scorm.lms.app.v1.hemis.sync.dto.*
import uz.scorm.lms.app.v1.hemis.sync.model.*
import uz.scorm.lms.app.v1.hemis.sync.repository.*
import uz.scorm.lms.app.v1.student.dto.StudentUpdateRequest
import uz.scorm.lms.app.v1.student.model.StudentProfile
import uz.scorm.lms.app.v1.student.repository.StudentRepository
import uz.scorm.lms.app.v1.student.service.StudentService
import uz.scorm.lms.app.v1.user.model.User
import uz.scorm.lms.app.v1.user.repository.UserRepository
import java.security.MessageDigest
import java.time.Instant

@Service
class HemisSyncService(
    private val runRepository: HemisSyncRunRepository,
    private val controlRepository: HemisSyncControlRepository,
    private val mappingRepository: HemisGroupMappingRepository,
    private val itemRepository: HemisSyncItemRepository,
    private val conflictRepository: HemisSyncConflictRepository,
    private val groupRepository: GroupRepository,
    private val userRepository: UserRepository,
    private val client: HemisDirectoryClient,
    private val worker: HemisSyncWorker,
    private val auditService: AuditService,
    transactionManager: PlatformTransactionManager,
    @param:Value("\${app.hemis.sync.enabled:false}") private val periodicEnabled: Boolean,
    @param:Value("\${app.hemis.sync.async-enabled:true}") private val asyncEnabled: Boolean,
    @param:Value("\${app.hemis.sync.page-size:100}") private val pageSize: Int,
    @param:Value("\${app.hemis.sync.cron:0 0 */6 * * *}") private val cron: String,
) {
    private val tx = TransactionTemplate(transactionManager)

    fun startManual(userId: Long, groupId: Long? = null): HemisSyncRunDto =
        start(HemisSyncTrigger.MANUAL, userId, groupId)

    fun startScheduled(): HemisSyncRunDto = start(HemisSyncTrigger.SCHEDULED, null, null)

    private fun start(trigger: HemisSyncTrigger, userId: Long?, groupId: Long?): HemisSyncRunDto {
        require(client.credentialsConfigured()) { "HEMIS_CREDENTIALS_NOT_CONFIGURED" }
        val result = tx.execute {
            val control = controlRepository.lockControl()
            val active = control.currentRun
            require(active == null || active.status !in ACTIVE_STATUSES) { "HEMIS_SYNC_ALREADY_RUNNING" }
            val actor = userId?.let { userRepository.findById(it).orElseThrow() }
            val run = runRepository.save(HemisSyncRun(trigger = trigger, startedBy = actor, scopeGroupId = groupId))
            control.currentRun = run
            if (trigger == HemisSyncTrigger.SCHEDULED) control.lastScheduledAt = Instant.now()
            controlRepository.save(control)
            auditService.logAction("HEMIS_SYNC_STARTED", userId ?: 0, "runId=${run.id}; trigger=$trigger; groupId=$groupId")
            run.toDto()
        } ?: error("HEMIS sync run yaratilmadi")
        if (asyncEnabled) worker.executeAsync(result.id) else worker.execute(result.id)
        return result
    }

    fun resume(runId: Long, userId: Long): HemisSyncRunDto {
        require(client.credentialsConfigured()) { "HEMIS_CREDENTIALS_NOT_CONFIGURED" }
        val result = tx.execute {
            val control = controlRepository.lockControl()
            require(control.currentRun == null || control.currentRun?.status !in ACTIVE_STATUSES) { "HEMIS_SYNC_ALREADY_RUNNING" }
            val run = runRepository.lockById(runId) ?: throw NoSuchElementException("HEMIS run topilmadi: $runId")
            require(run.status == HemisSyncRunStatus.FAILED) { "Faqat FAILED run checkpointdan davom ettiriladi" }
            run.status = HemisSyncRunStatus.QUEUED
            run.finishedAt = null
            run.lastErrorCode = null
            run.lastErrorMessage = null
            control.currentRun = run
            controlRepository.save(control)
            runRepository.save(run)
            auditService.logAction("HEMIS_SYNC_RESUMED", userId, "runId=$runId; checkpoint=${run.checkpointGroupId}:${run.checkpointOffset}")
            run.toDto()
        } ?: error("HEMIS sync run davom ettirilmadi")
        if (asyncEnabled) worker.executeAsync(result.id) else worker.execute(result.id)
        return result
    }

    @Transactional(readOnly = true)
    fun overview(canManage: Boolean): HemisSyncOverviewDto {
        val runs = runRepository.findAllByDeletedFalseOrderByCreatedAtDesc()
        val mappings = mappingRepository.findAllByDeletedFalseOrderByHemisGroupNameAsc()
        return HemisSyncOverviewDto(
            periodicEnabled, asyncEnabled, pageSize, cron,
            runs.firstOrNull { it.status in ACTIVE_STATUSES }?.toDto(),
            runs.firstOrNull()?.toDto(),
            conflictRepository.countByStatusAndDeletedFalse(HemisSyncConflictStatus.OPEN),
            mappings.size, mappings.count { it.active && it.localGroup != null },
            client.credentialsConfigured(), canManage,
        )
    }

    @Transactional(readOnly = true)
    fun runs(): List<HemisSyncRunDto> = runRepository.findAllByDeletedFalseOrderByCreatedAtDesc().map { it.toDto() }

    @Transactional(readOnly = true)
    fun detail(id: Long): HemisSyncRunDetailDto {
        val run = runRepository.findById(id).filter { !it.deleted }.orElseThrow { NoSuchElementException("HEMIS run topilmadi: $id") }
        return HemisSyncRunDetailDto(run.toDto(), itemRepository.findAllByRunIdAndDeletedFalseOrderByIdAsc(id).map { it.toDto() })
    }

    @Transactional(readOnly = true)
    fun mappings(): List<HemisGroupMappingDto> = mappingRepository.findAllByDeletedFalseOrderByHemisGroupNameAsc().map { it.toDto() }

    fun refreshMappings(userId: Long): List<HemisGroupMappingDto> {
        require(client.credentialsConfigured()) { "HEMIS_CREDENTIALS_NOT_CONFIGURED" }
        val remote = client.fetchGroupList()
        tx.executeWithoutResult { upsertRemoteGroups(remote) }
        auditService.logAction("HEMIS_GROUPS_REFRESHED", userId, "groups=${remote.size}")
        return mappings()
    }

    @Transactional(readOnly = true)
    fun localGroups(): List<HemisLocalGroupDto> = groupRepository.findAll().filter { !it.deleted && it.active }.map {
        HemisLocalGroupDto(requireNotNull(it.id), it.name, it.program?.name)
    }.sortedBy { it.name }

    @Transactional
    fun updateMapping(hemisGroupId: Long, request: HemisGroupMappingRequest, userId: Long): HemisGroupMappingDto {
        val mapping = mappingRepository.findByHemisGroupIdAndDeletedFalse(hemisGroupId)
            ?: throw NoSuchElementException("HEMIS guruh mappingi topilmadi: $hemisGroupId")
        val actor = userRepository.findById(userId).orElseThrow()
        mapping.localGroup = request.localGroupId?.let { groupRepository.findById(it).orElseThrow { NoSuchElementException("Lokal guruh topilmadi: $it") } }
        mapping.active = request.active
        mapping.mappedBy = actor
        mapping.mappedAt = Instant.now()
        val saved = mappingRepository.save(mapping)
        auditService.logAction("HEMIS_GROUP_MAPPING_UPDATED", userId, "hemisGroupId=$hemisGroupId; localGroupId=${request.localGroupId}; active=${request.active}")
        return saved.toDto()
    }

    @Transactional(readOnly = true)
    fun conflicts(canManage: Boolean): List<HemisSyncConflictDto> =
        conflictRepository.findAllByDeletedFalseOrderByCreatedAtDesc().map { it.toDto(canManage) }

    @Transactional
    fun resolveConflict(id: Long, request: ResolveHemisConflictRequest, userId: Long): HemisSyncConflictDto {
        require(request.note.trim().length >= 10) { "Yechim izohi kamida 10 belgidan iborat bo'lishi kerak" }
        val conflict = conflictRepository.lockById(id) ?: throw NoSuchElementException("HEMIS konflikti topilmadi: $id")
        require(conflict.status == HemisSyncConflictStatus.OPEN) { "Konflikt allaqachon yopilgan" }
        conflict.status = HemisSyncConflictStatus.RESOLVED
        conflict.resolutionNote = request.note.trim()
        conflict.resolvedBy = userRepository.findById(userId).orElseThrow()
        conflict.resolvedAt = Instant.now()
        auditService.logAction("HEMIS_CONFLICT_RESOLVED", userId, "conflictId=$id; runId=${conflict.run.id}")
        return conflictRepository.save(conflict).toDto(true)
    }

    internal fun upsertRemoteGroups(groups: List<HemisGroupItem>) {
        val now = Instant.now()
        groups.forEach { remote ->
            val mapping = mappingRepository.findByHemisGroupIdAndDeletedFalse(remote.id)
                ?: HemisGroupMapping(remote.id, remote.name)
            mapping.hemisGroupName = remote.name
            mapping.lastSeenAt = now
            mappingRepository.save(mapping)
        }
    }

    private fun HemisSyncRun.toDto() = HemisSyncRunDto(
        requireNotNull(id), trigger.name, status.name, startedBy?.id, startedBy?.fullName ?: startedBy?.username,
        scopeGroupId, checkpointGroupId, checkpointOffset, groupsTotal, groupsProcessed, recordsSeen,
        createdCount, updatedCount, unchangedCount, conflictCount, errorCount, startedAt, finishedAt,
        lastErrorCode, lastErrorMessage, createdAt, status == HemisSyncRunStatus.FAILED,
    )

    private fun HemisSyncItem.toDto() = HemisSyncItemDto(
        requireNotNull(id), hemisStudentId, mask(studentNumber) ?: "***", outcome.name, localStudent?.id,
        changedFields?.split(',')?.filter(String::isNotBlank) ?: emptyList(), errorCode, errorMessage, createdAt,
    )

    private fun HemisGroupMapping.toDto() = HemisGroupMappingDto(
        hemisGroupId, hemisGroupName, localGroup?.id, localGroup?.name, active, lastSeenAt, mappedAt,
    )

    private fun HemisSyncConflict.toDto(canManage: Boolean) = HemisSyncConflictDto(
        requireNotNull(id), requireNotNull(run.id), requireNotNull(item.id), localStudent?.id,
        mask(item.studentNumber) ?: "***", code, fieldName, localValueMasked, sourceValueMasked, status.name,
        resolutionNote, resolvedBy?.fullName ?: resolvedBy?.username, resolvedAt, createdAt,
        canManage && status == HemisSyncConflictStatus.OPEN,
    )

    companion object {
        private val ACTIVE_STATUSES = setOf(HemisSyncRunStatus.QUEUED, HemisSyncRunStatus.RUNNING)
        internal fun mask(value: String?): String? {
            if (value.isNullOrBlank()) return null
            if (value.length <= 4) return "***"
            return "${value.take(2)}***${value.takeLast(2)}"
        }
    }
}

@Service
class HemisSyncWorker(
    private val client: HemisDirectoryClient,
    private val hemisService: HemisService,
    private val runRepository: HemisSyncRunRepository,
    private val controlRepository: HemisSyncControlRepository,
    private val mappingRepository: HemisGroupMappingRepository,
    private val itemRepository: HemisSyncItemRepository,
    private val conflictRepository: HemisSyncConflictRepository,
    private val studentRepository: StudentRepository,
    private val studentService: StudentService,
    private val userRepository: UserRepository,
    private val objectMapper: ObjectMapper,
    transactionManager: PlatformTransactionManager,
    @param:Value("\${app.hemis.sync.page-size:100}") configuredPageSize: Int,
) {
    private val tx = TransactionTemplate(transactionManager)
    private val pageSize = configuredPageSize.coerceIn(1, 500)

    @Async
    fun executeAsync(runId: Long) = execute(runId)

    fun execute(runId: Long) {
        try {
            tx.executeWithoutResult {
                val run = runRepository.lockById(runId) ?: error("HEMIS_RUN_NOT_FOUND")
                require(run.status == HemisSyncRunStatus.QUEUED) { "HEMIS_RUN_NOT_QUEUED" }
                run.status = HemisSyncRunStatus.RUNNING
                if (run.startedAt == null) run.startedAt = Instant.now()
                runRepository.save(run)
            }

            val allGroups = client.fetchGroupList().sortedBy { it.id }
            val scopeId = tx.execute { runRepository.findById(runId).orElseThrow().scopeGroupId }
            val groups = if (scopeId == null) allGroups else allGroups.filter { it.id == scopeId }
            require(scopeId == null || groups.isNotEmpty()) { "HEMIS_GROUP_NOT_FOUND" }
            tx.executeWithoutResult {
                upsertRemoteGroups(allGroups)
                val run = runRepository.lockById(runId) ?: error("HEMIS_RUN_NOT_FOUND")
                run.groupsTotal = groups.size
                runRepository.save(run)
            }

            val checkpoint = tx.execute {
                val run = runRepository.findById(runId).orElseThrow()
                run.checkpointGroupId to run.checkpointOffset
            } ?: (null to 0)
            val startIndex = checkpoint.first?.let { id -> groups.indexOfFirst { it.id == id }.coerceAtLeast(0) } ?: 0

            for (index in startIndex until groups.size) {
                val group = groups[index]
                var offset = if (group.id == checkpoint.first) checkpoint.second else 0
                while (true) {
                    val page = client.fetchStudentsByGroup(group.id, pageSize, offset)
                    if (page.items.isEmpty()) {
                        markGroupDone(runId, groups, index)
                        break
                    }
                    tx.executeWithoutResult {
                        val run = runRepository.lockById(runId) ?: error("HEMIS_RUN_NOT_FOUND")
                        val mapping = mappingRepository.findByHemisGroupIdAndDeletedFalse(group.id)
                        page.items.forEach { source -> processStudent(run, mapping, source) }
                        offset += page.items.size
                        run.checkpointGroupId = group.id
                        run.checkpointOffset = offset
                        runRepository.save(run)
                    }
                    if (offset >= page.total) {
                        markGroupDone(runId, groups, index)
                        break
                    }
                }
            }
            finish(runId)
        } catch (exception: Exception) {
            fail(runId, exception)
        }
    }

    private fun processStudent(run: HemisSyncRun, mapping: HemisGroupMapping?, source: HemisStudent) {
        if (itemRepository.existsByRunIdAndHemisStudentId(requireNotNull(run.id), source.id)) return
        run.recordsSeen++
        val hash = sourceHash(source)
        val byHemis = studentRepository.findByHemisId(source.id)
        val byNumber = studentRepository.findByStudentNumber(source.student_id_number)
        if (byHemis != null && byHemis.studentNumber != source.student_id_number) {
            conflict(run, source, hash, byHemis, "STUDENT_NUMBER_MISMATCH", "studentNumber", byHemis.studentNumber, source.student_id_number)
            return
        }
        if (byNumber?.hemisId != null && byNumber.hemisId != source.id) {
            conflict(run, source, hash, byNumber, "HEMIS_ID_MISMATCH", "hemisId", byNumber.hemisId.toString(), source.id.toString())
            return
        }
        val student = byHemis ?: byNumber
        if (student?.hemisSourceHash == hash) {
            itemRepository.save(HemisSyncItem(run, source.id, source.student_id_number, hash, HemisSyncItemOutcome.UNCHANGED, student))
            student.hemisSyncedAt = Instant.now()
            studentRepository.save(student)
            run.unchangedCount++
            return
        }
        if (mapping == null || !mapping.active || mapping.localGroup == null) {
            conflict(run, source, hash, student, "GROUP_MAPPING_MISSING", "groupId", student?.groupId?.toString(), source.group.id.toString())
            return
        }

        val request = try {
            with(hemisService) { source.toCreateRequest() }
        } catch (exception: IllegalArgumentException) {
            val code = exception.message?.takeIf { it.startsWith("HEMIS_") } ?: "SOURCE_DATA_INVALID"
            conflict(run, source, hash, student, code, null, null, null)
            return
        }
        val localGroup = requireNotNull(mapping.localGroup)
        val program = localGroup.program
        val department = program?.department
        val faculty = department?.faculty

        if (student == null) {
            try {
                val created = studentService.create(request.copy(
                    groupId = localGroup.id, programId = program?.id,
                    departmentId = department?.id, facultyId = faculty?.id,
                ))
                val entity = studentRepository.findById(requireNotNull(created.id)).orElseThrow()
                entity.hemisId = source.id
                entity.hemisSourceHash = hash
                entity.hemisSyncedAt = Instant.now()
                studentRepository.save(entity)
                itemRepository.save(HemisSyncItem(run, source.id, source.student_id_number, hash, HemisSyncItemOutcome.CREATED, entity, "student"))
                run.createdCount++
            } catch (exception: Exception) {
                error(run, source, hash, "CREATE_REJECTED", exception)
            }
            return
        }

        val identityConflict = listOfNotNull(
            mismatch("pinfl", student.pinfl, request.pinfl),
            mismatch("lastName", student.lastName, request.lastName),
            mismatch("firstName", student.firstName, request.firstName),
            mismatch("birthDate", student.birthDate.toString(), request.birthDate.toString()),
            mismatch("gender", student.gender.name, request.gender.name),
        ).firstOrNull()
        if (identityConflict != null) {
            conflict(run, source, hash, student, "IDENTITY_MISMATCH", identityConflict.first, identityConflict.second, identityConflict.third)
            return
        }

        val changed = mutableListOf<String>()
        fun changed(field: String, old: Any?, new: Any?) { if (new != null && old != new) changed += field }
        changed("photoUrl", student.photoUrl, request.photoUrl)
        changed("email", student.email, request.email)
        changed("educationLanguage", student.educationLanguage, request.educationLanguage)
        changed("degreeLevel", student.degreeLevel, request.degreeLevel)
        changed("educationForm", student.educationForm, request.educationForm)
        changed("courseNumber", student.courseNumber, request.courseNumber)
        changed("academicYear", student.academicYear, request.academicYear)
        changed("studentStatus", student.studentStatus, request.studentStatus)
        changed("paymentType", student.paymentType, request.paymentType)
        changed("groupId", student.groupId, localGroup.id)
        changed("programId", student.programId, program?.id)
        changed("departmentId", student.departmentId, department?.id)
        changed("facultyId", student.facultyId, faculty?.id)
        val safeEmail = request.email?.takeIf { email -> userRepository.findByEmail(email)?.id in listOf(null, student.user.id) }
        try {
            if (changed.isNotEmpty()) studentService.update(requireNotNull(student.id), StudentUpdateRequest(
                photoUrl = request.photoUrl, email = safeEmail,
                facultyId = faculty?.id, departmentId = department?.id, programId = program?.id,
                degreeLevel = request.degreeLevel, educationForm = request.educationForm,
                educationLanguage = request.educationLanguage, courseNumber = request.courseNumber,
                groupId = localGroup.id, academicYear = request.academicYear,
                studentStatus = request.studentStatus, paymentType = request.paymentType,
            ))
            val entity = studentRepository.findById(requireNotNull(student.id)).orElseThrow()
            entity.hemisId = source.id
            entity.hemisSourceHash = hash
            entity.hemisSyncedAt = Instant.now()
            studentRepository.save(entity)
            val outcome = if (changed.isEmpty()) HemisSyncItemOutcome.UNCHANGED else HemisSyncItemOutcome.UPDATED
            itemRepository.save(HemisSyncItem(run, source.id, source.student_id_number, hash, outcome, entity, changed.joinToString(",")))
            if (outcome == HemisSyncItemOutcome.UPDATED) run.updatedCount++ else run.unchangedCount++
        } catch (exception: Exception) {
            error(run, source, hash, "UPDATE_REJECTED", exception, student)
        }
    }

    private fun conflict(run: HemisSyncRun, source: HemisStudent, hash: String, student: StudentProfile?, code: String, field: String?, local: String?, remote: String?) {
        val item = itemRepository.save(HemisSyncItem(run, source.id, source.student_id_number, hash, HemisSyncItemOutcome.CONFLICT, student, errorCode = code, errorMessage = "Qo'lda tekshirish talab etiladi"))
        conflictRepository.save(HemisSyncConflict(run, item, student, code, field, HemisSyncService.mask(local), HemisSyncService.mask(remote)))
        run.conflictCount++
    }

    private fun error(run: HemisSyncRun, source: HemisStudent, hash: String, code: String, exception: Exception, student: StudentProfile? = null) {
        itemRepository.save(HemisSyncItem(run, source.id, source.student_id_number, hash, HemisSyncItemOutcome.ERROR, student, errorCode = code, errorMessage = exception.javaClass.simpleName.take(100)))
        run.errorCount++
    }

    private fun mismatch(field: String, local: String?, remote: String?): Triple<String, String?, String?>? =
        if (local?.trim()?.lowercase() != remote?.trim()?.lowercase()) Triple(field, local, remote) else null

    private fun sourceHash(source: HemisStudent): String = MessageDigest.getInstance("SHA-256")
        .digest(objectMapper.writeValueAsBytes(source)).joinToString("") { "%02x".format(it) }

    private fun upsertRemoteGroups(groups: List<HemisGroupItem>) {
        val now = Instant.now()
        groups.forEach { remote ->
            val mapping = mappingRepository.findByHemisGroupIdAndDeletedFalse(remote.id) ?: HemisGroupMapping(remote.id, remote.name)
            mapping.hemisGroupName = remote.name
            mapping.lastSeenAt = now
            mappingRepository.save(mapping)
        }
    }

    private fun markGroupDone(runId: Long, groups: List<HemisGroupItem>, index: Int) = tx.executeWithoutResult {
        val run = runRepository.lockById(runId) ?: error("HEMIS_RUN_NOT_FOUND")
        run.groupsProcessed = (index + 1).coerceAtMost(run.groupsTotal)
        run.checkpointGroupId = groups.getOrNull(index + 1)?.id
        run.checkpointOffset = 0
        runRepository.save(run)
    }

    private fun finish(runId: Long) = tx.executeWithoutResult {
        val run = runRepository.lockById(runId) ?: error("HEMIS_RUN_NOT_FOUND")
        run.status = if (run.conflictCount > 0 || run.errorCount > 0) HemisSyncRunStatus.PARTIAL else HemisSyncRunStatus.COMPLETED
        run.finishedAt = Instant.now()
        run.checkpointGroupId = null
        run.checkpointOffset = 0
        runRepository.save(run)
        val control = controlRepository.lockControl()
        if (control.currentRun?.id == run.id) control.currentRun = null
        controlRepository.save(control)
    }

    private fun fail(runId: Long, exception: Exception) {
        tx.executeWithoutResult {
            val run = runRepository.lockById(runId) ?: return@executeWithoutResult
            run.status = HemisSyncRunStatus.FAILED
            run.finishedAt = Instant.now()
            run.lastErrorCode = exception.message?.takeIf { it.matches(Regex("[A-Z0-9_]{3,100}")) } ?: "HEMIS_SYNC_FAILED"
            run.lastErrorMessage = exception.javaClass.simpleName
            runRepository.save(run)
            val control = controlRepository.lockControl()
            if (control.currentRun?.id == run.id) control.currentRun = null
            controlRepository.save(control)
        }
    }
}

@Service
class HemisSyncScheduler(
    private val service: HemisSyncService,
    @param:Value("\${app.hemis.sync.enabled:false}") private val enabled: Boolean,
) {
    @Scheduled(cron = "\${app.hemis.sync.cron:0 0 */6 * * *}")
    fun scheduledSync() {
        if (enabled) runCatching { service.startScheduled() }
    }
}
