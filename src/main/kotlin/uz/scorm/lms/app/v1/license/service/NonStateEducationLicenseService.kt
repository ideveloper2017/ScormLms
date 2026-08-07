package uz.scorm.lms.app.v1.license.service

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.audit.service.AuditService
import uz.scorm.lms.app.v1.license.dto.AddLicenseProgramScopeRequest
import uz.scorm.lms.app.v1.license.dto.LicenseProgramScopeDto
import uz.scorm.lms.app.v1.license.dto.NonStateEducationLicenseDto
import uz.scorm.lms.app.v1.license.dto.RevokeNonStateEducationLicenseRequest
import uz.scorm.lms.app.v1.license.dto.SaveNonStateEducationLicenseRequest
import uz.scorm.lms.app.v1.license.dto.VerifyNonStateEducationLicenseRequest
import uz.scorm.lms.app.v1.license.model.NonStateEducationLicense
import uz.scorm.lms.app.v1.license.model.NonStateLicenseProgramScope
import uz.scorm.lms.app.v1.license.model.NonStateLicenseStatus
import uz.scorm.lms.app.v1.license.repository.NonStateEducationLicenseRepository
import uz.scorm.lms.app.v1.license.repository.NonStateLicenseProgramScopeRepository
import uz.scorm.lms.app.v1.program.repository.ProgramRepository
import uz.scorm.lms.app.v1.user.repository.UserRepository
import java.time.Instant
import java.time.LocalDate

@Service
class NonStateEducationLicenseService(
    private val licenseRepository: NonStateEducationLicenseRepository,
    private val scopeRepository: NonStateLicenseProgramScopeRepository,
    private val programRepository: ProgramRepository,
    private val userRepository: UserRepository,
    private val auditService: AuditService,
) {
    @Transactional(readOnly = true)
    fun list(): List<NonStateEducationLicenseDto> = licenseRepository.findAllByDeletedFalseOrderByIssueDateDescLicenseNumberAsc().map(::toDto)

    @Transactional(readOnly = true)
    fun get(id: Long): NonStateEducationLicenseDto = toDto(requireLicense(id))

    @Transactional
    fun create(request: SaveNonStateEducationLicenseRequest, actorId: Long): NonStateEducationLicenseDto {
        validate(request)
        val number = request.licenseNumber.trim()
        require(!licenseRepository.existsByLicenseNumberAndDeletedFalse(number)) { "Litsenziya raqami allaqachon mavjud" }
        val license = licenseRepository.save(NonStateEducationLicense(
            institutionName = request.institutionName.trim(), licenseNumber = number,
            issuingAuthority = request.issuingAuthority.trim(), issueDate = request.issueDate,
            validFrom = request.validFrom, validUntil = request.validUntil,
            officialRegistryReference = request.officialRegistryReference.trim(), createdByUser = requireUser(actorId),
        ))
        auditService.logAction("NON_STATE_LICENSE_CREATED", actorId, "license=${license.id}; number=${license.licenseNumber}; institution=${license.institutionName}")
        return toDto(license)
    }

    @Transactional
    fun update(id: Long, request: SaveNonStateEducationLicenseRequest, actorId: Long): NonStateEducationLicenseDto {
        val license = requireDraft(id)
        validate(request)
        val number = request.licenseNumber.trim()
        if (number != license.licenseNumber) require(!licenseRepository.existsByLicenseNumberAndDeletedFalse(number)) { "Litsenziya raqami allaqachon mavjud" }
        license.institutionName = request.institutionName.trim(); license.licenseNumber = number
        license.issuingAuthority = request.issuingAuthority.trim(); license.issueDate = request.issueDate
        license.validFrom = request.validFrom; license.validUntil = request.validUntil
        license.officialRegistryReference = request.officialRegistryReference.trim()
        licenseRepository.save(license)
        auditService.logAction("NON_STATE_LICENSE_UPDATED", actorId, "license=$id; number=${license.licenseNumber}")
        return toDto(license)
    }

    @Transactional
    fun addScope(id: Long, request: AddLicenseProgramScopeRequest, actorId: Long): NonStateEducationLicenseDto {
        val license = requireDraft(id)
        val program = programRepository.findById(request.programId).orElseThrow { NoSuchElementException("Ta'lim dasturi topilmadi: ${request.programId}") }
        require(!program.deleted && program.active && program.distanceEnabled) { "Faqat faol masofaviy dastur litsenziya qamroviga qo'shiladi" }
        require(program.degreeLevel.equals("BACHELOR", true) || program.degreeLevel.equals("MASTER", true)) { "16-band qamrovi bakalavriat yo'nalishi yoki magistratura mutaxassisligiga tegishli" }
        val code = program.code?.trim()
        require(!code.isNullOrBlank() && code.length <= 100) { "Litsenziya qamrovi uchun dastur kodi majburiy" }
        require(!scopeRepository.existsByLicenseIdAndProgramIdAndDeletedFalse(id, request.programId)) { "Dastur ushbu litsenziyada allaqachon qayd etilgan" }
        scopeRepository.save(NonStateLicenseProgramScope(
            license = license, program = program, programCodeSnapshot = code,
            programNameSnapshot = program.name.trim(), degreeLevelSnapshot = requireNotNull(program.degreeLevel).uppercase(),
        ))
        auditService.logAction("NON_STATE_LICENSE_SCOPE_ADDED", actorId, "license=$id; program=${program.id}; code=$code")
        return toDto(license)
    }

    @Transactional
    fun removeScope(id: Long, scopeId: Long, actorId: Long): NonStateEducationLicenseDto {
        val license = requireDraft(id)
        val scope = scopeRepository.findByIdAndDeletedFalse(scopeId) ?: throw NoSuchElementException("Litsenziya qamrovi topilmadi: $scopeId")
        require(scope.license.id == id) { "Qamrov ushbu litsenziyaga tegishli emas" }
        scopeRepository.delete(scope)
        auditService.logAction("NON_STATE_LICENSE_SCOPE_REMOVED", actorId, "license=$id; scope=$scopeId")
        return toDto(license)
    }

    @Transactional
    fun verify(id: Long, request: VerifyNonStateEducationLicenseRequest, actorId: Long): NonStateEducationLicenseDto {
        val license = requireDraft(id)
        require(license.createdByUser.id != actorId) { "Litsenziya kiritgan foydalanuvchi uni o'zi tasdiqlay olmaydi" }
        require(request.verificationEvidence.isNotBlank() && request.verificationEvidence.trim().length <= 1000) { "Rasmiy tekshiruv dalili majburiy" }
        val scopes = scopeRepository.findAllByLicenseIdAndDeletedFalseOrderByProgramCodeSnapshotAsc(id)
        require(scopes.isNotEmpty()) { "Litsenziyada kamida bitta masofaviy bakalavriat yoki magistratura dasturi qayd etilishi shart" }
        scopes.forEach { scope ->
            val program = scope.program
            require(!program.deleted && program.active && program.distanceEnabled && program.code?.trim() == scope.programCodeSnapshot && program.name.trim() == scope.programNameSnapshot && program.degreeLevel.equals(scope.degreeLevelSnapshot, true)) {
                "${scope.programCodeSnapshot} dasturining joriy katalogi litsenziya qamrovi snapshotiga mos emas"
            }
        }
        license.status = NonStateLicenseStatus.VERIFIED
        license.verificationEvidence = request.verificationEvidence.trim()
        license.verifiedAt = Instant.now(); license.verifiedByUser = requireUser(actorId)
        licenseRepository.save(license)
        auditService.logAction("NON_STATE_LICENSE_VERIFIED", actorId, "license=$id; number=${license.licenseNumber}; scopes=${scopes.size}")
        return toDto(license)
    }

    @Transactional
    fun revoke(id: Long, request: RevokeNonStateEducationLicenseRequest, actorId: Long): NonStateEducationLicenseDto {
        val license = requireLicense(id)
        require(license.status == NonStateLicenseStatus.VERIFIED) { "Faqat VERIFIED litsenziya bekor qilinadi" }
        require(request.reason.trim().length in 10..2000) { "Bekor qilish sababi 10..2000 belgidan iborat bo'lishi kerak" }
        require(request.documentReference.isNotBlank() && request.documentReference.trim().length <= 1000) { "Bekor qilish hujjati rekviziti majburiy" }
        license.status = NonStateLicenseStatus.REVOKED
        license.revocationReason = request.reason.trim(); license.revocationDocumentReference = request.documentReference.trim()
        license.revokedAt = Instant.now(); license.revokedByUser = requireUser(actorId)
        licenseRepository.save(license)
        auditService.logAction("NON_STATE_LICENSE_REVOKED", actorId, "license=$id; number=${license.licenseNumber}; document=${license.revocationDocumentReference}")
        return toDto(license)
    }

    private fun validate(request: SaveNonStateEducationLicenseRequest) {
        require(request.institutionName.isNotBlank() && request.institutionName.trim().length <= 500) { "Nodavlat OTM nomi majburiy" }
        require(request.licenseNumber.isNotBlank() && request.licenseNumber.trim().length <= 200) { "Litsenziya raqami majburiy" }
        require(request.issuingAuthority.isNotBlank() && request.issuingAuthority.trim().length <= 500) { "Litsenziya bergan vakolatli organ majburiy" }
        require(!request.issueDate.isAfter(LocalDate.now())) { "Litsenziya berilgan sana kelajakda bo'lmasligi kerak" }
        require(!request.validFrom.isBefore(request.issueDate)) { "Litsenziya amal qilish boshi berilgan sanadan oldin bo'lmasligi kerak" }
        require(request.validUntil == null || !request.validUntil.isBefore(request.validFrom)) { "Litsenziya amal qilish muddati noto'g'ri" }
        require(request.officialRegistryReference.isNotBlank() && request.officialRegistryReference.trim().length <= 1000) { "Rasmiy litsenziya reestri rekviziti majburiy" }
    }

    private fun requireLicense(id: Long) = licenseRepository.findByIdAndDeletedFalse(id) ?: throw NoSuchElementException("Nodavlat OTM litsenziyasi topilmadi: $id")
    private fun requireDraft(id: Long) = requireLicense(id).also { require(it.status == NonStateLicenseStatus.DRAFT) { "Faqat DRAFT litsenziya tahrirlanadi" } }
    private fun requireUser(id: Long) = userRepository.findById(id).orElseThrow { NoSuchElementException("Foydalanuvchi topilmadi: $id") }

    private fun toDto(license: NonStateEducationLicense): NonStateEducationLicenseDto {
        val scopes = scopeRepository.findAllByLicenseIdAndDeletedFalseOrderByProgramCodeSnapshotAsc(requireNotNull(license.id)).map { scope -> LicenseProgramScopeDto(
            id = requireNotNull(scope.id), programId = requireNotNull(scope.program.id), programCode = scope.programCodeSnapshot,
            programName = scope.programNameSnapshot, degreeLevel = scope.degreeLevelSnapshot, distanceEducationCovered = scope.distanceEducationCovered,
        ) }
        val today = LocalDate.now()
        return NonStateEducationLicenseDto(
            id = requireNotNull(license.id), institutionName = license.institutionName, licenseNumber = license.licenseNumber,
            issuingAuthority = license.issuingAuthority, issueDate = license.issueDate, validFrom = license.validFrom,
            validUntil = license.validUntil, officialRegistryReference = license.officialRegistryReference, status = license.status.name,
            effective = license.status == NonStateLicenseStatus.VERIFIED && !today.isBefore(license.validFrom) && (license.validUntil == null || !today.isAfter(license.validUntil)),
            createdByName = license.createdByUser.fullName ?: license.createdByUser.username,
            verificationEvidence = license.verificationEvidence, verifiedByName = license.verifiedByUser?.fullName ?: license.verifiedByUser?.username,
            verifiedAt = license.verifiedAt, revocationReason = license.revocationReason,
            revocationDocumentReference = license.revocationDocumentReference, revokedAt = license.revokedAt, scopes = scopes,
        )
    }
}
