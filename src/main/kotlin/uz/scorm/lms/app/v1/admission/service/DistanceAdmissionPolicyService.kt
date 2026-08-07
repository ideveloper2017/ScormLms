package uz.scorm.lms.app.v1.admission.service

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.admission.dto.ApproveDistanceAdmissionPolicyRequest
import uz.scorm.lms.app.v1.admission.dto.DistanceAdmissionPolicyDto
import uz.scorm.lms.app.v1.admission.dto.SaveDistanceAdmissionPolicyRequest
import uz.scorm.lms.app.v1.admission.model.AdmissionPolicyStatus
import uz.scorm.lms.app.v1.admission.model.ApprovalAuthorityType
import uz.scorm.lms.app.v1.admission.model.DistanceAdmissionPolicy
import uz.scorm.lms.app.v1.admission.model.InstitutionGovernanceType
import uz.scorm.lms.app.v1.admission.repository.DistanceAdmissionPolicyRepository
import uz.scorm.lms.app.v1.audit.service.AuditService
import uz.scorm.lms.app.v1.compliance.Decision559Rules
import uz.scorm.lms.app.v1.license.model.NonStateLicenseStatus
import uz.scorm.lms.app.v1.license.repository.NonStateLicenseProgramScopeRepository
import uz.scorm.lms.app.v1.program.repository.ProgramRepository
import uz.scorm.lms.app.v1.user.repository.UserRepository
import uz.scorm.lms.app.v1.restriction.service.DistanceProgramRestrictionService
import java.time.Instant
import java.time.LocalDate

@Service
class DistanceAdmissionPolicyService(
    private val repository: DistanceAdmissionPolicyRepository,
    private val programRepository: ProgramRepository,
    private val userRepository: UserRepository,
    private val auditService: AuditService,
    private val licenseScopeRepository: NonStateLicenseProgramScopeRepository,
    private val restrictionService: DistanceProgramRestrictionService,
) {
    @Transactional(readOnly = true)
    fun list(): List<DistanceAdmissionPolicyDto> = repository.findAllByDeletedFalseOrderByAcademicYearDescVersionCodeAsc().map(::toDto)

    @Transactional(readOnly = true)
    fun get(id: Long): DistanceAdmissionPolicyDto = toDto(requirePolicy(id))

    @Transactional
    fun create(request: SaveDistanceAdmissionPolicyRequest, actorId: Long): DistanceAdmissionPolicyDto {
        val program = requireProgram(request.programId)
        validate(request, program.degreeLevel, program.informationTechnologyProgram)
        val code = request.versionCode.trim()
        require(!repository.existsByProgramIdAndAcademicYearAndVersionCodeAndDeletedFalse(request.programId, request.academicYear, code)) {
            "Ushbu dastur va o'quv yilida siyosat versiyasi allaqachon mavjud"
        }
        val saved = repository.save(DistanceAdmissionPolicy(
            program = program,
            academicYear = request.academicYear,
            versionCode = code,
            institutionGovernanceType = request.institutionGovernanceType,
            approvalAuthorityType = request.approvalAuthorityType,
            institutionName = request.institutionName.trim(),
            approvingAuthorityName = request.approvingAuthorityName.trim(),
            admissionQuota = request.admissionQuota,
            contractAmount = request.contractAmount.setScale(2),
            higherEducationMinistryAgreementReference = request.higherEducationMinistryAgreementReference.clean(),
            economyMinistryAgreementReference = request.economyMinistryAgreementReference.clean(),
            createdByUser = requireUser(actorId),
        ))
        auditService.logAction("DISTANCE_ADMISSION_POLICY_CREATED", actorId, "policy=${saved.id}; program=${program.id}; year=${saved.academicYear}; governance=${saved.institutionGovernanceType}")
        return toDto(saved)
    }

    @Transactional
    fun update(id: Long, request: SaveDistanceAdmissionPolicyRequest, actorId: Long): DistanceAdmissionPolicyDto {
        val policy = requirePolicy(id)
        require(policy.status == AdmissionPolicyStatus.DRAFT) { "Faqat DRAFT siyosat tahrirlanadi" }
        require(request.programId == policy.program.id) { "Siyosat dasturi o'zgartirilmaydi" }
        validate(request, policy.program.degreeLevel, policy.program.informationTechnologyProgram)
        val code = request.versionCode.trim()
        if (code != policy.versionCode || request.academicYear != policy.academicYear) {
            require(!repository.existsByProgramIdAndAcademicYearAndVersionCodeAndDeletedFalse(request.programId, request.academicYear, code)) {
                "Ushbu dastur va o'quv yilida siyosat versiyasi allaqachon mavjud"
            }
        }
        policy.academicYear = request.academicYear
        policy.versionCode = code
        policy.institutionGovernanceType = request.institutionGovernanceType
        policy.approvalAuthorityType = request.approvalAuthorityType
        policy.institutionName = request.institutionName.trim()
        policy.approvingAuthorityName = request.approvingAuthorityName.trim()
        policy.admissionQuota = request.admissionQuota
        policy.contractAmount = request.contractAmount.setScale(2)
        policy.higherEducationMinistryAgreementReference = request.higherEducationMinistryAgreementReference.clean()
        policy.economyMinistryAgreementReference = request.economyMinistryAgreementReference.clean()
        repository.save(policy)
        auditService.logAction("DISTANCE_ADMISSION_POLICY_UPDATED", actorId, "policy=$id; year=${policy.academicYear}")
        return toDto(policy)
    }

    @Transactional
    fun approve(id: Long, request: ApproveDistanceAdmissionPolicyRequest, actorId: Long): DistanceAdmissionPolicyDto {
        val policy = requirePolicy(id)
        require(policy.status == AdmissionPolicyStatus.DRAFT) { "Faqat DRAFT siyosat tasdiqlanadi" }
        require(policy.createdByUser.id != actorId) { "Siyosat muallifi o'z hujjatini tasdiqlay olmaydi" }
        programRepository.findByIdForUpdate(requireNotNull(policy.program.id))
            ?: throw NoSuchElementException("Ta'lim dasturi topilmadi: ${policy.program.id}")
        require(!repository.existsByProgramIdAndAcademicYearAndStatusAndDeletedFalse(requireNotNull(policy.program.id), policy.academicYear, AdmissionPolicyStatus.APPROVED)) {
            "Dastur va o'quv yili uchun tasdiqlangan qabul siyosati allaqachon mavjud"
        }
        require(request.approvalDocumentNumber.isNotBlank() && request.approvalDocumentNumber.trim().length <= 200) { "Tasdiqlash hujjati raqami majburiy" }
        require(!request.approvalDocumentDate.isAfter(LocalDate.now())) { "Tasdiqlash hujjati sanasi kelajakda bo'lmasligi kerak" }
        restrictionService.requireAllowed(policy.program.code, policy.program.degreeLevel, policy.program.distanceEnabled, request.approvalDocumentDate)
        require(request.approvalDocumentReference.isNotBlank() && request.approvalDocumentReference.trim().length <= 1000) { "Tasdiqlash hujjati rekviziti majburiy" }
        if (policy.institutionGovernanceType == InstitutionGovernanceType.NON_STATE) {
            require(licenseScopeRepository.existsEffectiveCoverage(
                requireNotNull(policy.program.id), NonStateLicenseStatus.VERIFIED, request.approvalDocumentDate,
            )) {
                "Nodavlat OTMning ushbu masofaviy dasturi tasdiqlash sanasida amaldagi va tekshirilgan litsenziyada qayd etilmagan"
            }
        }
        policy.status = AdmissionPolicyStatus.APPROVED
        policy.approvalDocumentNumber = request.approvalDocumentNumber.trim()
        policy.approvalDocumentDate = request.approvalDocumentDate
        policy.approvalDocumentReference = request.approvalDocumentReference.trim()
        policy.approvedAt = Instant.now()
        policy.approvedByUser = requireUser(actorId)
        repository.save(policy)
        auditService.logAction("DISTANCE_ADMISSION_POLICY_APPROVED", actorId, "policy=$id; program=${policy.program.id}; year=${policy.academicYear}; document=${policy.approvalDocumentNumber}")
        return toDto(policy)
    }

    @Transactional
    fun archive(id: Long, actorId: Long): DistanceAdmissionPolicyDto {
        val policy = requirePolicy(id)
        require(policy.status == AdmissionPolicyStatus.APPROVED) { "Faqat APPROVED siyosat arxivlanadi" }
        policy.status = AdmissionPolicyStatus.ARCHIVED
        policy.archivedAt = Instant.now()
        policy.archivedByUser = requireUser(actorId)
        repository.save(policy)
        auditService.logAction("DISTANCE_ADMISSION_POLICY_ARCHIVED", actorId, "policy=$id; program=${policy.program.id}; year=${policy.academicYear}")
        return toDto(policy)
    }

    private fun validate(request: SaveDistanceAdmissionPolicyRequest, degreeLevel: String?, informationTechnologyProgram: Boolean) {
        require(request.academicYear.matches(Regex("\\d{4}-\\d{4}"))) { "O'quv yili YYYY-YYYY formatida bo'lishi kerak" }
        val years = request.academicYear.split("-").map(String::toInt)
        require(years[1] == years[0] + 1) { "O'quv yili ketma-ket ikki yildan iborat bo'lishi kerak" }
        require(request.versionCode.isNotBlank() && request.versionCode.trim().length <= 100) { "Siyosat versiya kodi majburiy" }
        require(request.institutionName.isNotBlank() && request.institutionName.trim().length <= 500) { "OTM nomi majburiy" }
        require(request.approvingAuthorityName.isNotBlank() && request.approvingAuthorityName.trim().length <= 500) { "Tasdiqlovchi organ nomi majburiy" }
        require(request.admissionQuota > 0) { "Qabul parametri musbat bo'lishi kerak" }
        require(request.contractAmount.signum() > 0 && request.contractAmount.scale() <= 2) { "Kontrakt qiymati musbat va ko'pi bilan 2 kasr xonali bo'lishi kerak" }
        requireAuthority(request)
        if (!informationTechnologyProgram) {
            Decision559Rules.regulatoryLimit(degreeLevel)?.let { limit ->
                require(request.admissionQuota <= limit) { "Qabul parametri 559-son qarordagi $limit nafar chegaradan oshmasligi kerak" }
            }
        }
    }

    private fun requireAuthority(request: SaveDistanceAdmissionPolicyRequest) {
        val expected = when (request.institutionGovernanceType) {
            InstitutionGovernanceType.STATE_STANDARD -> ApprovalAuthorityType.SUBORDINATE_MINISTRY_AGENCY
            InstitutionGovernanceType.STATE_FINANCIALLY_AUTONOMOUS -> ApprovalAuthorityType.SUPERVISORY_BOARD
            InstitutionGovernanceType.NON_STATE -> ApprovalAuthorityType.FOUNDER
        }
        require(request.approvalAuthorityType == expected) { "OTM boshqaruv turiga mos tasdiqlovchi vakolat tanlanishi shart" }
        val higher = request.higherEducationMinistryAgreementReference.clean()
        val economy = request.economyMinistryAgreementReference.clean()
        if (request.institutionGovernanceType == InstitutionGovernanceType.STATE_STANDARD) {
            require(!higher.isNullOrBlank() && !economy.isNullOrBlank()) { "Oddiy davlat OTM uchun oliy ta'lim va iqtisodiyot organlari bilan kelishuv rekvizitlari majburiy" }
        } else {
            require(higher == null && economy == null) { "Kelishuv rekvizitlari faqat moliyaviy mustaqil bo'lmagan davlat OTM uchun qo'llanadi" }
        }
    }

    private fun requireProgram(id: Long) = programRepository.findById(id).orElseThrow { NoSuchElementException("Ta'lim dasturi topilmadi: $id") }.also {
        require(!it.deleted && it.active && it.distanceEnabled) { "Qabul siyosati faqat faol masofaviy ta'lim dasturiga yaratiladi" }
    }

    private fun requirePolicy(id: Long) = repository.findByIdAndDeletedFalse(id) ?: throw NoSuchElementException("Qabul siyosati topilmadi: $id")
    private fun requireUser(id: Long) = userRepository.findById(id).orElseThrow { NoSuchElementException("Foydalanuvchi topilmadi: $id") }
    private fun String?.clean(): String? = this?.trim()?.takeIf(String::isNotBlank)

    private fun toDto(policy: DistanceAdmissionPolicy) = DistanceAdmissionPolicyDto(
        id = requireNotNull(policy.id), programId = requireNotNull(policy.program.id), programName = policy.program.name,
        academicYear = policy.academicYear, versionCode = policy.versionCode,
        institutionGovernanceType = policy.institutionGovernanceType.name, approvalAuthorityType = policy.approvalAuthorityType.name,
        institutionName = policy.institutionName, approvingAuthorityName = policy.approvingAuthorityName,
        admissionQuota = policy.admissionQuota, contractAmount = policy.contractAmount, currency = policy.currency,
        higherEducationMinistryAgreementReference = policy.higherEducationMinistryAgreementReference,
        economyMinistryAgreementReference = policy.economyMinistryAgreementReference, status = policy.status.name,
        createdByName = policy.createdByUser.fullName ?: policy.createdByUser.username,
        approvalDocumentNumber = policy.approvalDocumentNumber, approvalDocumentDate = policy.approvalDocumentDate,
        approvalDocumentReference = policy.approvalDocumentReference,
        approvedByName = policy.approvedByUser?.fullName ?: policy.approvedByUser?.username,
        approvedAt = policy.approvedAt, archivedAt = policy.archivedAt,
    )
}
