package uz.scorm.lms.app.v1.student

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.ActiveProfiles
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.group.model.Group
import uz.scorm.lms.app.v1.admission.model.AdmissionPolicyStatus
import uz.scorm.lms.app.v1.admission.model.ApprovalAuthorityType
import uz.scorm.lms.app.v1.admission.model.DistanceAdmissionPolicy
import uz.scorm.lms.app.v1.admission.model.InstitutionGovernanceType
import uz.scorm.lms.app.v1.admission.repository.DistanceAdmissionPolicyRepository
import uz.scorm.lms.app.v1.group.repository.GroupRepository
import uz.scorm.lms.app.v1.program.model.Program
import uz.scorm.lms.app.v1.program.repository.ProgramRepository
import uz.scorm.lms.app.v1.student.dto.StudentLifecycleRequest
import uz.scorm.lms.app.v1.student.dto.StudentAdmissionRequest
import uz.scorm.lms.app.v1.student.dto.StudentCreateRequest
import uz.scorm.lms.app.v1.student.dto.StudentUpdateRequest
import uz.scorm.lms.app.v1.student.dto.StudentRegistrationRequest
import uz.scorm.lms.app.v1.student.dto.StudentAcademicAdmissionRequest
import uz.scorm.lms.app.v1.student.dto.StudentPersonalProfileUpdateRequest
import uz.scorm.lms.app.v1.student.model.DegreeLevel
import uz.scorm.lms.app.v1.student.model.EducationForm
import uz.scorm.lms.app.v1.student.model.Gender
import uz.scorm.lms.app.v1.student.model.PaymentType
import uz.scorm.lms.app.v1.student.model.PassportType
import uz.scorm.lms.app.v1.student.model.StudentLifecycleEventType
import uz.scorm.lms.app.v1.student.model.StudentProfile
import uz.scorm.lms.app.v1.student.model.StudentStatus
import uz.scorm.lms.app.v1.student.repository.StudentRepository
import uz.scorm.lms.app.v1.student.service.StudentLifecycleService
import uz.scorm.lms.app.v1.student.service.StudentService
import uz.scorm.lms.app.v1.teacher.model.Teacher
import uz.scorm.lms.app.v1.teacher.repository.TeacherRepository
import uz.scorm.lms.app.v1.user.model.User
import uz.scorm.lms.app.v1.user.model.UserStatus
import uz.scorm.lms.app.v1.user.repository.UserRepository
import java.time.LocalDate
import java.time.Instant
import java.math.BigDecimal

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class StudentLifecycleWorkflowIntegrationTest {
    @Autowired private lateinit var lifecycleService: StudentLifecycleService
    @Autowired private lateinit var studentService: StudentService
    @Autowired private lateinit var studentRepository: StudentRepository
    @Autowired private lateinit var userRepository: UserRepository
    @Autowired private lateinit var programRepository: ProgramRepository
    @Autowired private lateinit var groupRepository: GroupRepository
    @Autowired private lateinit var teacherRepository: TeacherRepository
    @Autowired private lateinit var admissionPolicyRepository: DistanceAdmissionPolicyRepository

    @Test
    fun `shaxsiy kartochka va akademik qabul ikki alohida bosqichda bajariladi`() {
        val actor = user("two-step-registrar")
        val target = program("Kompyuter injiniringi", "60610500")
        val targetGroup = groupRepository.save(Group(name = "KI-26", educationYear = "2026-2027", language = "uz", program = target))
        val suffix = System.nanoTime().toString()

        val registered = studentService.register(StudentRegistrationRequest(
            pinfl = suffix.takeLast(14).padStart(14, '3'),
            lastName = "Saidov",
            firstName = "Bekzod",
            middleName = "Aziz o'g'li",
            birthDate = LocalDate.of(2003, 5, 6),
            gender = Gender.MALE,
            passportType = PassportType.ID_CARD,
            passportSeries = "aa",
            passportNumber = "1234567",
            passportIssuedDate = LocalDate.now().minusYears(2),
            passportExpiryDate = LocalDate.now().plusYears(8),
            passportIssuedBy = "Namangan IIB",
            phoneNumber = "+998 90 123 45 67",
            email = "BEKZOD@EXAMPLE.UZ",
            permanentRegion = "Namangan",
            permanentDistrict = "Namangan shahri",
            permanentAddress = "Istiqlol ko'chasi, 1-uy",
            studentNumber = "REG-$suffix",
            password = "Student@12345",
        ))

        assertEquals(StudentStatus.REGISTERED, registered.studentStatus)
        assertEquals(null, registered.programId)
        assertEquals(null, registered.groupId)
        assertEquals(null, registered.degreeLevel)
        assertEquals(null, registered.educationForm)
        assertEquals(null, registered.courseNumber)
        assertFalse(registered.accountEnabled)
        assertEquals("AA", registered.passportSeries)
        assertEquals("1234567", registered.passportNumber)
        assertEquals("bekzod@example.uz", registered.email)
        assertEquals("+998 90 123 45 67", registered.phoneNumber)
        assertTrue(lifecycleService.history(requireNotNull(registered.id)).isEmpty())

        val updated = studentService.updatePersonalProfile(requireNotNull(registered.id), StudentPersonalProfileUpdateRequest(
            lastName = "Saidov",
            firstName = "Bekzodbek",
            middleName = null,
            phoneNumber = null,
            email = "bekzodbek@example.uz",
            currentRegion = "Toshkent shahri",
            currentDistrict = "Yunusobod",
            currentAddress = "Amir Temur ko'chasi",
        ))
        assertEquals("Bekzodbek", updated.firstName)
        assertEquals(null, updated.middleName)
        assertEquals(null, updated.phoneNumber)
        assertEquals(null, updated.passportType)
        assertEquals("Toshkent shahri", updated.currentRegion)

        val admitted = lifecycleService.admitRegistered(
            requireNotNull(registered.id),
            StudentAcademicAdmissionRequest(
                facultyId = target.department?.faculty?.id,
                programId = requireNotNull(target.id),
                degreeLevel = DegreeLevel.BACHELOR,
                educationForm = EducationForm.FULL_TIME,
                educationLanguage = "uz",
                semesterNumber = 3,
                courseNumber = 2,
                groupId = requireNotNull(targetGroup.id),
                academicYear = "2026-2027",
                paymentType = PaymentType.CONTRACT,
                orderNumber = "QABUL-2B/2026",
                orderDate = LocalDate.now().minusDays(2),
                effectiveDate = LocalDate.now().minusDays(1),
                legalBasis = "Universitet qabul komissiyasining tasdiqlangan reglamenti",
                reason = "Talabani o'qishga qabul qilish bo'yicha komissiya qarori",
            ),
            requireNotNull(actor.id),
        )

        assertEquals(StudentStatus.ACTIVE, admitted.student.studentStatus)
        assertEquals(target.id, admitted.student.programId)
        assertEquals(targetGroup.id, admitted.student.groupId)
        assertEquals(3, admitted.student.semesterNumber)
        assertEquals(2, admitted.student.courseNumber)
        assertTrue(admitted.student.accountEnabled)
        assertEquals(StudentStatus.REGISTERED, admitted.event.fromStatus)
        assertEquals(StudentLifecycleEventType.ADMISSION, admitted.event.eventType)
    }

    @Test
    fun `qabul kaskadi boshqa o'quv yilidagi guruhni serverda rad etadi`() {
        val actor = user("cascade-registrar")
        val target = program("Axborot tizimlari", "60610100")
        val wrongYearGroup = groupRepository.save(Group(
            name = "AT-25", educationYear = "2025-2026", language = "uz", program = target,
        ))
        val suffix = System.nanoTime().toString()
        val registered = studentService.register(StudentRegistrationRequest(
            pinfl = suffix.takeLast(14).padStart(14, '7'),
            lastName = "Nosirov",
            firstName = "Nodir",
            birthDate = LocalDate.of(2004, 2, 3),
            gender = Gender.MALE,
            studentNumber = "CASCADE-$suffix",
            password = "Student@12345",
        ))

        val error = assertThrows<IllegalArgumentException> {
            lifecycleService.admitRegistered(
                requireNotNull(registered.id),
                StudentAcademicAdmissionRequest(
                    programId = requireNotNull(target.id),
                    degreeLevel = DegreeLevel.BACHELOR,
                    educationForm = EducationForm.FULL_TIME,
                    educationLanguage = "uz",
                    semesterNumber = 1,
                    courseNumber = 1,
                    groupId = requireNotNull(wrongYearGroup.id),
                    academicYear = "2026-2027",
                    orderNumber = "QABUL-CASCADE/2026",
                    orderDate = LocalDate.now().minusDays(2),
                    effectiveDate = LocalDate.now().minusDays(1),
                    legalBasis = "Universitet qabul komissiyasi reglamenti",
                    reason = "Akademik joylashuv mosligini tekshirish",
                ),
                requireNotNull(actor.id),
            )
        }
        assertTrue(error.message.orEmpty().contains("2026-2027 o'quv yiliga tegishli emas"))
    }

    @Test
    fun `personal kartochka noto'g'ri telefon va pasport sanasini rad etadi`() {
        val suffix = System.nanoTime().toString()
        assertThrows<IllegalArgumentException> {
            studentService.register(StudentRegistrationRequest(
                pinfl = suffix.takeLast(14).padStart(14, '4'),
                lastName = "Valiyev",
                firstName = "Vali",
                birthDate = LocalDate.of(2001, 1, 1),
                gender = Gender.MALE,
                phoneNumber = "telefon-emas",
                studentNumber = "BAD-PHONE-$suffix",
            ))
        }
        assertThrows<IllegalArgumentException> {
            studentService.register(StudentRegistrationRequest(
                pinfl = suffix.takeLast(14).padStart(14, '5'),
                lastName = "Aliyeva",
                firstName = "Aliya",
                birthDate = LocalDate.of(2001, 1, 1),
                gender = Gender.FEMALE,
                passportType = PassportType.ID_CARD,
                passportNumber = "1234567",
                passportIssuedDate = LocalDate.now(),
                passportExpiryDate = LocalDate.now().minusDays(1),
                studentNumber = "BAD-PASSPORT-$suffix",
            ))
        }
    }

    @Test
    fun `qabul buyruq dalili va ADMISSION hodisasi bilan atomar yaratiladi`() {
        val actor = user("admission-registrar")
        val suffix = System.nanoTime().toString()
        val request = StudentAdmissionRequest(
            student = StudentCreateRequest(
                pinfl = suffix.takeLast(14).padStart(14, '2'),
                lastName = "Rasulov",
                firstName = "Sardor",
                birthDate = LocalDate.of(2002, 3, 4),
                gender = Gender.MALE,
                studentNumber = "ADM-$suffix",
                educationForm = EducationForm.FULL_TIME,
                studentStatus = StudentStatus.ACTIVE,
                password = "Student@12345",
            ),
            orderNumber = "QABUL-12/2026-01",
            orderDate = LocalDate.now().minusDays(2),
            effectiveDate = LocalDate.now().minusDays(1),
            legalBasis = "Universitet qabul komissiyasining tasdiqlangan reglamenti",
            reason = "Qabul komissiyasining yakuniy tavsiyasi",
        )

        val admitted = lifecycleService.admit(request, requireNotNull(actor.id))

        assertEquals(StudentStatus.ACTIVE, admitted.student.studentStatus)
        assertEquals(request.orderNumber, admitted.student.admissionOrderNumber)
        assertEquals(request.effectiveDate, admitted.student.admissionDate)
        assertEquals(StudentLifecycleEventType.ADMISSION, admitted.event.eventType)
        assertEquals(null, admitted.event.fromStatus)
        assertEquals(StudentStatus.ACTIVE, admitted.event.toStatus)
        assertEquals(1, lifecycleService.history(requireNotNull(admitted.student.id)).size)
    }

    @Test
    fun `12-band status va transfer faqat buyruqli immutable lifecycle orqali bajariladi`() {
        val actor = user("registrar")
        teacherRepository.save(Teacher(fullName = "Faol pedagog", active = true))
        val source = program("Dasturiy injiniring", "60610400")
        val target = program("Axborot tizimlari", "60610200")
        approvedPolicy(target, actor)
        val targetGroup = groupRepository.save(Group(name = "AT-26", educationYear = "2026-2027", program = target))
        val student = student(source)

        val directStatus = assertThrows<IllegalArgumentException> {
            studentService.update(requireNotNull(student.id), StudentUpdateRequest(studentStatus = StudentStatus.EXPELLED))
        }
        assertTrue(directStatus.message.orEmpty().contains("lifecycle"))
        val directProgram = assertThrows<IllegalArgumentException> {
            studentService.update(requireNotNull(student.id), StudentUpdateRequest(programId = requireNotNull(target.id)))
        }
        assertTrue(directProgram.message.orEmpty().contains("TRANSFER"))
        val directEducationForm = assertThrows<IllegalArgumentException> {
            studentService.update(requireNotNull(student.id), StudentUpdateRequest(educationForm = EducationForm.FULL_TIME))
        }
        assertTrue(directEducationForm.message.orEmpty().contains("akademik lifecycle"))

        val suspended = lifecycleService.transition(
            requireNotNull(student.id),
            request(StudentLifecycleEventType.SUSPENSION, "BUY-12/2026-01", "Talabaning akademik ta'til arizasi"),
            requireNotNull(actor.id),
        )
        assertEquals(StudentStatus.SUSPENDED, suspended.student.studentStatus)
        assertFalse(suspended.student.accountEnabled)

        val transferred = lifecycleService.transition(
            requireNotNull(student.id),
            request(StudentLifecycleEventType.TRANSFER, "BUY-12/2026-02", "Boshqa dasturga ko'chirish komissiyasi qarori").copy(
                targetProgramId = requireNotNull(target.id),
                targetGroupId = requireNotNull(targetGroup.id),
                academicYear = "2026-2027",
            ),
            requireNotNull(actor.id),
        )
        assertEquals(StudentStatus.SUSPENDED, transferred.student.studentStatus)
        assertEquals(target.id, transferred.student.programId)
        assertEquals(targetGroup.id, transferred.student.groupId)

        target.name = "Keyin o'zgargan nom"
        programRepository.saveAndFlush(target)
        val history = lifecycleService.history(requireNotNull(student.id))
        assertEquals(2, history.size)
        assertEquals("Axborot tizimlari", history.first().toProgramName)
        assertEquals("BUY-12/2026-02", history.first().orderNumber)

        val reinstated = lifecycleService.transition(
            requireNotNull(student.id),
            request(StudentLifecycleEventType.REINSTATEMENT, "BUY-12/2026-03", "Akademik ta'tildan qaytish bo'yicha komissiya qarori"),
            requireNotNull(actor.id),
        )
        assertEquals(StudentStatus.ACTIVE, reinstated.student.studentStatus)
        assertTrue(reinstated.student.accountEnabled)
        assertEquals(3, lifecycleService.history(requireNotNull(student.id)).size)
    }

    @Test
    fun `noto'g'ri transition sana va begona guruh serverda bloklanadi`() {
        val actor = user("registrar-negative")
        val source = program("Iqtisodiyot", "60410100")
        val target = program("Moliya", "60410200")
        val foreign = program("Marketing", "60411200")
        val foreignGroup = groupRepository.save(Group(name = "MK-26", educationYear = "2026-2027", program = foreign))
        val student = student(source)

        assertThrows<IllegalArgumentException> {
            lifecycleService.transition(
                requireNotNull(student.id),
                request(StudentLifecycleEventType.REINSTATEMENT, "BUY-12/2026-10", "Asossiz qayta tiklash urinish"),
                requireNotNull(actor.id),
            )
        }
        assertThrows<IllegalArgumentException> {
            lifecycleService.transition(
                requireNotNull(student.id),
                request(StudentLifecycleEventType.TRANSFER, "BUY-12/2026-11", "Boshqa dasturga ko'chirish qarori").copy(
                    targetProgramId = requireNotNull(target.id),
                    targetGroupId = requireNotNull(foreignGroup.id),
                ),
                requireNotNull(actor.id),
            )
        }
        assertThrows<IllegalArgumentException> {
            lifecycleService.transition(
                requireNotNull(student.id),
                request(StudentLifecycleEventType.EXPULSION, "BUY-12/2026-12", "Komissiya chetlashtirish qarori").copy(
                    orderDate = LocalDate.now(),
                    effectiveDate = LocalDate.now().minusDays(1),
                ),
                requireNotNull(actor.id),
            )
        }
        assertEquals(StudentStatus.ACTIVE, studentRepository.findById(requireNotNull(student.id)).orElseThrow().studentStatus)
        assertTrue(lifecycleService.history(requireNotNull(student.id)).isEmpty())
    }

    private fun request(type: StudentLifecycleEventType, order: String, reason: String) = StudentLifecycleRequest(
        eventType = type,
        orderNumber = order,
        orderDate = LocalDate.now().minusDays(2),
        effectiveDate = LocalDate.now().minusDays(1),
        legalBasis = "559-son qaror 12-bandi va universitet talabalar harakati reglamenti",
        reason = reason,
    )

    private fun program(name: String, code: String) = programRepository.save(Program(
        name = name,
        code = "$code-${System.nanoTime()}",
        degreeLevel = "BACHELOR",
        active = true,
        distanceEnabled = true,
        educationLanguage = "uz",
        distanceAdmissionLimit = 300,
        licenseReference = "LIC-12/2026",
        fullTimeDurationMonths = 48,
        distanceDurationMonths = 48,
        fullTimeAvailable = true,
        fullTimeBasisReference = "BUYRUQ-3/2026",
    ))

    private fun student(program: Program): StudentProfile {
        val login = user("student")
        return studentRepository.save(StudentProfile(
            user = login,
            pinfl = "${System.nanoTime()}".takeLast(14).padStart(14, '1'),
            lastName = "Karimov",
            firstName = "Ali",
            birthDate = LocalDate.of(2000, 1, 1),
            gender = Gender.MALE,
            studentNumber = "ST-12-${System.nanoTime()}",
            programId = program.id,
            degreeLevel = DegreeLevel.BACHELOR,
            educationForm = EducationForm.DISTANCE,
            educationLanguage = "uz",
            paymentType = PaymentType.CONTRACT,
            academicYear = "2026-2027",
            contractAmount = BigDecimal("12000000.00"),
            studentStatus = StudentStatus.ACTIVE,
        ))
    }

    private fun approvedPolicy(program: Program, actor: User) = admissionPolicyRepository.save(DistanceAdmissionPolicy(
        program = program,
        academicYear = "2026-2027",
        versionCode = "POL-${System.nanoTime()}",
        institutionGovernanceType = InstitutionGovernanceType.STATE_FINANCIALLY_AUTONOMOUS,
        approvalAuthorityType = ApprovalAuthorityType.SUPERVISORY_BOARD,
        institutionName = "Test universiteti",
        approvingAuthorityName = "Ta'sischi",
        admissionQuota = 300,
        contractAmount = BigDecimal("12000000.00"),
        status = AdmissionPolicyStatus.APPROVED,
        createdByUser = actor,
        approvalDocumentNumber = "Q-15/2026",
        approvalDocumentDate = LocalDate.now().minusDays(3),
        approvalDocumentReference = "Qabul komissiyasi reestri",
        approvedAt = Instant.now(),
        approvedByUser = actor,
    ))

    private fun user(prefix: String) = userRepository.save(User(
        username = "$prefix-${System.nanoTime()}",
        password = "encoded-password",
        fullName = "Registrator xodimi",
        status = UserStatus.ACTIVE,
    ))
}
