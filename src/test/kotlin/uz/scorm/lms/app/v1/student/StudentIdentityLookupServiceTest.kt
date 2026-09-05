package uz.scorm.lms.app.v1.student

import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import uz.scorm.lms.app.v1.hemis.model.CodeName
import uz.scorm.lms.app.v1.hemis.model.EducationYear
import uz.scorm.lms.app.v1.hemis.model.Faculty
import uz.scorm.lms.app.v1.hemis.model.Group
import uz.scorm.lms.app.v1.hemis.model.HemisStudent
import uz.scorm.lms.app.v1.hemis.model.Semester
import uz.scorm.lms.app.v1.hemis.service.HemisDirectoryClient
import uz.scorm.lms.app.v1.student.dto.StudentDto
import uz.scorm.lms.app.v1.student.dto.StudentLookupSource
import uz.scorm.lms.app.v1.student.model.StudentProfile
import uz.scorm.lms.app.v1.student.repository.StudentRepository
import uz.scorm.lms.app.v1.student.service.StudentIdentityLookupService
import uz.scorm.lms.app.v1.student.service.StudentService
import java.time.LocalDate
import java.time.ZoneId

class StudentIdentityLookupServiceTest {
    private val repository = mockk<StudentRepository>()
    private val studentService = mockk<StudentService>()
    private val hemisClient = mockk<HemisDirectoryClient>()
    private val service = StudentIdentityLookupService(repository, studentService, hemisClient)

    @Test
    fun `local student is returned without calling HEMIS`() {
        val profile = mockk<StudentProfile>()
        val dto = mockk<StudentDto>()
        every { repository.findByPinfl("12345678901234") } returns profile
        every { studentService.toDto(profile) } returns dto

        val result = service.lookup("12345678901234", null, null)

        assertEquals(StudentLookupSource.LOCAL, result.source)
        assertEquals(dto, result.localStudent)
        assertFalse(result.hemisChecked)
        assertFalse(result.manualEntryAllowed)
        verify(exactly = 0) { hemisClient.credentialsConfigured() }
    }

    @Test
    fun `passport input is normalized before local search`() {
        val profile = mockk<StudentProfile>()
        val dto = mockk<StudentDto>()
        every { repository.findByPassport("AA", "1234567") } returns listOf(profile)
        every { studentService.toDto(profile) } returns dto

        val result = service.lookup(null, "aa ", "123-4567")

        assertEquals(StudentLookupSource.LOCAL, result.source)
        verify { repository.findByPassport("AA", "1234567") }
    }

    @Test
    fun `HEMIS match is returned as a prefill candidate`() {
        val pinfl = "12345678901234"
        every { repository.findByPinfl(pinfl) } returns null
        every { hemisClient.credentialsConfigured() } returns true
        every { hemisClient.fetchStudentsByIdentity(pinfl) } returns listOf(hemisStudent(pinfl))

        val result = service.lookup(pinfl, null, null)

        assertEquals(StudentLookupSource.HEMIS, result.source)
        assertTrue(result.hemisChecked)
        assertTrue(result.manualEntryAllowed)
        assertEquals("Ali Valiyev", result.hemisStudent?.fullName)
        assertEquals("S-100", result.hemisStudent?.studentNumber)
    }

    @Test
    fun `manual entry is allowed when HEMIS is not configured`() {
        every { repository.findByPinfl("12345678901234") } returns null
        every { hemisClient.credentialsConfigured() } returns false

        val result = service.lookup("12345678901234", null, null)

        assertEquals(StudentLookupSource.NOT_FOUND, result.source)
        assertFalse(result.hemisChecked)
        assertTrue(result.manualEntryAllowed)
        verify(exactly = 0) { hemisClient.fetchStudentsByIdentity(any()) }
    }

    private fun hemisStudent(pinfl: String): HemisStudent {
        val code = CodeName("1", "Faol")
        return HemisStudent(
            id = 77,
            first_name = "Ali",
            second_name = "Valiyev",
            third_name = "Vali o'g'li",
            full_name = "Ali Valiyev",
            short_name = "A. Valiyev",
            university = "Test OTM",
            student_id_number = "S-100",
            pinfl = pinfl,
            passport_pin = pinfl,
            passport_number = "AA1234567",
            gender = CodeName("11", "Erkak"),
            image = null,
            birth_date = LocalDate.of(2002, 5, 10).atStartOfDay(ZoneId.of("Asia/Tashkent")).toEpochSecond(),
            email = "ali@example.uz",
            group = Group(3, "F-101", CodeName("uz", "O'zbek")),
            faculty = Faculty(2, "Fizika", "FIZ", 0, true, code, code),
            educationLang = CodeName("uz", "O'zbek"),
            semester = Semester(1, "1", "1-semestr", true, EducationYear("2026", "2026-2027", true)),
            specialty = CodeName("FIZ", "Fizika"),
            level = CodeName("11", "Bakalavr"),
            educationForm = CodeName("11", "Kunduzgi"),
            educationType = code,
            paymentForm = CodeName("11", "Grant"),
            studentStatus = code,
            country = CodeName("UZ", "O'zbekiston"),
            district = code,
            province = code,
            address = null,
            socialCategory = code,
            accommodation = code,
            validateUrl = null,
            hash = "hash",
        )
    }
}
