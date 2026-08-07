package uz.scorm.lms.app.v1.compliance.uat

import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.multipart.MultipartFile
import org.springframework.web.util.HtmlUtils
import uz.scorm.lms.app.v1.audit.service.AuditService
import uz.scorm.lms.app.v1.user.model.User
import uz.scorm.lms.app.v1.user.repository.UserRepository
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.StandardOpenOption
import java.security.MessageDigest
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

@Service
class Decision559UatService(
    private val runRepository: Decision559UatRunRepository,
    private val evidenceRepository: Decision559UatEvidenceRepository,
    private val evidenceFileRepository: Decision559UatEvidenceFileRepository,
    private val userRepository: UserRepository,
    private val auditService: AuditService,
    @param:Value("\${uat.private-storage-dir:./private-uploads/uat-559}")
    private val privateStorageDir: String,
) {
    companion object {
        const val SOURCE_SHA256 = "A1E6CF0E05640B962550A7B9B95851404F7B50DF590BBA943846E1CEA5FCC2D3"
        const val MAX_FILE_BYTES = 10L * 1024 * 1024
        const val MAX_FILES_PER_REQUIREMENT = 10
        val REQUIRED_BANDS = (listOf(3) + (8..33)).toSet()
        val FINAL_OUTCOMES = setOf(
            Decision559UatOutcome.AUTOMATED_PASS,
            Decision559UatOutcome.MANUAL_PASS,
            Decision559UatOutcome.NOT_APPLICABLE,
        )

        fun attachmentBundlePath(requirementId: String, fileId: Long, contentType: String): String {
            val extension = when (contentType) {
                "application/pdf" -> ".pdf"
                "image/png" -> ".png"
                "image/jpeg" -> ".jpg"
                else -> throw IllegalArgumentException("Bundle uchun noma'lum dalil turi: $contentType")
            }
            return "evidence/$requirementId/attachment-$fileId$extension"
        }
    }

    @Transactional(readOnly = true)
    fun list(): List<Decision559UatRunDto> =
        runRepository.findAllByDeletedFalseOrderByCreatedAtDesc().map { toRunDto(it, evidence(it.id!!)) }

    @Transactional(readOnly = true)
    fun detail(id: Long): Decision559UatRunDetailDto {
        val run = run(id)
        val evidence = evidence(id)
        val files = evidenceFiles(id).groupBy { requireNotNull(it.evidence.id) }
        return Decision559UatRunDetailDto(
            toRunDto(run, evidence),
            evidence.map { toEvidenceDto(it, files[requireNotNull(it.id)].orEmpty()) },
        )
    }

    @Transactional(readOnly = true)
    fun manifest(id: Long): Decision559UatManifestDto {
        val run = run(id)
        val evidence = evidence(id)
        val files = evidenceFiles(id).groupBy { requireNotNull(it.evidence.id) }
        val currentEvidenceSetSha256 = evidenceSetSha256(run, evidence, files)
        return Decision559UatManifestDto(
            schemaVersion = run.manifestSchemaVersion,
            runId = requireNotNull(run.id),
            title = run.title,
            snapshotAt = run.updatedAt ?: run.createdAt,
            source = Decision559UatManifestSourceDto(sha256 = run.sourceSha256),
            status = run.status,
            evidenceSetSha256 = currentEvidenceSetSha256,
            readyToSubmit = isReady(run, evidence, files),
            protocol = Decision559UatManifestProtocolDto(
                signed = !run.protocolSha256.isNullOrBlank(),
                number = run.protocolNumber,
                signedDate = run.protocolSignedDate,
                signatories = parseSignatories(run.protocolSignatories),
                originalName = run.protocolOriginalName,
                contentType = run.protocolContentType,
                sizeBytes = run.protocolSizeBytes,
                sha256 = run.protocolSha256,
                evidenceSetSha256 = run.protocolEvidenceSetSha256,
                uploadedByName = run.protocolUploadedBy?.fullName ?: run.protocolUploadedBy?.username,
                uploadedAt = run.protocolUploadedAt,
            ),
            requirements = evidence.sortedBy { it.band }.map { item ->
                val itemFiles = files[requireNotNull(item.id)].orEmpty().sortedBy { it.id }
                Decision559UatManifestRequirementDto(
                    id = item.requirementId,
                    band = item.band,
                    outcome = item.outcome,
                    owner = item.ownerName,
                    summary = item.summary,
                    evidenceReference = item.evidenceReference,
                    file = if (run.manifestSchemaVersion != 2 || item.sha256 == null) null else Decision559UatManifestFileDto(
                        id = null,
                        bundlePath = null,
                        originalName = requireNotNull(item.originalName),
                        contentType = requireNotNull(item.contentType),
                        sizeBytes = requireNotNull(item.sizeBytes),
                        sha256 = requireNotNull(item.sha256),
                        uploadedById = null,
                        uploadedByName = null,
                        uploadedAt = null,
                    ),
                    files = if (run.manifestSchemaVersion == 2) emptyList() else itemFiles.map { file ->
                        Decision559UatManifestFileDto(
                            id = requireNotNull(file.id),
                            bundlePath = attachmentBundlePath(item.requirementId, requireNotNull(file.id), file.contentType),
                            originalName = file.originalName,
                            contentType = file.contentType,
                            sizeBytes = file.sizeBytes,
                            sha256 = file.sha256,
                            uploadedById = requireNotNull(file.uploadedBy.id),
                            uploadedByName = file.uploadedBy.fullName ?: file.uploadedBy.username,
                            uploadedAt = file.uploadedAt,
                        )
                    },
                    submittedById = requireNotNull(item.submittedBy.id),
                    submittedByName = item.submittedBy.fullName ?: item.submittedBy.username,
                    submittedAt = item.submittedAt,
                    reviewStatus = item.reviewStatus,
                    reviewNotes = item.reviewNotes,
                    reviewedById = item.reviewedBy?.id,
                    reviewedByName = item.reviewedBy?.fullName ?: item.reviewedBy?.username,
                    reviewedAt = item.reviewedAt,
                )
            },
            submittedByName = run.submittedBy?.fullName ?: run.submittedBy?.username,
            submittedAt = run.submittedAt,
            approvedByName = run.approvedBy?.fullName ?: run.approvedBy?.username,
            approvedAt = run.approvedAt,
        )
    }

    @Transactional
    fun create(request: CreateDecision559UatRunRequest, actorId: Long): Decision559UatRunDto {
        val title = request.title.trim()
        require(title.length in 5..255) { "Qabul run nomi 5-255 belgi bo'lishi kerak" }
        val sourceSha = request.sourceSha256.trim().uppercase()
        require(sourceSha == SOURCE_SHA256) {
            "UAT manbasi tasdiqlangan 559-son qaror PDF SHA-256 qiymatiga mos emas"
        }
        val saved = runRepository.save(Decision559UatRun(title, sourceSha))
        auditService.logAction("DECISION_559_UAT_RUN_CREATED", actorId, "run=${saved.id}; sourceSha=$sourceSha")
        return toRunDto(saved, emptyList())
    }

    @Transactional
    fun saveEvidence(
        runId: Long,
        band: Int,
        requirementId: String,
        outcome: Decision559UatOutcome,
        ownerName: String,
        summary: String,
        evidenceReference: String?,
        file: MultipartFile?,
        actorId: Long,
        files: List<MultipartFile> = emptyList(),
    ): Decision559UatEvidenceDto {
        val run = editableRun(runId)
        require(band in REQUIRED_BANDS) { "Band 3 yoki 8..33 oralig'ida bo'lishi kerak" }
        val expectedRequirement = "UAT-559-${band.toString().padStart(2, '0')}"
        require(requirementId.trim() == expectedRequirement) { "Requirement ID bandga mos emas: $expectedRequirement" }
        val owner = ownerName.trim()
        require(owner.length in 2..255) { "Dalil egasi 2-255 belgi bo'lishi kerak" }
        val normalizedSummary = summary.trim()
        require(normalizedSummary.length in 10..4000) { "Dalil izohi 10-4000 belgi bo'lishi kerak" }
        val reference = evidenceReference?.trim()?.takeIf(String::isNotBlank)
        val actor = user(actorId)
        val existing = evidenceRepository.findByRunIdAndBandAndDeletedFalse(runId, band)
        val wasRejected = run.status == Decision559UatRunStatus.REJECTED
        require(existing?.reviewStatus != Decision559UatReviewStatus.ACCEPTED || wasRejected) {
            "Qabul qilingan band dalilini o'zgartirib bo'lmaydi"
        }
        val incomingFiles = (listOfNotNull(file) + files).filterNot { it.isEmpty }
        val existingFiles = existing?.id?.let(evidenceFileRepository::findAllByEvidenceIdAndDeletedFalseOrderByIdAsc)
            .orEmpty()
        require(existingFiles.size + incomingFiles.size <= MAX_FILES_PER_REQUIREMENT) {
            "Har bir band uchun ko'pi bilan $MAX_FILES_PER_REQUIREMENT ta dalil fayli saqlanadi"
        }
        when (outcome) {
            Decision559UatOutcome.MANUAL_PASS -> require(incomingFiles.isNotEmpty() || existingFiles.isNotEmpty()) {
                "MANUAL_PASS uchun haqiqiy PDF yoki rasm dalili majburiy"
            }
            Decision559UatOutcome.AUTOMATED_PASS -> require(!reference.isNullOrBlank()) {
                "AUTOMATED_PASS uchun test yoki hisobot rekviziti majburiy"
            }
            Decision559UatOutcome.NOT_APPLICABLE -> require(!reference.isNullOrBlank() && normalizedSummary.length >= 20) {
                "NOT_APPLICABLE uchun komissiya asosi va rekviziti majburiy"
            }
            Decision559UatOutcome.PARTIAL, Decision559UatOutcome.BLOCKED_EXTERNAL -> Unit
        }
        val storedFiles = mutableListOf<Stored>()
        try {
            incomingFiles.forEach { storedFiles += store(it, protocolOnly = false) }
        } catch (error: Exception) {
            storedFiles.forEach { Files.deleteIfExists(storageRoot().resolve(it.storageName)) }
            throw error
        }
        val allHashes = existingFiles.map { it.sha256 } + storedFiles.map { it.sha256 }
        if (allHashes.distinct().size != allHashes.size) {
            storedFiles.forEach { Files.deleteIfExists(storageRoot().resolve(it.storageName)) }
            throw IllegalArgumentException("Bir xil SHA-256 dalil fayli takroran yuklanmaydi")
        }

        val entity = existing ?: Decision559UatEvidence(
            run = run,
            requirementId = expectedRequirement,
            band = band,
            outcome = outcome,
            ownerName = owner,
            summary = normalizedSummary,
            submittedBy = actor,
        )
        entity.requirementId = expectedRequirement
        entity.outcome = outcome
        entity.ownerName = owner
        entity.summary = normalizedSummary
        entity.evidenceReference = reference
        entity.submittedBy = actor
        entity.submittedAt = Instant.now()
        entity.reviewStatus = Decision559UatReviewStatus.PENDING
        entity.reviewNotes = null
        entity.reviewedBy = null
        entity.reviewedAt = null
        storedFiles.firstOrNull()?.takeIf { entity.storageName == null }?.let {
            entity.storageName = it.storageName
            entity.originalName = it.originalName
            entity.contentType = it.contentType
            entity.sizeBytes = it.sizeBytes
            entity.sha256 = it.sha256
        }
        val invalidatedProtocolSha = run.protocolSha256?.let { invalidateProtocol(run) }
        if (wasRejected) {
            run.manifestSchemaVersion = 4
            run.status = Decision559UatRunStatus.DRAFT
            run.rejectionReason = null
            run.rejectedAt = null
            run.rejectedBy = null
            runRepository.save(run)
        }
        return try {
            val saved = evidenceRepository.save(entity)
            if (storedFiles.isNotEmpty()) {
                evidenceFileRepository.saveAll(storedFiles.map { stored ->
                    Decision559UatEvidenceFile(
                        evidence = saved,
                        storageName = stored.storageName,
                        originalName = stored.originalName,
                        contentType = stored.contentType,
                        sizeBytes = stored.sizeBytes,
                        sha256 = stored.sha256,
                        uploadedBy = actor,
                    )
                })
            }
            auditService.logAction(
                "DECISION_559_UAT_EVIDENCE_SAVED",
                actorId,
                "run=$runId; band=$band; outcome=$outcome; addedFiles=${storedFiles.size}",
            )
            if (invalidatedProtocolSha != null) {
                auditService.logAction(
                    "DECISION_559_UAT_PROTOCOL_INVALIDATED",
                    actorId,
                    "run=$runId; previousSha256=$invalidatedProtocolSha; reason=evidence_changed",
                )
            }
            toEvidenceDto(
                saved,
                evidenceFileRepository.findAllByEvidenceIdAndDeletedFalseOrderByIdAsc(requireNotNull(saved.id)),
            )
        } catch (error: Exception) {
            storedFiles.forEach { Files.deleteIfExists(storageRoot().resolve(it.storageName)) }
            throw error
        }
    }

    @Transactional
    fun reviewEvidence(
        evidenceId: Long,
        request: ReviewDecision559UatEvidenceRequest,
        actorId: Long,
    ): Decision559UatEvidenceDto {
        require(request.status in setOf(Decision559UatReviewStatus.ACCEPTED, Decision559UatReviewStatus.REJECTED)) {
            "Review yakuni ACCEPTED yoki REJECTED bo'lishi kerak"
        }
        val item = evidenceRepository.findByIdAndDeletedFalse(evidenceId)
            ?: throw IllegalArgumentException("UAT dalili topilmadi")
        require(item.run.status in setOf(Decision559UatRunStatus.DRAFT, Decision559UatRunStatus.REJECTED)) {
            "Review faqat tahrirlanadigan UAT runida bajariladi"
        }
        require(item.submittedBy.id != actorId) { "Dalil muallifi o'z dalilini qabul qila olmaydi" }
        val files = evidenceFileRepository.findAllByEvidenceIdAndDeletedFalseOrderByIdAsc(requireNotNull(item.id))
        if (request.status == Decision559UatReviewStatus.ACCEPTED && item.outcome == Decision559UatOutcome.MANUAL_PASS) {
            require(files.isNotEmpty()) { "MANUAL_PASS dalili kamida bitta private faylga ega bo'lishi kerak" }
        }
        val notes = request.notes.trim()
        require(notes.length in 5..2000) { "Review izohi 5-2000 belgi bo'lishi kerak" }
        item.reviewStatus = request.status
        item.reviewNotes = notes
        item.reviewedBy = user(actorId)
        item.reviewedAt = Instant.now()
        val saved = evidenceRepository.save(item)
        auditService.logAction(
            "DECISION_559_UAT_EVIDENCE_REVIEWED",
            actorId,
            "run=${item.run.id}; band=${item.band}; status=${request.status}",
        )
        return toEvidenceDto(saved, files)
    }

    @Transactional
    fun uploadProtocol(
        runId: Long,
        protocolNumber: String,
        signedDate: LocalDate,
        signatories: String,
        evidenceSetSha256: String,
        file: MultipartFile,
        actorId: Long,
    ): Decision559UatRunDto {
        val run = editableRun(runId)
        val evidence = evidence(runId)
        val files = evidenceFiles(runId).groupBy { requireNotNull(it.evidence.id) }
        require(isEvidenceReady(run, evidence, files)) {
            "Protokol faqat 27 band final natijada mustaqil qabul qilingandan keyin yuklanadi"
        }
        val currentEvidenceSetSha256 = evidenceSetSha256(run, evidence, files)
        val requestedEvidenceSetSha256 = evidenceSetSha256.trim().lowercase()
        require(requestedEvidenceSetSha256.matches(Regex("^[a-f0-9]{64}$"))) {
            "Protokol evidence-set SHA-256 qiymati yaroqsiz"
        }
        require(requestedEvidenceSetSha256 == currentEvidenceSetSha256) {
            "Protokol evidence-set SHA-256 joriy UAT dalillari snapshotiga mos emas"
        }
        val number = protocolNumber.trim()
        require(number.length in 2..100) { "Protokol raqami 2-100 belgi bo'lishi kerak" }
        require(!signedDate.isAfter(LocalDate.now())) { "Kelajak sanasidagi protokol qabul qilinmaydi" }
        val normalizedSignatories = signatories.trim()
        require(normalizedSignatories.length in 5..2000) { "Imzolovchilar 5-2000 belgi bo'lishi kerak" }
        val parsedSignatories = parseSignatories(normalizedSignatories)
        require(parsedSignatories.size >= 3) {
            "Imzolangan qabul protokolida nuqtali vergul yoki yangi qatorda kamida 3 imzolovchi bo'lishi kerak"
        }
        val stored = store(file, protocolOnly = true)
        run.protocolNumber = number
        run.protocolSignedDate = signedDate
        run.protocolSignatories = parsedSignatories.joinToString("; ")
        run.protocolStorageName = stored.storageName
        run.protocolOriginalName = stored.originalName
        run.protocolContentType = stored.contentType
        run.protocolSizeBytes = stored.sizeBytes
        run.protocolSha256 = stored.sha256
        run.protocolEvidenceSetSha256 = currentEvidenceSetSha256
        run.protocolUploadedBy = user(actorId)
        run.protocolUploadedAt = Instant.now()
        return try {
            val saved = runRepository.save(run)
            auditService.logAction(
                "DECISION_559_UAT_PROTOCOL_UPLOADED",
                actorId,
                "run=$runId; protocol=$number; sha256=${stored.sha256}; evidenceSetSha256=$currentEvidenceSetSha256",
            )
            toRunDto(saved, evidence, files)
        } catch (error: Exception) {
            Files.deleteIfExists(storageRoot().resolve(stored.storageName))
            throw error
        }
    }

    @Transactional
    fun submit(runId: Long, actorId: Long): Decision559UatRunDto {
        val run = editableRun(runId)
        val evidence = evidence(runId)
        val files = evidenceFiles(runId).groupBy { requireNotNull(it.evidence.id) }
        require(isReady(run, evidence, files)) {
            "27 bandning barchasi mustaqil qabul qilinishi, final natijada bo'lishi va imzolangan PDF protokol yuklanishi shart"
        }
        run.status = Decision559UatRunStatus.IN_REVIEW
        run.submittedBy = user(actorId)
        run.submittedAt = Instant.now()
        val saved = runRepository.save(run)
        auditService.logAction("DECISION_559_UAT_SUBMITTED", actorId, "run=$runId; bands=${evidence.size}")
        return toRunDto(saved, evidence, files)
    }

    @Transactional
    fun approve(runId: Long, actorId: Long): Decision559UatRunDto {
        val run = run(runId)
        require(run.status == Decision559UatRunStatus.IN_REVIEW) { "Faqat IN_REVIEW run tasdiqlanadi" }
        require(run.submittedBy?.id != actorId && run.protocolUploadedBy?.id != actorId) {
            "Run yuborgan yoki protokol yuklagan foydalanuvchi yakuniy tasdiqlovchi bo'la olmaydi"
        }
        val evidence = evidence(runId)
        val files = evidenceFiles(runId).groupBy { requireNotNull(it.evidence.id) }
        require(isReady(run, evidence, files)) { "Qabul shartlari endi bajarilmayapti" }
        run.status = Decision559UatRunStatus.APPROVED
        run.approvedBy = user(actorId)
        run.approvedAt = Instant.now()
        val saved = runRepository.save(run)
        auditService.logAction("DECISION_559_UAT_APPROVED", actorId, "run=$runId; protocolSha=${run.protocolSha256}")
        return toRunDto(saved, evidence, files)
    }

    @Transactional
    fun reject(runId: Long, request: RejectDecision559UatRunRequest, actorId: Long): Decision559UatRunDto {
        val run = run(runId)
        require(run.status == Decision559UatRunStatus.IN_REVIEW) { "Faqat IN_REVIEW run rad etiladi" }
        val reason = request.reason.trim()
        require(reason.length in 10..2000) { "Rad etish sababi 10-2000 belgi bo'lishi kerak" }
        run.status = Decision559UatRunStatus.REJECTED
        run.rejectedBy = user(actorId)
        run.rejectedAt = Instant.now()
        run.rejectionReason = reason
        val evidence = evidence(runId)
        val saved = runRepository.save(run)
        auditService.logAction("DECISION_559_UAT_REJECTED", actorId, "run=$runId; reason=$reason")
        return toRunDto(saved, evidence)
    }

    @Transactional(readOnly = true)
    fun evidenceFile(evidenceId: Long): PrivateEvidenceFile {
        val item = evidenceRepository.findByIdAndDeletedFalse(evidenceId)
            ?: throw IllegalArgumentException("UAT dalili topilmadi")
        val attachment = evidenceFileRepository.findAllByEvidenceIdAndDeletedFalseOrderByIdAsc(evidenceId).firstOrNull()
        if (attachment != null) return readStored(
            attachment.storageName,
            attachment.contentType,
            attachment.originalName,
            attachment.sha256,
        )
        return readStored(
            requireNotNull(item.storageName) { "Bu dalilda yuklangan fayl yo'q" },
            requireNotNull(item.contentType),
            requireNotNull(item.originalName),
            requireNotNull(item.sha256),
        )
    }

    @Transactional(readOnly = true)
    fun evidenceAttachmentFile(fileId: Long): PrivateEvidenceFile {
        val file = evidenceFileRepository.findByIdAndDeletedFalse(fileId)
            ?: throw IllegalArgumentException("UAT attachment topilmadi")
        return readStored(file.storageName, file.contentType, file.originalName, file.sha256)
    }

    @Transactional
    fun deleteEvidenceAttachment(fileId: Long, actorId: Long): Decision559UatEvidenceDto {
        val file = evidenceFileRepository.findByIdAndDeletedFalse(fileId)
            ?: throw IllegalArgumentException("UAT attachment topilmadi")
        val item = file.evidence
        val run = editableRun(requireNotNull(item.run.id))
        val wasRejected = run.status == Decision559UatRunStatus.REJECTED
        require(item.reviewStatus != Decision559UatReviewStatus.ACCEPTED || wasRejected) {
            "Qabul qilingan band attachmenti o'chirilmaydi"
        }
        val actor = user(actorId)
        file.deleted = true
        evidenceFileRepository.save(file)
        val remaining = evidenceFileRepository.findAllByEvidenceIdAndDeletedFalseOrderByIdAsc(requireNotNull(item.id))
        if (item.storageName == file.storageName) {
            val primary = remaining.firstOrNull()
            item.storageName = primary?.storageName
            item.originalName = primary?.originalName
            item.contentType = primary?.contentType
            item.sizeBytes = primary?.sizeBytes
            item.sha256 = primary?.sha256
        }
        val invalidatedProtocolSha = run.protocolSha256?.let { invalidateProtocol(run) }
        if (wasRejected) {
            run.manifestSchemaVersion = 4
            run.status = Decision559UatRunStatus.DRAFT
            run.rejectionReason = null
            run.rejectedAt = null
            run.rejectedBy = null
            runRepository.save(run)
        }
        item.submittedBy = actor
        item.submittedAt = Instant.now()
        item.reviewStatus = Decision559UatReviewStatus.PENDING
        item.reviewNotes = null
        item.reviewedBy = null
        item.reviewedAt = null
        evidenceRepository.save(item)
        auditService.logAction(
            "DECISION_559_UAT_ATTACHMENT_DELETED",
            actorId,
            "run=${item.run.id}; band=${item.band}; file=$fileId; sha256=${file.sha256}",
        )
        if (invalidatedProtocolSha != null) {
            auditService.logAction(
                "DECISION_559_UAT_PROTOCOL_INVALIDATED",
                actorId,
                "run=${item.run.id}; previousSha256=$invalidatedProtocolSha; reason=evidence_changed",
            )
        }
        return toEvidenceDto(item, remaining)
    }

    @Transactional(readOnly = true)
    fun protocolFile(runId: Long): PrivateEvidenceFile {
        val run = run(runId)
        return readStored(
            requireNotNull(run.protocolStorageName) { "Imzolangan protokol yuklanmagan" },
            requireNotNull(run.protocolContentType),
            requireNotNull(run.protocolOriginalName),
            requireNotNull(run.protocolSha256),
        )
    }

    @Transactional(readOnly = true)
    fun protocolDraft(runId: Long): PrivateEvidenceFile {
        val run = editableRun(runId)
        val evidence = evidence(runId)
        val files = evidenceFiles(runId).groupBy { requireNotNull(it.evidence.id) }
        require(isEvidenceReady(run, evidence, files)) {
            "Protokol loyihasi faqat 27 band final natijada mustaqil qabul qilingandan keyin yaratiladi"
        }
        val evidenceSetSha256 = evidenceSetSha256(run, evidence, files)
        val bytes = protocolDraftHtml(run, evidence, files, evidenceSetSha256).toByteArray(Charsets.UTF_8)
        return PrivateEvidenceFile(
            bytes = bytes,
            contentType = "text/html;charset=UTF-8",
            originalName = "decision-559-uat-run-${requireNotNull(run.id)}-protocol-draft.html",
            sha256 = sha256(bytes),
        )
    }

    private fun editableRun(id: Long): Decision559UatRun = run(id).also {
        require(it.status in setOf(Decision559UatRunStatus.DRAFT, Decision559UatRunStatus.REJECTED)) {
            "IN_REVIEW yoki APPROVED run o'zgartirilmaydi"
        }
    }

    private fun run(id: Long): Decision559UatRun = runRepository.findByIdAndDeletedFalse(id)
        ?: throw IllegalArgumentException("UAT run topilmadi")

    private fun evidence(runId: Long) =
        evidenceRepository.findAllByRunIdAndDeletedFalseOrderByBandAsc(runId)

    private fun evidenceFiles(runId: Long) =
        evidenceFileRepository.findAllByEvidenceRunIdAndDeletedFalseOrderByEvidenceBandAscIdAsc(runId)

    private fun user(id: Long): User = userRepository.findById(id)
        .orElseThrow { IllegalArgumentException("Foydalanuvchi topilmadi") }

    private fun isEvidenceReady(
        run: Decision559UatRun,
        evidence: List<Decision559UatEvidence>,
        files: Map<Long, List<Decision559UatEvidenceFile>> = evidenceFiles(requireNotNull(run.id))
            .groupBy { requireNotNull(it.evidence.id) },
    ): Boolean =
        evidence.map { it.band }.toSet() == REQUIRED_BANDS &&
            evidence.all { it.reviewStatus == Decision559UatReviewStatus.ACCEPTED && it.outcome in FINAL_OUTCOMES } &&
            evidence.all { item ->
                item.outcome != Decision559UatOutcome.MANUAL_PASS ||
                    if (run.manifestSchemaVersion == 2) !item.storageName.isNullOrBlank()
                    else files[requireNotNull(item.id)].orEmpty().isNotEmpty()
            }

    private fun isReady(
        run: Decision559UatRun,
        evidence: List<Decision559UatEvidence>,
        files: Map<Long, List<Decision559UatEvidenceFile>> = evidenceFiles(requireNotNull(run.id))
            .groupBy { requireNotNull(it.evidence.id) },
    ): Boolean =
        isEvidenceReady(run, evidence, files) &&
            !run.protocolStorageName.isNullOrBlank() &&
            !run.protocolSha256.isNullOrBlank() &&
            !run.protocolNumber.isNullOrBlank() &&
            run.protocolSignedDate != null &&
            parseSignatories(run.protocolSignatories).size >= 3 &&
            (run.manifestSchemaVersion < 4 || run.protocolEvidenceSetSha256 == evidenceSetSha256(run, evidence, files))

    private fun protocolDraftHtml(
        run: Decision559UatRun,
        evidence: List<Decision559UatEvidence>,
        files: Map<Long, List<Decision559UatEvidenceFile>>,
        evidenceSetSha256: String,
    ): String = buildString {
        append("<!doctype html>\n<html lang=\"uz\"><head><meta charset=\"utf-8\">\n")
        append("<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">\n")
        append("<title>559-son qaror UAT qabul protokoli</title>\n")
        append("<style>@page{size:A4;margin:14mm}body{font-family:Arial,sans-serif;color:#111;font-size:11px;line-height:1.35}h1{font-size:20px;text-align:center}h2{font-size:15px;margin-top:20px}table{width:100%;border-collapse:collapse;margin:8px 0}th,td{border:1px solid #555;padding:5px;vertical-align:top}th{background:#eee}.mono{font-family:monospace;word-break:break-all}.summary{white-space:pre-wrap}.sign{height:42px}.notice{border:2px solid #111;padding:8px}tr{break-inside:avoid}</style>\n")
        append("</head><body data-run-id=\"").append(requireNotNull(run.id)).append("\" data-evidence-set-sha256=\"")
            .append(evidenceSetSha256).append("\">\n")
        append("<h1>559-son qaror bo'yicha UAT qabul protokoli loyihasi</h1>\n")
        append("<p class=\"notice\"><strong>Imzolash tartibi:</strong> ushbu HTML faylni PDFga chop eting, komissiya rekvizitlarini to'ldiring va imzolang. Dalillar o'zgarsa yangi loyiha olinishi va protokol qayta imzolanishi shart.</p>\n")
        append("<h2>1. Snapshot rekvizitlari</h2><table><tbody>\n")
        draftField("Runtime UAT run ID", requireNotNull(run.id).toString())
        draftField("Run nomi", run.title)
        draftField("Qaror manbasi", "559-son qaror.pdf (10 sahifa)")
        draftField("Qaror PDF SHA-256", run.sourceSha256, mono = true)
        draftField("Manifest schema", run.manifestSchemaVersion.toString())
        draftField("Evidence-set SHA-256", evidenceSetSha256, mono = true)
        draftField("Protokol raqami", "")
        draftField("Tashkilot", "")
        draftField("Sana va joy", "")
        draftField("UAT muhiti/URL", "")
        draftField("Backend build/commit", "")
        draftField("Frontend build/commit", "")
        append("</tbody></table>\n")
        append("<h2>2. 27 band bo'yicha mustaqil qabul natijalari</h2>\n")
        append("<table><thead><tr><th>Band</th><th>ID</th><th>Natija</th><th>Mas'ul</th><th>Xulosa va rekvizit</th><th>Fayl</th><th>Reviewer</th></tr></thead><tbody>\n")
        evidence.sortedBy { it.band }.forEach { item ->
            val itemFiles = files[requireNotNull(item.id)].orEmpty()
            append("<tr data-requirement-id=\"").append(html(item.requirementId)).append("\"><td>")
                .append(item.band).append("</td><td>").append(html(item.requirementId)).append("</td><td>")
                .append(html(item.outcome.name)).append("</td><td>").append(html(item.ownerName)).append("</td><td class=\"summary\">")
                .append(html(item.summary)).append(if (item.evidenceReference.isNullOrBlank()) "" else "<br><strong>Rekvizit:</strong> ${html(item.evidenceReference)}")
                .append("</td><td>").append(itemFiles.size).append(" ta</td><td>")
                .append(html(item.reviewedBy?.fullName ?: item.reviewedBy?.username)).append("<br>")
                .append(html(item.reviewStatus.name)).append("</td></tr>\n")
        }
        append("</tbody></table>\n")
        append("<h2>3. Komissiya va imzolar</h2><table><thead><tr><th>F.I.Sh.</th><th>Lavozim/rol</th><th>Vakolat</th><th>Imzo</th><th>Sana</th></tr></thead><tbody>\n")
        listOf(
            "Komissiya raisi" to "Yakuniy qabul",
            "Ta'lim/metodika vakili" to "Qaror bandlari va o'quv jarayoni",
            "Axborot xavfsizligi vakili" to "Xavfsizlik, biometrika va audit",
            "IT/ekspluatatsiya vakili" to "Infratuzilma, backup va monitoring",
            "Yuridik vakil" to "Tashqi hujjatlar va maxfiylik",
        ).forEach { (role, authority) ->
            append("<tr class=\"sign\"><td></td><td>").append(html(role)).append("</td><td>")
                .append(html(authority)).append("</td><td></td><td></td></tr>\n")
        }
        append("</tbody></table>\n")
        append("<h2>4. Yakuniy qaror</h2><p>☐ QABUL QILINDI &nbsp;&nbsp; ☐ SHARTLI QABUL &nbsp;&nbsp; ☐ QABUL QILINMADI</p><p>Qaror izohi:</p><p>................................................................................................................................................</p>\n")
        append("<p class=\"mono\"><strong>Imzolanayotgan evidence-set SHA-256:</strong> ").append(evidenceSetSha256).append("</p>\n")
        append("</body></html>\n")
    }

    private fun StringBuilder.draftField(label: String, value: String, mono: Boolean = false) {
        append("<tr><th>").append(html(label)).append("</th><td")
        if (mono) append(" class=\"mono\"")
        append(">").append(html(value)).append("</td></tr>\n")
    }

    private fun html(value: String?): String = HtmlUtils.htmlEscape(value.orEmpty())

    private fun parseSignatories(value: String?): List<String> = value.orEmpty()
        .split(Regex("[;\\r\\n]+"))
        .map(String::trim)
        .filter { it.length >= 2 }
        .distinctBy { it.lowercase() }

    private fun invalidateProtocol(run: Decision559UatRun): String? {
        val previousSha = run.protocolSha256
        run.protocolNumber = null
        run.protocolSignedDate = null
        run.protocolSignatories = null
        run.protocolStorageName = null
        run.protocolOriginalName = null
        run.protocolContentType = null
        run.protocolSizeBytes = null
        run.protocolSha256 = null
        run.protocolEvidenceSetSha256 = null
        run.protocolUploadedBy = null
        run.protocolUploadedAt = null
        return previousSha
    }

    private fun evidenceSetSha256(
        run: Decision559UatRun,
        evidence: List<Decision559UatEvidence>,
        files: Map<Long, List<Decision559UatEvidenceFile>>,
    ): String = if (run.manifestSchemaVersion == 2) evidenceSetSha256V2(evidence) else evidenceSetSha256V3(evidence, files)

    private fun evidenceSetSha256V2(evidence: List<Decision559UatEvidence>): String {
        val digest = MessageDigest.getInstance("SHA-256")
        evidence.sortedBy { it.band }.forEach { item ->
            listOf(
                item.requirementId,
                item.band.toString(),
                item.outcome.name,
                item.ownerName,
                item.summary,
                item.evidenceReference.orEmpty(),
                item.originalName.orEmpty(),
                item.contentType.orEmpty(),
                item.sizeBytes?.toString().orEmpty(),
                item.sha256.orEmpty(),
                item.submittedBy.id?.toString().orEmpty(),
                item.submittedAt.toString(),
                item.reviewStatus.name,
                item.reviewNotes.orEmpty(),
                item.reviewedBy?.id?.toString().orEmpty(),
                item.reviewedAt?.toString().orEmpty(),
            ).forEach { value ->
                val bytes = value.toByteArray(Charsets.UTF_8)
                digest.update(bytes.size.toString().toByteArray(Charsets.US_ASCII))
                digest.update(':'.code.toByte())
                digest.update(bytes)
                digest.update(0.toByte())
            }
        }
        return digest.digest().joinToString("") { "%02x".format(it) }
    }

    private fun evidenceSetSha256V3(
        evidence: List<Decision559UatEvidence>,
        files: Map<Long, List<Decision559UatEvidenceFile>>,
    ): String {
        val digest = MessageDigest.getInstance("SHA-256")
        evidence.sortedBy { it.band }.forEach { item ->
            val itemFiles = files[requireNotNull(item.id)].orEmpty().sortedBy { it.id }
            listOf(
                item.requirementId,
                item.band.toString(),
                item.outcome.name,
                item.ownerName,
                item.summary,
                item.evidenceReference.orEmpty(),
                item.submittedBy.id?.toString().orEmpty(),
                item.submittedAt.toString(),
                item.reviewStatus.name,
                item.reviewNotes.orEmpty(),
                item.reviewedBy?.id?.toString().orEmpty(),
                item.reviewedAt?.toString().orEmpty(),
                itemFiles.size.toString(),
            ).forEach { updateHashValue(digest, it) }
            itemFiles.forEach { file ->
                listOf(
                    file.id?.toString().orEmpty(),
                    file.originalName,
                    file.contentType,
                    file.sizeBytes.toString(),
                    file.sha256,
                    file.uploadedBy.id?.toString().orEmpty(),
                    file.uploadedAt.toString(),
                ).forEach { updateHashValue(digest, it) }
            }
        }
        return digest.digest().joinToString("") { "%02x".format(it) }
    }

    private fun updateHashValue(digest: MessageDigest, value: String) {
        val bytes = value.toByteArray(Charsets.UTF_8)
        digest.update(bytes.size.toString().toByteArray(Charsets.US_ASCII))
        digest.update(':'.code.toByte())
        digest.update(bytes)
        digest.update(0.toByte())
    }

    private fun toRunDto(
        run: Decision559UatRun,
        evidence: List<Decision559UatEvidence>,
        files: Map<Long, List<Decision559UatEvidenceFile>> = evidenceFiles(requireNotNull(run.id))
            .groupBy { requireNotNull(it.evidence.id) },
    ) = Decision559UatRunDto(
        id = requireNotNull(run.id),
        title = run.title,
        sourceSha256 = run.sourceSha256,
        manifestSchemaVersion = run.manifestSchemaVersion,
        status = run.status,
        evidenceCount = evidence.size,
        acceptedCount = evidence.count { it.reviewStatus == Decision559UatReviewStatus.ACCEPTED },
        blockingCount = evidence.count { it.outcome !in FINAL_OUTCOMES || it.reviewStatus != Decision559UatReviewStatus.ACCEPTED },
        protocolNumber = run.protocolNumber,
        protocolSignedDate = run.protocolSignedDate,
        protocolSignatories = run.protocolSignatories,
        protocolOriginalName = run.protocolOriginalName,
        protocolSha256 = run.protocolSha256,
        protocolEvidenceSetSha256 = run.protocolEvidenceSetSha256,
        protocolUploadedAt = run.protocolUploadedAt,
        evidenceSetSha256 = evidenceSetSha256(run, evidence, files),
        readyToSubmit = isReady(run, evidence, files),
        submittedByName = run.submittedBy?.fullName ?: run.submittedBy?.username,
        submittedAt = run.submittedAt,
        approvedByName = run.approvedBy?.fullName ?: run.approvedBy?.username,
        approvedAt = run.approvedAt,
        rejectionReason = run.rejectionReason,
        createdAt = run.createdAt,
        updatedAt = run.updatedAt,
    )

    private fun toEvidenceDto(
        item: Decision559UatEvidence,
        files: List<Decision559UatEvidenceFile>,
    ): Decision559UatEvidenceDto {
        val primary = files.sortedBy { it.id }.firstOrNull()
        return Decision559UatEvidenceDto(
        id = requireNotNull(item.id),
        runId = requireNotNull(item.run.id),
        requirementId = item.requirementId,
        band = item.band,
        outcome = item.outcome,
        ownerName = item.ownerName,
        summary = item.summary,
        evidenceReference = item.evidenceReference,
        originalName = primary?.originalName ?: item.originalName,
        contentType = primary?.contentType ?: item.contentType,
        sizeBytes = primary?.sizeBytes ?: item.sizeBytes,
        sha256 = primary?.sha256 ?: item.sha256,
        files = files.sortedBy { it.id }.map { file ->
            Decision559UatEvidenceFileDto(
                id = requireNotNull(file.id),
                originalName = file.originalName,
                contentType = file.contentType,
                sizeBytes = file.sizeBytes,
                sha256 = file.sha256,
                uploadedByName = file.uploadedBy.fullName ?: file.uploadedBy.username,
                uploadedAt = file.uploadedAt,
            )
        },
        submittedByName = item.submittedBy.fullName ?: item.submittedBy.username,
        submittedAt = item.submittedAt,
        reviewStatus = item.reviewStatus,
        reviewNotes = item.reviewNotes,
        reviewedByName = item.reviewedBy?.fullName ?: item.reviewedBy?.username,
        reviewedAt = item.reviewedAt,
        )
    }

    private data class Stored(
        val storageName: String,
        val originalName: String,
        val contentType: String,
        val sizeBytes: Long,
        val sha256: String,
    )

    private fun store(file: MultipartFile, protocolOnly: Boolean): Stored {
        require(!file.isEmpty && file.size in 1..MAX_FILE_BYTES) { "Fayl 1 baytdan 10 MBgacha bo'lishi kerak" }
        val bytes = file.bytes
        val detectedType = detectType(bytes)
            ?: throw IllegalArgumentException("Faqat haqiqiy PDF, PNG yoki JPEG dalili qabul qilinadi")
        if (protocolOnly) require(detectedType == "application/pdf") { "Imzolangan protokol faqat PDF bo'lishi kerak" }
        val originalName = file.originalFilename.orEmpty()
            .substringAfterLast('/').substringAfterLast('\\')
            .replace(Regex("[\\r\\n]"), "_").take(255)
            .ifBlank { if (detectedType == "application/pdf") "evidence.pdf" else "evidence-image" }
        val extension = when (detectedType) {
            "application/pdf" -> ".pdf"
            "image/png" -> ".png"
            else -> ".jpg"
        }
        val storageName = "${UUID.randomUUID()}$extension"
        val root = storageRoot()
        Files.createDirectories(root)
        val target = root.resolve(storageName).normalize()
        require(target.parent == root) { "Xavfsiz bo'lmagan fayl yo'li" }
        Files.write(target, bytes, StandardOpenOption.CREATE_NEW)
        return Stored(storageName, originalName, detectedType, bytes.size.toLong(), sha256(bytes))
    }

    private fun readStored(storageName: String, contentType: String, originalName: String, expectedSha: String): PrivateEvidenceFile {
        val root = storageRoot()
        val target = root.resolve(storageName).normalize()
        require(target.parent == root && Files.isRegularFile(target)) { "Dalil fayli topilmadi" }
        val bytes = Files.readAllBytes(target)
        val actualSha = sha256(bytes)
        require(actualSha == expectedSha) { "Dalil fayli SHA-256 yaxlitlik tekshiruvidan o'tmadi" }
        return PrivateEvidenceFile(bytes, contentType, originalName, actualSha)
    }

    private fun storageRoot(): Path = Path.of(privateStorageDir).toAbsolutePath().normalize()

    private fun detectType(bytes: ByteArray): String? = when {
        bytes.size >= 5 && bytes.copyOfRange(0, 5).contentEquals("%PDF-".toByteArray()) -> "application/pdf"
        bytes.size >= 8 && bytes.copyOfRange(0, 8).contentEquals(byteArrayOf(
            0x89.toByte(), 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
        )) -> "image/png"
        bytes.size >= 3 && bytes[0] == 0xFF.toByte() && bytes[1] == 0xD8.toByte() && bytes[2] == 0xFF.toByte() -> "image/jpeg"
        else -> null
    }

    private fun sha256(bytes: ByteArray): String =
        MessageDigest.getInstance("SHA-256").digest(bytes).joinToString("") { "%02x".format(it) }
}
