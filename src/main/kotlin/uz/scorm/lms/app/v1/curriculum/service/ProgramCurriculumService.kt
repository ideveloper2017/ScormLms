package uz.scorm.lms.app.v1.curriculum.service

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.audit.service.AuditService
import uz.scorm.lms.app.v1.curriculum.dto.AddCurriculumSubjectRequest
import uz.scorm.lms.app.v1.curriculum.dto.ApproveCurriculumRequest
import uz.scorm.lms.app.v1.curriculum.dto.CurriculumSubjectDto
import uz.scorm.lms.app.v1.curriculum.dto.CurriculumVersionDto
import uz.scorm.lms.app.v1.curriculum.dto.SaveCurriculumVersionRequest
import uz.scorm.lms.app.v1.curriculum.model.CurriculumCredentialType
import uz.scorm.lms.app.v1.curriculum.model.CurriculumNormativeBasisType
import uz.scorm.lms.app.v1.curriculum.model.CurriculumStatus
import uz.scorm.lms.app.v1.curriculum.model.ProgramCurriculumSubject
import uz.scorm.lms.app.v1.curriculum.model.ProgramCurriculumVersion
import uz.scorm.lms.app.v1.curriculum.repository.ProgramCurriculumSubjectRepository
import uz.scorm.lms.app.v1.curriculum.repository.ProgramCurriculumVersionRepository
import uz.scorm.lms.app.v1.program.repository.ProgramRepository
import uz.scorm.lms.app.v1.subject.repository.SubjectRepository
import uz.scorm.lms.app.v1.user.repository.UserRepository
import java.time.Instant
import java.time.LocalDate

@Service
class ProgramCurriculumService(
    private val versionRepository: ProgramCurriculumVersionRepository,
    private val subjectItemRepository: ProgramCurriculumSubjectRepository,
    private val programRepository: ProgramRepository,
    private val subjectRepository: SubjectRepository,
    private val userRepository: UserRepository,
    private val auditService: AuditService,
) {
    @Transactional(readOnly = true)
    fun list(): List<CurriculumVersionDto> =
        versionRepository.findAllByDeletedFalseOrderByAcademicYearDescVersionCodeAsc().map(::toDto)

    @Transactional(readOnly = true)
    fun get(id: Long): CurriculumVersionDto = toDto(requireVersion(id))

    @Transactional
    fun create(request: SaveCurriculumVersionRequest, actorId: Long): CurriculumVersionDto {
        val program = requireProgram(request.programId)
        validate(request)
        require(!versionRepository.existsByProgramIdAndVersionCodeAndDeletedFalse(request.programId, request.versionCode.trim())) {
            "Ushbu dasturda curriculum versiya kodi allaqachon mavjud"
        }
        val saved = versionRepository.save(ProgramCurriculumVersion(
            program = program,
            versionCode = request.versionCode.trim(),
            academicYear = request.academicYear,
            credentialType = request.credentialType,
            normativeBasisType = request.normativeBasisType,
            standardReference = request.standardReference.trim(),
            qualificationRequirementsReference = request.qualificationRequirementsReference.trim(),
            validFrom = request.validFrom,
            validUntil = request.validUntil,
            createdByUser = requireUser(actorId),
        ))
        auditService.logAction(
            "CURRICULUM_VERSION_CREATED",
            actorId,
            "curriculum=${saved.id}; program=${program.id}; version=${saved.versionCode}; basis=${saved.normativeBasisType}",
        )
        return toDto(saved)
    }

    @Transactional
    fun update(id: Long, request: SaveCurriculumVersionRequest, actorId: Long): CurriculumVersionDto {
        val version = requireVersion(id)
        require(version.status == CurriculumStatus.DRAFT) { "Faqat DRAFT curriculum tahrirlanadi" }
        require(request.programId == version.program.id) { "Curriculum biriktirilgan dastur o'zgartirilmaydi" }
        validate(request)
        if (request.versionCode.trim() != version.versionCode) {
            require(!versionRepository.existsByProgramIdAndVersionCodeAndDeletedFalse(request.programId, request.versionCode.trim())) {
                "Ushbu dasturda curriculum versiya kodi allaqachon mavjud"
            }
        }
        version.versionCode = request.versionCode.trim()
        version.academicYear = request.academicYear
        version.credentialType = request.credentialType
        version.normativeBasisType = request.normativeBasisType
        version.standardReference = request.standardReference.trim()
        version.qualificationRequirementsReference = request.qualificationRequirementsReference.trim()
        version.validFrom = request.validFrom
        version.validUntil = request.validUntil
        versionRepository.save(version)
        auditService.logAction("CURRICULUM_VERSION_UPDATED", actorId, "curriculum=$id; version=${version.versionCode}")
        return toDto(version)
    }

    @Transactional
    fun addSubject(id: Long, request: AddCurriculumSubjectRequest, actorId: Long): CurriculumVersionDto {
        val version = requireDraft(id)
        val subject = subjectRepository.findById(request.subjectId).orElseThrow {
            NoSuchElementException("Fan topilmadi: ${request.subjectId}")
        }
        require(!subject.deleted && subject.active) { "Faqat faol fan curriculumga qo'shiladi" }
        require(subject.program?.id == version.program.id) { "Fan curriculum dasturiga tegishli emas" }
        val code = subject.code?.trim()
        require(!code.isNullOrBlank() && code.length <= 100) { "Curriculum fanining kodi majburiy" }
        val credits = subject.credits
        require(credits != null && credits in 1..60) { "Curriculum fanining krediti 1..60 oralig'ida bo'lishi kerak" }
        require(request.semester in 1..12) { "Semestr 1..12 oralig'ida bo'lishi kerak" }
        require(!subjectItemRepository.existsByCurriculumVersionIdAndSubjectIdAndDeletedFalse(id, request.subjectId)) {
            "Fan ushbu curriculumga allaqachon qo'shilgan"
        }
        subjectItemRepository.save(ProgramCurriculumSubject(
            curriculumVersion = version,
            subject = subject,
            subjectCodeSnapshot = code,
            subjectNameSnapshot = subject.name.trim(),
            creditsSnapshot = credits,
            semester = request.semester,
            planItemType = request.planItemType,
        ))
        auditService.logAction("CURRICULUM_SUBJECT_ADDED", actorId, "curriculum=$id; subject=${subject.id}; semester=${request.semester}")
        return toDto(version)
    }

    @Transactional
    fun removeSubject(id: Long, itemId: Long, actorId: Long): CurriculumVersionDto {
        val version = requireDraft(id)
        val item = subjectItemRepository.findByIdAndDeletedFalse(itemId)
            ?: throw NoSuchElementException("Curriculum fan bandi topilmadi: $itemId")
        require(item.curriculumVersion.id == id) { "Fan bandi ushbu curriculumga tegishli emas" }
        item.deleted = true
        subjectItemRepository.save(item)
        auditService.logAction("CURRICULUM_SUBJECT_REMOVED", actorId, "curriculum=$id; item=$itemId")
        return toDto(version)
    }

    @Transactional
    fun approve(id: Long, request: ApproveCurriculumRequest, actorId: Long): CurriculumVersionDto {
        val version = requireDraft(id)
        require(version.createdByUser.id != actorId) { "Curriculum muallifi o'z versiyasini tasdiqlay olmaydi" }
        require(request.approvalOrderNumber.isNotBlank() && request.approvalOrderNumber.trim().length <= 200) {
            "Tasdiqlash buyrug'i raqami majburiy"
        }
        require(!request.approvalOrderDate.isAfter(LocalDate.now())) { "Tasdiqlash buyrug'i sanasi kelajakda bo'lmasligi kerak" }
        require(!versionRepository.existsByProgramIdAndAcademicYearAndStatusAndDeletedFalse(
            requireNotNull(version.program.id), version.academicYear, CurriculumStatus.APPROVED,
        )) { "Dastur va o'quv yili uchun tasdiqlangan curriculum allaqachon mavjud" }
        val items = subjectItemRepository.findAllByCurriculumVersionIdAndDeletedFalseOrderBySemesterAscSubjectNameSnapshotAsc(id)
        require(items.isNotEmpty()) { "Curriculum tasdiqlanishi uchun kamida bitta fan kerak" }
        items.forEach { item ->
            val subject = item.subject
            require(subject != null && !subject.deleted && subject.active && subject.program?.id == version.program.id) {
                "Curriculumdagi ${item.subjectCodeSnapshot} fani faol va shu dasturga tegishli bo'lishi kerak"
            }
            val code = subject.code?.trim()
            val credits = subject.credits
            require(!code.isNullOrBlank() && credits != null && credits in 1..60) {
                "Curriculumdagi fan kodi va 1..60 kredit qiymati majburiy"
            }
            item.subjectCodeSnapshot = code
            item.subjectNameSnapshot = subject.name.trim()
            item.creditsSnapshot = credits
            subjectItemRepository.save(item)
        }
        version.status = CurriculumStatus.APPROVED
        version.approvalOrderNumber = request.approvalOrderNumber.trim()
        version.approvalOrderDate = request.approvalOrderDate
        version.approvedAt = Instant.now()
        version.approvedByUser = requireUser(actorId)
        versionRepository.save(version)
        auditService.logAction(
            "CURRICULUM_VERSION_APPROVED",
            actorId,
            "curriculum=$id; program=${version.program.id}; year=${version.academicYear}; order=${version.approvalOrderNumber}",
        )
        return toDto(version)
    }

    @Transactional
    fun archive(id: Long, actorId: Long): CurriculumVersionDto {
        val version = requireVersion(id)
        require(version.status == CurriculumStatus.APPROVED) { "Faqat APPROVED curriculum arxivlanadi" }
        version.status = CurriculumStatus.ARCHIVED
        version.archivedAt = Instant.now()
        version.archivedByUser = requireUser(actorId)
        versionRepository.save(version)
        auditService.logAction("CURRICULUM_VERSION_ARCHIVED", actorId, "curriculum=$id; program=${version.program.id}")
        return toDto(version)
    }

    private fun validate(request: SaveCurriculumVersionRequest) {
        require(request.versionCode.isNotBlank() && request.versionCode.trim().length <= 100) { "Curriculum versiya kodi majburiy" }
        require(request.academicYear.matches(Regex("\\d{4}-\\d{4}"))) { "O'quv yili YYYY-YYYY formatida bo'lishi kerak" }
        val (firstYear, secondYear) = request.academicYear.split("-").map(String::toInt)
        require(secondYear == firstYear + 1) { "O'quv yili ketma-ket ikki yildan iborat bo'lishi kerak" }
        val academicFrom = LocalDate.of(firstYear, 9, 1)
        val academicUntil = LocalDate.of(secondYear, 8, 31)
        require(!request.validFrom.isAfter(academicFrom) && !request.validUntil.isBefore(academicUntil)) {
            "Curriculum amal qilish davri butun o'quv yilini qoplashi kerak"
        }
        require(!request.validUntil.isBefore(request.validFrom)) { "Curriculum amal qilish muddati noto'g'ri" }
        require(request.standardReference.isNotBlank() && request.standardReference.trim().length <= 1000) { "Standart rekviziti majburiy" }
        require(request.qualificationRequirementsReference.isNotBlank() && request.qualificationRequirementsReference.trim().length <= 1000) {
            "Malaka talablari rekviziti majburiy"
        }
        when (request.credentialType) {
            CurriculumCredentialType.STATE_DIPLOMA -> require(request.normativeBasisType == CurriculumNormativeBasisType.STATE_EDUCATION_STANDARD) {
                "Davlat diplomi dasturi davlat ta'lim standartiga asoslanishi kerak"
            }
            CurriculumCredentialType.NON_STATE_CREDENTIAL -> require(request.normativeBasisType == CurriculumNormativeBasisType.PROFESSIONAL_STANDARD) {
                "Nodavlat hujjat dasturi kasbiy standartga asoslanishi kerak"
            }
        }
    }

    private fun requireProgram(id: Long) = programRepository.findById(id).orElseThrow {
        NoSuchElementException("Ta'lim dasturi topilmadi: $id")
    }.also {
        require(!it.deleted && it.active && it.distanceEnabled) { "Curriculum faqat faol masofaviy ta'lim dasturiga yaratiladi" }
    }

    private fun requireDraft(id: Long) = requireVersion(id).also {
        require(it.status == CurriculumStatus.DRAFT) { "Faqat DRAFT curriculum tarkibi o'zgartiriladi" }
    }

    private fun requireVersion(id: Long) = versionRepository.findByIdAndDeletedFalse(id)
        ?: throw NoSuchElementException("Curriculum versiyasi topilmadi: $id")

    private fun requireUser(id: Long) = userRepository.findById(id)
        .orElseThrow { NoSuchElementException("Foydalanuvchi topilmadi: $id") }

    private fun toDto(version: ProgramCurriculumVersion): CurriculumVersionDto {
        val items = subjectItemRepository.findAllByCurriculumVersionIdAndDeletedFalseOrderBySemesterAscSubjectNameSnapshotAsc(requireNotNull(version.id))
            .map { item -> CurriculumSubjectDto(
                id = requireNotNull(item.id), subjectId = item.subject?.id, subjectCode = item.subjectCodeSnapshot,
                subjectName = item.subjectNameSnapshot, credits = item.creditsSnapshot, semester = item.semester,
                planItemType = item.planItemType.name,
            ) }
        return CurriculumVersionDto(
            id = requireNotNull(version.id), programId = requireNotNull(version.program.id), programName = version.program.name,
            versionCode = version.versionCode, academicYear = version.academicYear, credentialType = version.credentialType.name,
            normativeBasisType = version.normativeBasisType.name, standardReference = version.standardReference,
            qualificationRequirementsReference = version.qualificationRequirementsReference, validFrom = version.validFrom,
            validUntil = version.validUntil, status = version.status.name, subjects = items, subjectCount = items.size,
            totalCredits = items.sumOf(CurriculumSubjectDto::credits), approvalOrderNumber = version.approvalOrderNumber,
            approvalOrderDate = version.approvalOrderDate, approvedAt = version.approvedAt,
            approvedByName = version.approvedByUser?.fullName ?: version.approvedByUser?.username,
            archivedAt = version.archivedAt,
        )
    }
}

