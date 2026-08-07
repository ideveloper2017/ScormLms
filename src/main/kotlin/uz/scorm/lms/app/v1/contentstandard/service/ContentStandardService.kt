package uz.scorm.lms.app.v1.contentstandard.service

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.audit.service.AuditService
import uz.scorm.lms.app.v1.contentstandard.dto.ContentRevisionAssessmentCandidateDto
import uz.scorm.lms.app.v1.contentstandard.dto.ContentStandardAssessmentDto
import uz.scorm.lms.app.v1.contentstandard.dto.ContentStandardAssessmentResponseDto
import uz.scorm.lms.app.v1.contentstandard.dto.ContentStandardChecklistDto
import uz.scorm.lms.app.v1.contentstandard.dto.ContentStandardCoverage
import uz.scorm.lms.app.v1.contentstandard.dto.ContentStandardCriterionDto
import uz.scorm.lms.app.v1.contentstandard.dto.ReviewContentStandardAssessmentRequest
import uz.scorm.lms.app.v1.contentstandard.dto.ReviewContentStandardRequest
import uz.scorm.lms.app.v1.contentstandard.dto.SaveContentStandardAssessmentRequest
import uz.scorm.lms.app.v1.contentstandard.dto.SaveContentStandardChecklistRequest
import uz.scorm.lms.app.v1.contentstandard.model.ContentStandardAssessment
import uz.scorm.lms.app.v1.contentstandard.model.ContentStandardAssessmentDecision
import uz.scorm.lms.app.v1.contentstandard.model.ContentStandardAssessmentResponse
import uz.scorm.lms.app.v1.contentstandard.model.ContentStandardAssessmentStatus
import uz.scorm.lms.app.v1.contentstandard.model.ContentStandardChecklist
import uz.scorm.lms.app.v1.contentstandard.model.ContentStandardChecklistStatus
import uz.scorm.lms.app.v1.contentstandard.model.ContentStandardCriterion
import uz.scorm.lms.app.v1.contentstandard.repository.ContentStandardAssessmentRepository
import uz.scorm.lms.app.v1.contentstandard.repository.ContentStandardChecklistRepository
import uz.scorm.lms.app.v1.courses.model.LearningItemStatus
import uz.scorm.lms.app.v1.courses.model.isEffective
import uz.scorm.lms.app.v1.courses.repository.CourseContentRepository
import uz.scorm.lms.app.v1.courses.repository.CourseContentRevisionRepository
import uz.scorm.lms.app.v1.user.repository.UserRepository
import java.time.Instant
import java.time.LocalDate

@Service
class ContentStandardService(
    private val checklistRepository: ContentStandardChecklistRepository,
    private val assessmentRepository: ContentStandardAssessmentRepository,
    private val revisionRepository: CourseContentRevisionRepository,
    private val contentRepository: CourseContentRepository,
    private val userRepository: UserRepository,
    private val auditService: AuditService,
) {
    @Transactional(readOnly = true)
    fun listChecklists() = checklistRepository.findAllByDeletedFalseOrderByCreatedAtDesc().map(::checklistDto)

    @Transactional(readOnly = true)
    fun getChecklist(id: Long) = checklistDto(requireChecklist(id))

    @Transactional
    fun createChecklist(request: SaveContentStandardChecklistRequest, actorId: Long): ContentStandardChecklistDto {
        validateChecklist(request)
        val version = request.versionCode.trim()
        require(!checklistRepository.existsByStandardCodeAndVersionCodeAndDeletedFalse(STANDARD_CODE, version)) { "Ushbu standart checklist versiyasi mavjud" }
        val checklist = ContentStandardChecklist(
            standardCode = STANDARD_CODE, versionCode = version, title = request.title.trim(),
            issuingAuthority = request.issuingAuthority.trim(), sourceDocumentNumber = request.sourceDocumentNumber.trim(),
            sourceDocumentDate = request.sourceDocumentDate, sourceReference = request.sourceReference.trim(),
            validFrom = request.validFrom, validUntil = request.validUntil, createdByUser = requireUser(actorId),
        )
        replaceCriteria(checklist, request)
        val saved = checklistRepository.save(checklist)
        auditService.logAction("CONTENT_STANDARD_CHECKLIST_CREATED", actorId, "checklist=${saved.id}; standard=$STANDARD_CODE; version=$version; criteria=${saved.criteria.size}")
        return checklistDto(saved)
    }

    @Transactional
    fun updateChecklist(id: Long, request: SaveContentStandardChecklistRequest, actorId: Long): ContentStandardChecklistDto {
        val checklist = requireChecklist(id)
        require(checklist.status == ContentStandardChecklistStatus.DRAFT) { "Faqat DRAFT checklist tahrirlanadi" }
        validateChecklist(request)
        val version = request.versionCode.trim()
        require(!checklistRepository.existsByStandardCodeAndVersionCodeAndDeletedFalseAndIdNot(STANDARD_CODE, version, id)) { "Ushbu standart checklist versiyasi mavjud" }
        checklist.versionCode = version
        checklist.title = request.title.trim()
        checklist.issuingAuthority = request.issuingAuthority.trim()
        checklist.sourceDocumentNumber = request.sourceDocumentNumber.trim()
        checklist.sourceDocumentDate = request.sourceDocumentDate
        checklist.sourceReference = request.sourceReference.trim()
        checklist.validFrom = request.validFrom
        checklist.validUntil = request.validUntil
        replaceCriteria(checklist, request)
        checklistRepository.save(checklist)
        auditService.logAction("CONTENT_STANDARD_CHECKLIST_UPDATED", actorId, "checklist=$id; version=$version; criteria=${checklist.criteria.size}")
        return checklistDto(checklist)
    }

    @Transactional
    fun publishChecklist(id: Long, request: ReviewContentStandardRequest, actorId: Long): ContentStandardChecklistDto {
        val checklist = requireChecklist(id)
        require(checklist.status == ContentStandardChecklistStatus.DRAFT) { "Faqat DRAFT checklist chop etiladi" }
        require(checklist.createdByUser.id != actorId) { "Checklist muallifi uni o'zi tasdiqlay olmaydi" }
        require(checklist.criteria.any { it.required }) { "Rasmiy checklistda kamida bitta majburiy mezon bo'lishi kerak" }
        require(!checklist.sourceDocumentDate.isAfter(LocalDate.now())) { "Standart manba hujjati sanasi kelajakda bo'lmasligi kerak" }
        require(checklistRepository.findFirstByStatusAndDeletedFalse(ContentStandardChecklistStatus.PUBLISHED) == null) {
            "Amaldagi checklist avval arxivlanishi kerak"
        }
        checklist.status = ContentStandardChecklistStatus.PUBLISHED
        checklist.publishedSlot = 1
        checklist.reviewedAt = Instant.now()
        checklist.reviewedByUser = requireUser(actorId)
        checklist.reviewNote = reviewNote(request.note)
        checklistRepository.save(checklist)
        auditService.logAction("CONTENT_STANDARD_CHECKLIST_PUBLISHED", actorId, "checklist=$id; standard=$STANDARD_CODE; version=${checklist.versionCode}; criteria=${checklist.criteria.size}")
        return checklistDto(checklist)
    }

    @Transactional
    fun rejectChecklist(id: Long, request: ReviewContentStandardRequest, actorId: Long): ContentStandardChecklistDto {
        val checklist = requireChecklist(id)
        require(checklist.status == ContentStandardChecklistStatus.DRAFT) { "Faqat DRAFT checklist rad etiladi" }
        require(checklist.createdByUser.id != actorId) { "Checklist muallifi uni o'zi ko'rib chiqa olmaydi" }
        checklist.status = ContentStandardChecklistStatus.REJECTED
        checklist.reviewedAt = Instant.now()
        checklist.reviewedByUser = requireUser(actorId)
        checklist.reviewNote = reviewNote(request.note)
        checklistRepository.save(checklist)
        auditService.logAction("CONTENT_STANDARD_CHECKLIST_REJECTED", actorId, "checklist=$id; version=${checklist.versionCode}")
        return checklistDto(checklist)
    }

    @Transactional
    fun archiveChecklist(id: Long, actorId: Long): ContentStandardChecklistDto {
        val checklist = requireChecklist(id)
        require(checklist.status == ContentStandardChecklistStatus.PUBLISHED) { "Faqat PUBLISHED checklist arxivlanadi" }
        checklist.status = ContentStandardChecklistStatus.ARCHIVED
        checklist.publishedSlot = null
        checklist.archivedAt = Instant.now()
        checklist.archivedByUser = requireUser(actorId)
        checklistRepository.save(checklist)
        auditService.logAction("CONTENT_STANDARD_CHECKLIST_ARCHIVED", actorId, "checklist=$id; version=${checklist.versionCode}")
        return checklistDto(checklist)
    }

    @Transactional(readOnly = true)
    fun revisionCandidates(): List<ContentRevisionAssessmentCandidateDto> {
        val checklist = activeChecklist()
        return revisionRepository.findAllByDeletedFalseOrderByChangedAtDesc().map { revision ->
            ContentRevisionAssessmentCandidateDto(
                contentRevisionId = requireNotNull(revision.id), contentId = requireNotNull(revision.content.id),
                revisionNumber = revision.revisionNumber, contentVersion = revision.contentVersion,
                contentTitle = revision.title, moduleTitle = revision.content.module.title,
                courseTitle = revision.content.module.course.title ?: "Nomsiz kurs", checklistId = checklist?.id,
                assessmentExists = checklist?.id?.let { assessmentRepository.existsByContentRevisionIdAndChecklistIdAndDeletedFalse(requireNotNull(revision.id), it) } ?: false,
            )
        }
    }

    @Transactional(readOnly = true)
    fun listAssessments() = assessmentRepository.findAllByDeletedFalseOrderByCreatedAtDesc().map(::assessmentDto)

    @Transactional
    fun createAssessment(request: SaveContentStandardAssessmentRequest, actorId: Long): ContentStandardAssessmentDto {
        val checklist = activeChecklist() ?: throw IllegalArgumentException("Amaldagi O'zDSt 36.2030 checklist mavjud emas")
        require(checklist.id == request.checklistId) { "Assessment faqat amaldagi checklistga bog'lanadi" }
        val revision = revisionRepository.findByIdAndDeletedFalse(request.contentRevisionId)
            ?: throw NoSuchElementException("Kontent revisioni topilmadi: ${request.contentRevisionId}")
        require(!assessmentRepository.existsByContentRevisionIdAndChecklistIdAndDeletedFalse(request.contentRevisionId, request.checklistId)) {
            "Ushbu revision va checklist uchun assessment mavjud"
        }
        val criteriaById = checklist.criteria.associateBy { requireNotNull(it.id) }
        require(request.responses.map { it.criterionId }.toSet() == criteriaById.keys && request.responses.size == criteriaById.size) {
            "Checklistning har bir mezoniga aynan bitta javob berilishi kerak"
        }
        val assessment = ContentStandardAssessment(contentRevision = revision, checklist = checklist, createdByUser = requireUser(actorId))
        request.responses.forEach { response ->
            val evidence = response.evidenceReference?.trim()?.takeIf(String::isNotBlank)
            val note = response.note?.trim()?.takeIf(String::isNotBlank)
            require(!response.met || (evidence?.length ?: 0) in 5..1000) { "Bajarilgan mezon uchun 5..1000 belgili dalil majburiy" }
            require(response.met || (note?.length ?: 0) in 10..2000) { "Bajarilmagan mezon uchun kamida 10 belgili izoh majburiy" }
            assessment.responses += ContentStandardAssessmentResponse(
                assessment = assessment, criterion = requireNotNull(criteriaById[response.criterionId]),
                met = response.met, evidenceReference = evidence, note = note,
            )
        }
        val saved = assessmentRepository.save(assessment)
        auditService.logAction("CONTENT_STANDARD_ASSESSMENT_CREATED", actorId, "assessment=${saved.id}; revision=${revision.id}; checklist=${checklist.id}; responses=${saved.responses.size}")
        return assessmentDto(saved)
    }

    @Transactional
    fun reviewAssessment(id: Long, request: ReviewContentStandardAssessmentRequest, actorId: Long): ContentStandardAssessmentDto {
        val assessment = requireAssessment(id)
        require(assessment.status == ContentStandardAssessmentStatus.DRAFT) { "Assessment bo'yicha yakuniy qaror chiqarilgan" }
        require(assessment.createdByUser.id != actorId) { "Assessment muallifi uni o'zi tasdiqlay olmaydi" }
        if (request.decision == ContentStandardAssessmentDecision.PASSED) {
            val unmetRequired = assessment.responses.filter { it.criterion.required && !it.met }
            require(unmetRequired.isEmpty()) { "Majburiy mezonlar bajarilmagan: ${unmetRequired.joinToString { it.criterion.criterionCode }}" }
        }
        assessment.status = when (request.decision) {
            ContentStandardAssessmentDecision.PASSED -> ContentStandardAssessmentStatus.PASSED
            ContentStandardAssessmentDecision.FAILED -> ContentStandardAssessmentStatus.FAILED
        }
        assessment.reviewedAt = Instant.now()
        assessment.reviewedByUser = requireUser(actorId)
        assessment.reviewNote = reviewNote(request.note)
        assessmentRepository.save(assessment)
        auditService.logAction("CONTENT_STANDARD_ASSESSMENT_REVIEWED", actorId, "assessment=$id; decision=${request.decision}; revision=${assessment.contentRevision.id}; checklist=${assessment.checklist.id}")
        return assessmentDto(assessment)
    }

    @Transactional(readOnly = true)
    fun requirePassingAssessmentIfConfigured(contentRevisionId: Long) {
        val checklist = activeChecklist() ?: return
        require(assessmentRepository.existsByContentRevisionIdAndChecklistIdAndStatusAndDeletedFalse(
            contentRevisionId, requireNotNull(checklist.id), ContentStandardAssessmentStatus.PASSED,
        )) { "Joriy kontent revisioni amaldagi O'zDSt 36.2030 checklist assessmentidan o'tmagan" }
    }

    @Transactional(readOnly = true)
    fun coverage(onDate: LocalDate = LocalDate.now()): ContentStandardCoverage {
        val checklist = activeChecklist(onDate) ?: return ContentStandardCoverage(false, 0, 0)
        val published = contentRepository.findAllByStatusAndDeletedFalse(LearningItemStatus.PUBLISHED.name)
            .filter { it.isEffective(onDate) && it.approvedRevisionNumber != null }
        val passed = published.count { content ->
            val revision = revisionRepository.findByContentIdAndRevisionNumberAndDeletedFalse(requireNotNull(content.id), requireNotNull(content.approvedRevisionNumber))
            revision?.id?.let { assessmentRepository.existsByContentRevisionIdAndChecklistIdAndStatusAndDeletedFalse(
                it, requireNotNull(checklist.id), ContentStandardAssessmentStatus.PASSED,
            ) } == true
        }
        return ContentStandardCoverage(true, published.size.toLong(), passed.toLong())
    }

    @Transactional(readOnly = true)
    fun activeChecklistDto(): ContentStandardChecklistDto? = activeChecklist()?.let(::checklistDto)

    private fun activeChecklist(onDate: LocalDate = LocalDate.now()): ContentStandardChecklist? = checklistRepository
        .findFirstByStatusAndDeletedFalse(ContentStandardChecklistStatus.PUBLISHED)
        ?.takeIf { !it.validFrom.isAfter(onDate) && (it.validUntil == null || !it.validUntil!!.isBefore(onDate)) }

    private fun validateChecklist(request: SaveContentStandardChecklistRequest) {
        require(request.standardCode.trim().uppercase().replace("‘", "'").replace("’", "'") == STANDARD_CODE) { "Faqat O'zDSt 36.2030 rasmiy checklisti qabul qilinadi" }
        text(request.versionCode, "Versiya", 1, 100)
        text(request.title, "Checklist nomi", 5, 500)
        text(request.issuingAuthority, "Vakolatli organ", 3, 500)
        text(request.sourceDocumentNumber, "Manba hujjat raqami", 1, 200)
        text(request.sourceReference, "Manba dalili", 5, 1000)
        require(request.validUntil == null || !request.validUntil.isBefore(request.validFrom)) { "Checklist amal tugash sanasi boshlanishidan oldin bo'lmasligi kerak" }
        require(request.criteria.isNotEmpty() && request.criteria.size <= 500) { "Rasmiy checklist mezonlari 1..500 oralig'ida bo'lishi kerak" }
        require(request.criteria.map { it.criterionCode.trim().uppercase() }.toSet().size == request.criteria.size) { "Mezon kodlari takrorlanmasligi kerak" }
        require(request.criteria.map { it.position }.toSet().size == request.criteria.size) { "Mezon tartib raqamlari takrorlanmasligi kerak" }
        request.criteria.forEach {
            text(it.criterionCode, "Mezon kodi", 1, 100); text(it.title, "Mezon nomi", 5, 500)
            text(it.description, "Mezon tavsifi", 10, 4000); require(it.position in 1..500) { "Mezon pozitsiyasi 1..500 bo'lishi kerak" }
            require((it.evidenceHint?.trim()?.length ?: 0) <= 1000) { "Dalil ko'rsatmasi 1000 belgidan oshmasligi kerak" }
        }
    }

    private fun replaceCriteria(checklist: ContentStandardChecklist, request: SaveContentStandardChecklistRequest) {
        checklist.criteria.clear()
        request.criteria.sortedBy { it.position }.forEach {
            checklist.criteria += ContentStandardCriterion(
                checklist = checklist, criterionCode = it.criterionCode.trim().uppercase(), title = it.title.trim(),
                description = it.description.trim(), required = it.required,
                evidenceHint = it.evidenceHint?.trim()?.takeIf(String::isNotBlank), position = it.position,
            )
        }
    }

    private fun reviewNote(raw: String) = raw.trim().also { require(it.length in 10..2000) { "Tekshiruv izohi 10..2000 belgidan iborat bo'lishi kerak" } }
    private fun text(value: String, label: String, min: Int, max: Int) { require(value.trim().length in min..max) { "$label $min..$max belgidan iborat bo'lishi kerak" } }
    private fun requireChecklist(id: Long) = checklistRepository.findByIdAndDeletedFalse(id) ?: throw NoSuchElementException("Checklist topilmadi: $id")
    private fun requireAssessment(id: Long) = assessmentRepository.findByIdAndDeletedFalse(id) ?: throw NoSuchElementException("Assessment topilmadi: $id")
    private fun requireUser(id: Long) = userRepository.findById(id).orElseThrow { NoSuchElementException("Foydalanuvchi topilmadi: $id") }
    private fun effective(checklist: ContentStandardChecklist, onDate: LocalDate = LocalDate.now()) = checklist.status == ContentStandardChecklistStatus.PUBLISHED && !checklist.validFrom.isAfter(onDate) && (checklist.validUntil == null || !checklist.validUntil!!.isBefore(onDate))

    private fun checklistDto(checklist: ContentStandardChecklist) = ContentStandardChecklistDto(
        id = requireNotNull(checklist.id), standardCode = checklist.standardCode, versionCode = checklist.versionCode,
        title = checklist.title, issuingAuthority = checklist.issuingAuthority,
        sourceDocumentNumber = checklist.sourceDocumentNumber, sourceDocumentDate = checklist.sourceDocumentDate,
        sourceReference = checklist.sourceReference, validFrom = checklist.validFrom, validUntil = checklist.validUntil,
        status = checklist.status, currentlyEffective = effective(checklist), criteria = checklist.criteria.map { criterion ->
            ContentStandardCriterionDto(requireNotNull(criterion.id), criterion.criterionCode, criterion.title, criterion.description, criterion.required, criterion.evidenceHint, criterion.position)
        }, createdByName = checklist.createdByUser.fullName ?: checklist.createdByUser.username,
        reviewedAt = checklist.reviewedAt, reviewedByName = checklist.reviewedByUser?.fullName ?: checklist.reviewedByUser?.username,
        reviewNote = checklist.reviewNote, archivedAt = checklist.archivedAt,
    )

    private fun assessmentDto(assessment: ContentStandardAssessment): ContentStandardAssessmentDto {
        val revision = assessment.contentRevision
        return ContentStandardAssessmentDto(
            id = requireNotNull(assessment.id), checklistId = requireNotNull(assessment.checklist.id), checklistVersion = assessment.checklist.versionCode,
            contentRevisionId = requireNotNull(revision.id), contentId = requireNotNull(revision.content.id), revisionNumber = revision.revisionNumber,
            contentVersion = revision.contentVersion, contentTitle = revision.title, courseTitle = revision.content.module.course.title ?: "Nomsiz kurs",
            status = assessment.status, responses = assessment.responses.sortedBy { it.criterion.position }.map { response ->
                ContentStandardAssessmentResponseDto(requireNotNull(response.criterion.id), response.criterion.criterionCode, response.criterion.title, response.criterion.required, response.met, response.evidenceReference, response.note)
            }, createdByName = assessment.createdByUser.fullName ?: assessment.createdByUser.username,
            reviewedAt = assessment.reviewedAt, reviewedByName = assessment.reviewedByUser?.fullName ?: assessment.reviewedByUser?.username,
            reviewNote = assessment.reviewNote,
        )
    }

    companion object { const val STANDARD_CODE = "O'ZDST 36.2030" }
}

