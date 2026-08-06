package uz.scorm.lms.app.v1.student

import io.mockk.every
import io.mockk.mockk
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import uz.scorm.lms.app.v1.program.model.Program
import uz.scorm.lms.app.v1.program.repository.ProgramRepository
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
import java.time.LocalDate
import java.util.Optional

class StudentServiceDecision559Test {

    private val studentRepository = mockk<StudentRepository>()
    private val userService = mockk<UserService>()
    private val programRepository = mockk<ProgramRepository>()
    private val teacherRepository = mockk<TeacherRepository>()
    private val service = StudentService(studentRepository, userService, programRepository, teacherRepository)

    @BeforeEach
    fun defaults() {
        every { studentRepository.existsByPinfl(any()) } returns false
        every { studentRepository.existsByStudentNumber(any()) } returns false
        every { programRepository.findById(1) } returns Optional.of(program())
        every {
            studentRepository.countByProgramIdAndEducationFormAndStudentStatusAndCitizenship(
                1, EducationForm.DISTANCE, StudentStatus.ACTIVE, Citizenship.UZBEKISTAN,
            )
        } returns 0
        every { studentRepository.countByEducationFormAndStudentStatus(EducationForm.DISTANCE, StudentStatus.ACTIVE) } returns 0
        every { teacherRepository.countByActiveTrue() } returns 1
        every { userService.register(any(), any(), "student") } answers {
            User(username = firstArg(), password = "encoded")
        }
        every { studentRepository.save(any()) } answers {
            firstArg<StudentProfile>().apply { id = 100 }
        }
    }

    @Test
    fun `bakalavriatdagi 300-chi mavjud talabadan keyin qabul bloklanadi`() {
        every {
            studentRepository.countByProgramIdAndEducationFormAndStudentStatusAndCitizenship(
                1, EducationForm.DISTANCE, StudentStatus.ACTIVE, Citizenship.UZBEKISTAN,
            )
        } returns 300

        val error = assertThrows<IllegalArgumentException> { service.create(request()) }

        assertTrue(error.message.orEmpty().contains("limiti (300) to'lgan"))
    }

    @Test
    fun `magistraturada 30-chi talaba qabul qilinadi`() {
        every { programRepository.findById(1) } returns Optional.of(program(
            degreeLevel = "MASTER",
            admissionLimit = 30,
        ))
        every {
            studentRepository.countByProgramIdAndEducationFormAndStudentStatusAndCitizenship(
                1, EducationForm.DISTANCE, StudentStatus.ACTIVE, Citizenship.UZBEKISTAN,
            )
        } returns 29

        val created = service.create(request(degreeLevel = DegreeLevel.MASTER))

        assertEquals(100, created.id)
    }

    @Test
    fun `IT yonalishida qabul soni limiti qollanmaydi`() {
        every { programRepository.findById(1) } returns Optional.of(program(informationTechnology = true))
        every { studentRepository.countByEducationFormAndStudentStatus(EducationForm.DISTANCE, StudentStatus.ACTIVE) } returns 500
        every { teacherRepository.countByActiveTrue() } returns 11

        val created = service.create(request())

        assertEquals(100, created.id)
    }

    @Test
    fun `xorijiy talaba mahalliy qabul limitiga kirmaydi`() {
        every {
            studentRepository.countByProgramIdAndEducationFormAndStudentStatusAndCitizenship(
                1, EducationForm.DISTANCE, StudentStatus.ACTIVE, Citizenship.UZBEKISTAN,
            )
        } returns 300

        val created = service.create(request(citizenship = Citizenship.OTHER))

        assertEquals(100, created.id)
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

    private fun program(
        degreeLevel: String = "BACHELOR",
        admissionLimit: Int? = 300,
        informationTechnology: Boolean = false,
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
    ).apply { id = 1 }

    private fun request(
        degreeLevel: DegreeLevel = DegreeLevel.BACHELOR,
        citizenship: Citizenship = Citizenship.UZBEKISTAN,
        paymentType: PaymentType = PaymentType.CONTRACT,
        educationLanguage: String = "uz",
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
        password = "Student@12345",
    )
}
