package uz.scorm.lms.app.v1.admission

import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import uz.scorm.lms.app.v1.admission.dto.ApproveDistanceAdmissionPolicyRequest
import uz.scorm.lms.app.v1.admission.dto.SaveDistanceAdmissionPolicyRequest
import uz.scorm.lms.app.v1.admission.model.AdmissionPolicyStatus
import uz.scorm.lms.app.v1.admission.model.ApprovalAuthorityType
import uz.scorm.lms.app.v1.admission.model.DistanceAdmissionPolicy
import uz.scorm.lms.app.v1.admission.model.InstitutionGovernanceType
import uz.scorm.lms.app.v1.admission.repository.DistanceAdmissionPolicyRepository
import uz.scorm.lms.app.v1.admission.service.DistanceAdmissionPolicyService
import uz.scorm.lms.app.v1.audit.service.AuditService
import uz.scorm.lms.app.v1.license.model.NonStateLicenseStatus
import uz.scorm.lms.app.v1.license.repository.NonStateLicenseProgramScopeRepository
import uz.scorm.lms.app.v1.program.model.Program
import uz.scorm.lms.app.v1.program.repository.ProgramRepository
import uz.scorm.lms.app.v1.user.model.User
import uz.scorm.lms.app.v1.user.repository.UserRepository
import uz.scorm.lms.app.v1.restriction.service.DistanceProgramRestrictionService
import java.math.BigDecimal
import java.time.LocalDate
import java.util.Optional

class DistanceAdmissionPolicyServiceTest {
    private val repository = mockk<DistanceAdmissionPolicyRepository>()
    private val programRepository = mockk<ProgramRepository>()
    private val userRepository = mockk<UserRepository>()
    private val auditService = mockk<AuditService>(relaxed = true)
    private val licenseScopeRepository = mockk<NonStateLicenseProgramScopeRepository>()
    private val restrictionService = mockk<DistanceProgramRestrictionService>()
    private val service = DistanceAdmissionPolicyService(repository, programRepository, userRepository, auditService, licenseScopeRepository, restrictionService)
    private val author = User(username = "author", password = "x").apply { id = 1 }
    private val approver = User(username = "approver", password = "x").apply { id = 2 }

    @BeforeEach
    fun defaults() {
        every { programRepository.findById(10) } returns Optional.of(program())
        every { programRepository.findByIdForUpdate(10) } returns program()
        every { userRepository.findById(1) } returns Optional.of(author)
        every { userRepository.findById(2) } returns Optional.of(approver)
        every { repository.existsByProgramIdAndAcademicYearAndVersionCodeAndDeletedFalse(any(), any(), any()) } returns false
        every { repository.existsByProgramIdAndAcademicYearAndStatusAndDeletedFalse(any(), any(), any()) } returns false
        every { repository.save(any()) } answers { firstArg<DistanceAdmissionPolicy>().apply { if (id == null) id = 77 } }
        every { licenseScopeRepository.existsEffectiveCoverage(any(), NonStateLicenseStatus.VERIFIED, any()) } returns true
        every { restrictionService.requireAllowed(any(), any(), any(), any()) } returns Unit
    }

    @Test
    fun `OTM turi tasdiqlovchi vakolatga qat'iy mos keladi`() {
        val error = assertThrows<IllegalArgumentException> {
            service.create(request(approvalAuthorityType = ApprovalAuthorityType.FOUNDER), 1)
        }
        assertTrue(error.message.orEmpty().contains("mos tasdiqlovchi"))
    }

    @Test
    fun `oddiy davlat OTM uchun ikki vazirlik kelishuvi majburiy`() {
        val error = assertThrows<IllegalArgumentException> {
            service.create(request(economyMinistryAgreementReference = null), 1)
        }
        assertTrue(error.message.orEmpty().contains("kelishuv rekvizitlari"))
    }

    @Test
    fun `bakalavriat qabul parametri 300 dan oshmaydi`() {
        val error = assertThrows<IllegalArgumentException> { service.create(request(admissionQuota = 301), 1) }
        assertTrue(error.message.orEmpty().contains("300 nafar"))
    }

    @Test
    fun `muallif tasdiqlay olmaydi va boshqa aktor hujjat bilan tasdiqlaydi`() {
        val policy = policy()
        every { repository.findByIdAndDeletedFalse(77) } returns policy
        val approval = ApproveDistanceAdmissionPolicyRequest("Q-17", LocalDate.now(), "Reestr-17")
        assertThrows<IllegalArgumentException> { service.approve(77, approval, 1) }

        val result = service.approve(77, approval, 2)
        assertEquals("APPROVED", result.status)
        assertEquals("Q-17", result.approvalDocumentNumber)
        verify { auditService.logAction("DISTANCE_ADMISSION_POLICY_APPROVED", 2, any()) }
    }

    @Test
    fun `taqiqlangan dastur uchun qabul siyosati tasdiqlanmaydi`() {
        val policy = policy()
        every { repository.findByIdAndDeletedFalse(77) } returns policy
        every { restrictionService.requireAllowed(any(), any(), any(), any()) } throws
            IllegalArgumentException("LAW-601 masofaviy shaklda taqiqlangan")

        val error = assertThrows<IllegalArgumentException> {
            service.approve(77, ApproveDistanceAdmissionPolicyRequest("Q-18", LocalDate.now(), "Reestr-18"), 2)
        }

        assertTrue(error.message.orEmpty().contains("taqiqlangan"))
    }

    @Test
    fun `nodavlat OTM siyosati litsenziyada dastur qamrovisiz tasdiqlanmaydi`() {
        val policy = policy().apply { institutionGovernanceType = InstitutionGovernanceType.NON_STATE }
        every { repository.findByIdAndDeletedFalse(77) } returns policy
        every { licenseScopeRepository.existsEffectiveCoverage(10, NonStateLicenseStatus.VERIFIED, any()) } returns false

        val error = assertThrows<IllegalArgumentException> {
            service.approve(77, ApproveDistanceAdmissionPolicyRequest("Q-18", LocalDate.now(), "Reestr-18"), 2)
        }

        assertTrue(error.message.orEmpty().contains("litsenziyada qayd etilmagan"))
    }

    private fun program() = Program(
        name = "Dastur", degreeLevel = "BACHELOR", active = true, distanceEnabled = true,
        licenseReference = "L-1", fullTimeDurationMonths = 48, distanceDurationMonths = 48,
        fullTimeAvailable = true, fullTimeBasisReference = "BUYRUQ-3/2026",
    ).apply { id = 10 }

    private fun request(
        approvalAuthorityType: ApprovalAuthorityType = ApprovalAuthorityType.SUBORDINATE_MINISTRY_AGENCY,
        admissionQuota: Int = 300,
        economyMinistryAgreementReference: String? = "IQV-2",
    ) = SaveDistanceAdmissionPolicyRequest(
        programId = 10, academicYear = "2026-2027", versionCode = "V1",
        institutionGovernanceType = InstitutionGovernanceType.STATE_STANDARD,
        approvalAuthorityType = approvalAuthorityType, institutionName = "OTM", approvingAuthorityName = "Vazirlik",
        admissionQuota = admissionQuota, contractAmount = BigDecimal("12000000.00"),
        higherEducationMinistryAgreementReference = "OO'MTV-1", economyMinistryAgreementReference = economyMinistryAgreementReference,
    )

    private fun policy() = DistanceAdmissionPolicy(
        program = program(), academicYear = "2026-2027", versionCode = "V1",
        institutionGovernanceType = InstitutionGovernanceType.STATE_STANDARD,
        approvalAuthorityType = ApprovalAuthorityType.SUBORDINATE_MINISTRY_AGENCY,
        institutionName = "OTM", approvingAuthorityName = "Vazirlik", admissionQuota = 300,
        contractAmount = BigDecimal("12000000.00"), higherEducationMinistryAgreementReference = "OO'MTV-1",
        economyMinistryAgreementReference = "IQV-2", status = AdmissionPolicyStatus.DRAFT, createdByUser = author,
    ).apply { id = 77 }
}
