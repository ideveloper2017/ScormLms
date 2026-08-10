package uz.scorm.lms.app.v1.student

import io.mockk.every
import io.mockk.mockk
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import uz.scorm.lms.app.v1.program.model.Program
import uz.scorm.lms.app.v1.program.repository.ProgramRepository
import uz.scorm.lms.app.v1.admission.model.AdmissionPolicyStatus
import uz.scorm.lms.app.v1.admission.model.ApprovalAuthorityType
import uz.scorm.lms.app.v1.admission.model.DistanceAdmissionPolicy
import uz.scorm.lms.app.v1.admission.model.InstitutionGovernanceType
import uz.scorm.lms.app.v1.admission.repository.DistanceAdmissionPolicyRepository
import uz.scorm.lms.app.v1.license.model.NonStateLicenseStatus
import uz.scorm.lms.app.v1.license.repository.NonStateLicenseProgramScopeRepository
import uz.scorm.lms.app.v1.student.dto.StudentCreateRequest
import uz.scorm.lms.app.v1.student.model.Citizenship
import uz.scorm.lms.app.v1.student.model.DegreeLevel
import uz.scorm.lms.app.v1.student.model.EducationForm
import uz.scorm.lms.app.v1.student.model.Gender
import uz.scorm.lms.app.v1.student.model.PaymentType
import uz.scorm.lms.app.v1.student.model.StudentProfile
import uz.scorm.lms.app.v1.student.model.StudentStatus
import uz.scorm.lms.app.v1.student.repository.StudentRepository
import uz.scorm.lms.app.v1.student.service.StudentService
import uz.scorm.lms.app.v1.teacher.repository.TeacherRepository
import uz.scorm.lms.app.v1.user.model.User
import uz.scorm.lms.app.v1.user.service.UserService
import uz.scorm.lms.app.v1.restriction.service.DistanceProgramRestrictionService
import uz.scorm.lms.app.v1.audit.service.AuditService
import uz.scorm.lms.app.v1.classifier.service.GeographyClassifierService
import java.time.LocalDate
import java.math.BigDecimal
import java.util.Optional

class StudentServiceDecision559Test {

    private val studentRepository = mockk<StudentRepository>()
    private val userService = mockk<UserService>()
    private val programRepository = mockk<ProgramRepository>()
    private val teacherRepository = mockk<TeacherRepository>()
    private val admissionPolicyRepository = mockk<DistanceAdmissionPolicyRepository>()
    private val licenseScopeRepository = mockk<NonStateLicenseProgramScopeRepository>()
    private val restrictionService = mockk<DistanceProgramRestrictionService>()
    private val auditService = mockk<AuditService>(relaxed = true)
    private val classifierService = mockk<GeographyClassifierService>(relaxed = true)
    private val service = StudentService(studentRepository, userService, programRepository, teacherRepository, admissionPolicyRepository, licenseScopeRepository, restrictionService, auditService, classifierService)

    @BeforeEach
    fun defaults() {
        every { studentRepository.existsByPinfl(any()) } returns false
        every { studentRepository.existsByStudentNumber(any()) } returns false
        every { programRepository.findById(1) } returns Optional.of(program())
        every {
            studentRepository.countByProgramIdAndAcademicYearAndEducationFormAndCitizenship(
                1, "2026-2027", EducationForm.DISTANCE, Citizenship.UZBEKISTAN,
            )
        } returns 0
        every {
            studentRepository.countByProgramIdAndAcademicYearAndEducationForm(
                1, "2026-2027", EducationForm.DISTANCE,
            )
        } returns 0
        every {
            admissionPolicyRepository.findByProgramIdAndAcademicYearAndStatusAndDeletedFalse(
                1, "2026-2027", AdmissionPolicyStatus.APPROVED,
            )
        } returns policy()
        every { studentRepository.countByEducationFormAndStudentStatus(EducationForm.DISTANCE, StudentStatus.ACTIVE) } returns 0
        every { teacherRepository.countByActiveTrue() } returns 1
        every { licenseScopeRepository.existsEffectiveCoverage(1, NonStateLicenseStatus.VERIFIED, any()) } returns true
        every { restrictionService.requireAllowed(any(), any(), any(), any()) } returns Unit
        every { userService.register(any(), any(), "student") } answers {
            User(username = firstArg(), password = "encoded")
        }
        every { studentRepository.save(any()) } answers {
            firstArg<StudentProfile>().apply { id = 100 }
        }
    }

    @Test
    fun `nodavlat OTM masofaviy qabulida amaldagi litsenziya qamrovi majburiy`() {
        every { licenseScopeRepository.existsEffectiveCoverage(1, NonStateLicenseStatus.VERIFIED, any()) } returns false

        val error = assertThrows<IllegalArgumentException> { service.create(request()) }

        assertTrue(error.message.orEmpty().contains("litsenziyada qayd etilmagan"))
    }

    @Test
    fun `taqiqlangan dasturga masofaviy qabul bloklanadi`() {
        every { restrictionService.requireAllowed(any(), any(), any(), any()) } throws
            IllegalArgumentException("LAW-601 masofaviy shaklda taqiqlangan")

        val error = assertThrows<IllegalArgumentException> { service.create(request()) }

        assertTrue(error.message.orEmpty().contains("taqiqlangan"))
    }

    @Test
    fun `bakalavriatdagi 300-chi mavjud talabadan keyin qabul bloklanadi`() {
        every {
            studentRepository.countByProgramIdAndAcademicYearAndEducationForm(
                1, "2026-2027", EducationForm.DISTANCE,
            )
        } returns 300

        val error = assertThrows<IllegalArgumentException> { service.create(request()) }

        assertTrue(error.message.orEmpty().contains("qabul parametri (300) to'lgan"))
    }

    @Test
    fun `magistraturada 30-chi talaba qabul qilinadi`() {
        every { programRepository.findById(1) } returns Optional.of(program(
            degreeLevel = "MASTER",
            admissionLimit = 30,
        ))
        every {
            admissionPolicyRepository.findByProgramIdAndAcademicYearAndStatusAndDeletedFalse(
                1, "2026-2027", AdmissionPolicyStatus.APPROVED,
            )
        } returns policy(quota = 30)
        every {
            studentRepository.countByProgramIdAndAcademicYearAndEducationFormAndCitizenship(
                1, "2026-2027", EducationForm.DISTANCE, Citizenship.UZBEKISTAN,
            )
        } returns 29
        every {
            studentRepository.countByProgramIdAndAcademicYearAndEducationForm(
                1, "2026-2027", EducationForm.DISTANCE,
            )
        } returns 29

        val created = service.create(request(degreeLevel = DegreeLevel.MASTER))

        assertEquals(100, created.id)
        assertTrue(created.lmsOrientationRequired)
    }

    @Test
    fun `IT yonalishida qabul soni limiti qollanmaydi`() {
        every { programRepository.findById(1) } returns Optional.of(program(informationTechnology = true))
        every {
            admissionPolicyRepository.findByProgramIdAndAcademicYearAndStatusAndDeletedFalse(
                1, "2026-2027", AdmissionPolicyStatus.APPROVED,
            )
        } returns policy(quota = 1000)
        every {
            studentRepository.countByProgramIdAndAcademicYearAndEducationForm(
                1, "2026-2027", EducationForm.DISTANCE,
            )
        } returns 500
        every { studentRepository.countByEducationFormAndStudentStatus(EducationForm.DISTANCE, StudentStatus.ACTIVE) } returns 500
        every { teacherRepository.countByActiveTrue() } returns 11

        val created = service.create(request())

        assertEquals(100, created.id)
    }

    @Test
    fun `xorijiy talaba mahalliy qabul limitiga kirmaydi`() {
        every {
            studentRepository.countByProgramIdAndAcademicYearAndEducationFormAndCitizenship(
                1, "2026-2027", EducationForm.DISTANCE, Citizenship.UZBEKISTAN,
            )
        } returns 300

        val created = service.create(request(citizenship = Citizenship.OTHER))

        assertEquals(100, created.id)
        assertFalse(created.lmsOrientationRequired)
    }

    @Test
    fun `masofaviy talaba faqat kontrakt asosida qabul qilinadi`() {
        val error = assertThrows<IllegalArgumentException> {
            service.create(request(paymentType = PaymentType.GRANT))
        }

        assertTrue(error.message.orEmpty().contains("to'lov-kontrakt"))
    }

    @Test
    fun `bir oqituvchiga 50 talabadan oshadigan qabul bloklanadi`() {
        every { studentRepository.countByEducationFormAndStudentStatus(EducationForm.DISTANCE, StudentStatus.ACTIVE) } returns 50
        every { teacherRepository.countByActiveTrue() } returns 1

        val error = assertThrows<IllegalArgumentException> { service.create(request()) }

        assertTrue(error.message.orEmpty().contains("1:50"))
    }

    @Test
    fun `bir oqituvchiga 50-chi talaba qabul qilinadi`() {
        every { studentRepository.countByEducationFormAndStudentStatus(EducationForm.DISTANCE, StudentStatus.ACTIVE) } returns 49

        val created = service.create(request())

        assertEquals(100, created.id)
    }

    @Test
    fun `kontent tili talaba talim tiliga mos bolishi shart`() {
        val error = assertThrows<IllegalArgumentException> {
            service.create(request(educationLanguage = "ru"))
        }

        assertTrue(error.message.orEmpty().contains("kontenti tili"))
    }

    @Test
    fun `davomiyligi qisqa masofaviy dasturga qabul bloklanadi`() {
        every { programRepository.findById(1) } returns Optional.of(program(
            fullTimeDurationMonths = 48,
            distanceDurationMonths = 36,
        ))

        val error = assertThrows<IllegalArgumentException> { service.create(request()) }

        assertTrue(error.message.orEmpty().contains("kunduzgi ta'limdan kam bo'lmasligi"))
    }

    @Test
    fun `kunduzgi shakl dalilisiz oddiy masofaviy dasturga qabul bloklanadi`() {
        every { programRepository.findById(1) } returns Optional.of(program(
            fullTimeAvailable = false,
            fullTimeBasisReference = null,
        ))

        val error = assertThrows<IllegalArgumentException> { service.create(request()) }

        assertTrue(error.message.orEmpty().contains("3-band"))
    }

    @Test
    fun `tasdiqlangan qabul siyosatisiz masofaviy qabul bloklanadi`() {
        every {
            admissionPolicyRepository.findByProgramIdAndAcademicYearAndStatusAndDeletedFalse(
                1, "2026-2027", AdmissionPolicyStatus.APPROVED,
            )
        } returns null

        val error = assertThrows<IllegalArgumentException> { service.create(request()) }
        assertTrue(error.message.orEmpty().contains("15-bandiga muvofiq tasdiqlangan"))
    }

    @Test
    fun `talaba kontrakti tasdiqlangan qiymatga aynan mos bolishi shart`() {
        val error = assertThrows<IllegalArgumentException> {
            service.create(request(contractAmount = BigDecimal("11999999.99")))
        }
        assertTrue(error.message.orEmpty().contains("tasdiqlangan qabul siyosatidagi"))
    }

    private fun program(
        degreeLevel: String = "BACHELOR",
        admissionLimit: Int? = 300,
        informationTechnology: Boolean = false,
        fullTimeDurationMonths: Int = 48,
        distanceDurationMonths: Int = 48,
        fullTimeAvailable: Boolean = true,
        fullTimeBasisReference: String? = "BUYRUQ-3/2026",
    ) = Program(
        name = "Dasturiy injiniring",
        code = "60610400",
        degreeLevel = degreeLevel,
        active = true,
        distanceEnabled = true,
        informationTechnologyProgram = informationTechnology,
        educationLanguage = "uz",
        distanceAdmissionLimit = admissionLimit,
        licenseReference = "L-123",
        fullTimeDurationMonths = fullTimeDurationMonths,
        distanceDurationMonths = distanceDurationMonths,
        fullTimeAvailable = fullTimeAvailable,
        fullTimeBasisReference = fullTimeBasisReference,
    ).apply { id = 1 }

    private fun request(
        degreeLevel: DegreeLevel = DegreeLevel.BACHELOR,
        citizenship: Citizenship = Citizenship.UZBEKISTAN,
        paymentType: PaymentType = PaymentType.CONTRACT,
        educationLanguage: String = "uz",
        contractAmount: BigDecimal = BigDecimal("12000000.00"),
    ) = StudentCreateRequest(
        pinfl = "12345678901234",
        lastName = "Karimov",
        firstName = "Ali",
        birthDate = LocalDate.of(2000, 1, 1),
        gender = Gender.MALE,
        citizenship = citizenship,
        studentNumber = "S-001",
        programId = 1,
        degreeLevel = degreeLevel,
        educationForm = EducationForm.DISTANCE,
        educationLanguage = educationLanguage,
        paymentType = paymentType,
        academicYear = "2026-2027",
        contractAmount = contractAmount,
        password = "Student@12345",
    )

    private fun policy(quota: Int = 300) = DistanceAdmissionPolicy(
        program = program(), academicYear = "2026-2027", versionCode = "V1",
        institutionGovernanceType = InstitutionGovernanceType.NON_STATE,
        approvalAuthorityType = ApprovalAuthorityType.FOUNDER,
        institutionName = "Test universiteti", approvingAuthorityName = "Ta'sischi",
        admissionQuota = quota, contractAmount = BigDecimal("12000000.00"),
        status = AdmissionPolicyStatus.APPROVED, createdByUser = User(username = "author", password = "x"),
    ).apply { id = 9 }
}
