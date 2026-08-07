package uz.scorm.lms.app.v1.compliance

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.audit.service.AuditService
import uz.scorm.lms.app.v1.user.repository.UserRepository
import java.time.Instant
import java.time.LocalDate

@Service
class ComplianceAccountabilityService(
    private val repository: ComplianceAccountabilityReferralRepository,
    private val issueRepository: ComplianceIssueRepository,
    private val userRepository: UserRepository,
    private val auditService: AuditService,
) {
    @Transactional(readOnly = true)
    fun list(): List<AccountabilityReferralDto> = repository.findAllByDeletedFalseOrderByReferralDateDesc().map(::toDto)

    @Transactional(readOnly = true)
    fun get(id: Long): AccountabilityReferralDto = toDto(requireReferral(id))

    @Transactional
    fun create(request: SaveAccountabilityReferralRequest, actorId: Long): AccountabilityReferralDto {
        val issue = requireIssue(request.complianceIssueId)
        require(issue.status != ComplianceIssueStatus.CLOSED) { "Yopilgan compliance vazifasidan javobgarlik referralini ochib bo'lmaydi" }
        validate(request)
        val authority = request.competentAuthority.trim()
        val number = request.referralNumber.trim()
        require(!repository.existsByCompetentAuthorityAndReferralNumberAndDeletedFalse(authority, number)) {
            "Ushbu vakolatli organ va referral raqami allaqachon mavjud"
        }
        val saved = repository.save(ComplianceAccountabilityReferral(
            issue = issue,
            reviewSubjectReference = request.reviewSubjectReference.trim(),
            competentAuthority = authority,
            legalBasis = request.legalBasis.trim(),
            referralNumber = number,
            referralDate = request.referralDate,
            evidencePackageReference = request.evidencePackageReference.trim(),
            createdByUser = requireUser(actorId),
        ))
        auditService.logAction("ACCOUNTABILITY_REFERRAL_CREATED", actorId, "referral=${saved.id}; issue=${issue.id}; authority=${authority.take(120)}; number=$number")
        return toDto(saved)
    }

    @Transactional
    fun update(id: Long, request: SaveAccountabilityReferralRequest, actorId: Long): AccountabilityReferralDto {
        val referral = requireDraft(id)
        require(request.complianceIssueId == referral.issue.id) { "Referralga bog'langan compliance vazifasi o'zgartirilmaydi" }
        validate(request)
        val authority = request.competentAuthority.trim()
        val number = request.referralNumber.trim()
        require(!repository.existsByCompetentAuthorityAndReferralNumberAndDeletedFalseAndIdNot(authority, number, id)) {
            "Ushbu vakolatli organ va referral raqami allaqachon mavjud"
        }
        referral.reviewSubjectReference = request.reviewSubjectReference.trim()
        referral.competentAuthority = authority
        referral.legalBasis = request.legalBasis.trim()
        referral.referralNumber = number
        referral.referralDate = request.referralDate
        referral.evidencePackageReference = request.evidencePackageReference.trim()
        repository.save(referral)
        auditService.logAction("ACCOUNTABILITY_REFERRAL_UPDATED", actorId, "referral=$id; issue=${referral.issue.id}; number=$number")
        return toDto(referral)
    }

    @Transactional
    fun refer(id: Long, request: ReferAccountabilityRequest, actorId: Long): AccountabilityReferralDto {
        val referral = requireDraft(id)
        require(referral.createdByUser.id != actorId) { "Referral qoralamasini yaratgan foydalanuvchi uni o'zi yubora olmaydi" }
        require(request.referralNote.trim().length in 10..2000) { "Referral izohi 10..2000 belgidan iborat bo'lishi kerak" }
        validate(toRequest(referral))
        referral.status = AccountabilityReferralStatus.REFERRED
        referral.referredAt = Instant.now()
        referral.referredByUser = requireUser(actorId)
        referral.referralNote = request.referralNote.trim()
        repository.save(referral)
        auditService.logAction("ACCOUNTABILITY_REFERRAL_SUBMITTED", actorId, "referral=$id; issue=${referral.issue.id}; authority=${referral.competentAuthority.take(120)}")
        return toDto(referral)
    }

    @Transactional
    fun recordDecision(id: Long, request: RecordAccountabilityDecisionRequest, actorId: Long): AccountabilityReferralDto {
        val referral = requireReferral(id)
        require(referral.status == AccountabilityReferralStatus.REFERRED) { "Faqat REFERRED yozuvga tashqi qaror qayd etiladi" }
        require(referral.createdByUser.id != actorId) { "Referral muallifi tashqi javobgarlik qarorini qayd eta olmaydi" }
        require(!request.decisionDate.isAfter(LocalDate.now())) { "Qaror sanasi kelajakda bo'lmasligi kerak" }
        require(!request.decisionDate.isBefore(referral.referralDate)) { "Qaror sanasi referral sanasidan oldin bo'lmasligi kerak" }
        text(request.decisionAuthority, "Qaror chiqargan vakolatli organ", 500, 3)
        text(request.decisionNumber, "Qaror raqami", 200, 1)
        text(request.decisionEvidenceReference, "Qaror dalili", 1000, 5)
        text(request.decisionSummary, "Qaror mazmuni", 4000, 20)
        referral.status = AccountabilityReferralStatus.DECIDED
        referral.decisionOutcome = request.outcome
        referral.decisionAuthority = request.decisionAuthority.trim()
        referral.decisionNumber = request.decisionNumber.trim()
        referral.decisionDate = request.decisionDate
        referral.decisionEvidenceReference = request.decisionEvidenceReference.trim()
        referral.decisionSummary = request.decisionSummary.trim()
        referral.decidedAt = Instant.now()
        referral.decidedByUser = requireUser(actorId)
        repository.save(referral)
        auditService.logAction("ACCOUNTABILITY_DECISION_RECORDED", actorId, "referral=$id; outcome=${request.outcome}; authority=${referral.decisionAuthority?.take(120)}; decision=${referral.decisionNumber}")
        return toDto(referral)
    }

    private fun validate(request: SaveAccountabilityReferralRequest) {
        text(request.reviewSubjectReference, "Tekshiruv subyekti rekviziti", 1000, 5)
        text(request.competentAuthority, "Vakolatli organ", 500, 3)
        text(request.legalBasis, "Huquqiy asos", 1000, 5)
        text(request.referralNumber, "Referral raqami", 200, 1)
        text(request.evidencePackageReference, "Dalil paketi", 1000, 5)
        require(!request.referralDate.isAfter(LocalDate.now())) { "Referral sanasi kelajakda bo'lmasligi kerak" }
    }

    private fun text(value: String, label: String, max: Int, min: Int) {
        require(value.trim().length in min..max) { "$label $min..$max belgidan iborat bo'lishi kerak" }
    }

    private fun requireIssue(id: Long) = issueRepository.findByIdAndDeletedFalse(id)
        ?: throw NoSuchElementException("Compliance vazifasi topilmadi: $id")
    private fun requireReferral(id: Long) = repository.findByIdAndDeletedFalse(id)
        ?: throw NoSuchElementException("Javobgarlik referrali topilmadi: $id")
    private fun requireDraft(id: Long) = requireReferral(id).also {
        require(it.status == AccountabilityReferralStatus.DRAFT) { "Faqat DRAFT referral tahrirlanadi yoki yuboriladi" }
    }
    private fun requireUser(id: Long) = userRepository.findById(id).orElseThrow { NoSuchElementException("Foydalanuvchi topilmadi: $id") }

    private fun toRequest(r: ComplianceAccountabilityReferral) = SaveAccountabilityReferralRequest(
        requireNotNull(r.issue.id), r.reviewSubjectReference, r.competentAuthority, r.legalBasis,
        r.referralNumber, r.referralDate, r.evidencePackageReference,
    )

    private fun toDto(r: ComplianceAccountabilityReferral) = AccountabilityReferralDto(
        id = requireNotNull(r.id),
        complianceIssueId = requireNotNull(r.issue.id),
        issueTitle = r.issue.title,
        issueClause = r.issue.clause,
        reviewSubjectReference = r.reviewSubjectReference,
        competentAuthority = r.competentAuthority,
        legalBasis = r.legalBasis,
        referralNumber = r.referralNumber,
        referralDate = r.referralDate,
        evidencePackageReference = r.evidencePackageReference,
        status = r.status,
        createdByName = r.createdByUser.fullName ?: r.createdByUser.username,
        referredAt = r.referredAt,
        referredByName = r.referredByUser?.fullName ?: r.referredByUser?.username,
        referralNote = r.referralNote,
        decisionOutcome = r.decisionOutcome,
        responsibilityEstablished = r.decisionOutcome == AccountabilityDecisionOutcome.RESPONSIBILITY_ESTABLISHED,
        decisionAuthority = r.decisionAuthority,
        decisionNumber = r.decisionNumber,
        decisionDate = r.decisionDate,
        decisionEvidenceReference = r.decisionEvidenceReference,
        decisionSummary = r.decisionSummary,
        decidedAt = r.decidedAt,
        decidedByName = r.decidedByUser?.fullName ?: r.decidedByUser?.username,
    )
}
