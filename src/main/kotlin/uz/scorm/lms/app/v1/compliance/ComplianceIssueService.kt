package uz.scorm.lms.app.v1.compliance

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.audit.service.AuditService
import uz.scorm.lms.app.v1.user.model.User
import uz.scorm.lms.app.v1.user.model.UserStatus
import uz.scorm.lms.app.v1.user.repository.UserRepository
import java.time.Instant
import java.time.LocalDate

@Service
class ComplianceIssueService(
    private val repository: ComplianceIssueRepository,
    private val userRepository: UserRepository,
    private val complianceService: Decision559ComplianceService,
    private val auditService: AuditService,
) {
    @Transactional(readOnly = true)
    fun list(): List<ComplianceIssueDto> = repository.findAllByDeletedFalseOrderByStatusAscDueDateAsc().map(::toDto)

    @Transactional(readOnly = true)
    fun owners(): List<ComplianceOwnerDto> = userRepository.findAllByStatus(UserStatus.ACTIVE)
        .asSequence()
        .filter { !it.deleted }
        .sortedBy { it.fullName ?: it.username }
        .map { ComplianceOwnerDto(requireNotNull(it.id), it.fullName ?: it.username, it.username) }
        .toList()

    @Transactional
    fun create(request: CreateComplianceIssueRequest, actorId: Long): ComplianceIssueDto {
        val violation = complianceService.summary().violations.firstOrNull { it.code == request.violationCode }
            ?: throw IllegalArgumentException("Bu compliance buzilishi hozir mavjud emas")
        if (repository.findFirstByViolationCodeAndStatusNotAndDeletedFalse(request.violationCode, ComplianceIssueStatus.CLOSED) != null) {
            throw IllegalArgumentException("Bu buzilish uchun ochiq tuzatish vazifasi mavjud")
        }
        validatePlan(request.remediationPlan)
        validateDueDate(request.dueDate)
        val owner = activeUser(request.ownerId, "Mas'ul foydalanuvchi topilmadi")
        val issue = repository.save(ComplianceIssue(
            violationCode = violation.code,
            clause = violation.clause,
            severity = ComplianceIssueSeverity.valueOf(violation.severity),
            title = violation.message,
            recommendation = violation.recommendation,
            remediationPlan = request.remediationPlan.trim(),
            owner = owner,
            dueDate = request.dueDate,
        ))
        auditService.logAction("COMPLIANCE_ISSUE_CREATED", actorId, "issue=${issue.id}; violation=${issue.violationCode}; owner=${owner.id}; due=${issue.dueDate}")
        return toDto(issue)
    }

    @Transactional
    fun update(id: Long, request: UpdateComplianceIssueRequest, actorId: Long): ComplianceIssueDto {
        val issue = find(id)
        require(issue.status != ComplianceIssueStatus.CLOSED) { "Yopilgan vazifani tahrirlab bo'lmaydi" }
        validatePlan(request.remediationPlan)
        validateDueDate(request.dueDate)
        issue.owner = activeUser(request.ownerId, "Mas'ul foydalanuvchi topilmadi")
        issue.dueDate = request.dueDate
        issue.remediationPlan = request.remediationPlan.trim()
        auditService.logAction("COMPLIANCE_ISSUE_UPDATED", actorId, "issue=$id; owner=${issue.owner?.id}; due=${issue.dueDate}")
        return toDto(repository.save(issue))
    }

    @Transactional
    fun changeStatus(id: Long, request: ChangeComplianceIssueStatusRequest, actorId: Long): ComplianceIssueDto {
        val issue = find(id)
        val target = request.status
        val allowed = when (issue.status) {
            ComplianceIssueStatus.OPEN -> setOf(ComplianceIssueStatus.IN_PROGRESS)
            ComplianceIssueStatus.IN_PROGRESS -> setOf(ComplianceIssueStatus.RESOLVED)
            ComplianceIssueStatus.RESOLVED -> setOf(ComplianceIssueStatus.IN_PROGRESS, ComplianceIssueStatus.CLOSED)
            ComplianceIssueStatus.CLOSED -> emptySet()
        }
        require(target in allowed) { "${issue.status} holatidan $target holatiga o'tib bo'lmaydi" }
        val actor = activeUser(actorId, "Amal bajaruvchi topilmadi")
        when (target) {
            ComplianceIssueStatus.RESOLVED -> {
                val evidence = request.resolutionEvidence?.trim().orEmpty()
                require(evidence.isNotBlank()) { "Yechim dalili majburiy" }
                require(evidence.length <= 4000) { "Yechim dalili 4000 belgidan oshmasligi kerak" }
                issue.resolutionEvidence = evidence
                issue.resolvedAt = Instant.now()
                issue.resolvedBy = actor
            }
            ComplianceIssueStatus.IN_PROGRESS -> {
                issue.resolutionEvidence = null
                issue.resolvedAt = null
                issue.resolvedBy = null
            }
            ComplianceIssueStatus.CLOSED -> {
                val stillPresent = complianceService.summary().violations.any { it.code == issue.violationCode }
                require(!stillPresent) { "Compliance buzilishi hali mavjud; vazifani yopib bo'lmaydi" }
                issue.closedAt = Instant.now()
                issue.closedBy = actor
            }
            ComplianceIssueStatus.OPEN -> Unit
        }
        issue.status = target
        auditService.logAction("COMPLIANCE_ISSUE_STATUS_CHANGED", actorId, "issue=$id; status=$target")
        return toDto(repository.save(issue))
    }

    private fun find(id: Long) = repository.findByIdAndDeletedFalse(id)
        ?: throw IllegalArgumentException("Compliance vazifasi topilmadi")

    private fun activeUser(id: Long, message: String): User = userRepository.findById(id).orElse(null)
        ?.takeIf { !it.deleted && it.status == UserStatus.ACTIVE }
        ?: throw IllegalArgumentException(message)

    private fun validatePlan(plan: String) {
        require(plan.isNotBlank()) { "Tuzatish rejasi majburiy" }
        require(plan.trim().length <= 4000) { "Tuzatish rejasi 4000 belgidan oshmasligi kerak" }
    }

    private fun validateDueDate(dueDate: LocalDate) {
        require(!dueDate.isBefore(LocalDate.now())) { "Deadline bugungi kundan oldin bo'lishi mumkin emas" }
    }

    private fun toDto(issue: ComplianceIssue) = ComplianceIssueDto(
        id = requireNotNull(issue.id),
        violationCode = issue.violationCode,
        clause = issue.clause,
        severity = issue.severity,
        title = issue.title,
        recommendation = issue.recommendation,
        remediationPlan = issue.remediationPlan,
        ownerId = requireNotNull(issue.owner?.id),
        ownerName = issue.owner?.fullName ?: issue.owner?.username.orEmpty(),
        dueDate = issue.dueDate,
        overdue = issue.status != ComplianceIssueStatus.CLOSED && issue.dueDate.isBefore(LocalDate.now()),
        status = issue.status,
        resolutionEvidence = issue.resolutionEvidence,
        resolvedAt = issue.resolvedAt,
        resolvedByName = issue.resolvedBy?.fullName ?: issue.resolvedBy?.username,
        closedAt = issue.closedAt,
        closedByName = issue.closedBy?.fullName ?: issue.closedBy?.username,
        createdAt = issue.createdAt,
        updatedAt = issue.updatedAt,
    )
}
