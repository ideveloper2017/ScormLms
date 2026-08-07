package uz.scorm.lms.app.v1.practice

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.ActiveProfiles
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.practice.dto.CompleteStudentPracticeRequest
import uz.scorm.lms.app.v1.practice.dto.SaveStudentPracticeRequest
import uz.scorm.lms.app.v1.practice.model.PracticePlacementBasis
import uz.scorm.lms.app.v1.practice.service.StudentPracticeService
import uz.scorm.lms.app.v1.student.model.EducationForm
import uz.scorm.lms.app.v1.student.model.Gender
import uz.scorm.lms.app.v1.student.model.StudentProfile
import uz.scorm.lms.app.v1.student.repository.StudentRepository
import uz.scorm.lms.app.v1.user.model.User
import uz.scorm.lms.app.v1.user.repository.UserRepository
import java.time.LocalDate

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class StudentPracticeWorkflowIntegrationTest {
    @Autowired private lateinit var service: StudentPracticeService
    @Autowired private lateinit var userRepository: UserRepository
    @Autowired private lateinit var studentRepository: StudentRepository

    @Test
    fun `23-band mos ish joyini tasdiqlash va yakunlashni talab qiladi`() {
        val actor = user("practice-staff")
        val student = student("practice-worker")

        val invalid = assertThrows<IllegalArgumentException> {
            service.create(workplaceRequest(requireNotNull(student.id), specialtyMatch = false), requireNotNull(actor.id))
        }
        assertTrue(invalid.message.orEmpty().contains("mosligi tasdiqlanishi"))

        val created = service.create(workplaceRequest(requireNotNull(student.id)), requireNotNull(actor.id))
        assertEquals("DRAFT", created.status)
        assertTrue(created.ruleCompliant)
        assertEquals("CURRENT_WORKPLACE", created.placementBasis)

        val approved = service.approve(created.id, requireNotNull(actor.id))
        assertEquals("APPROVED", approved.status)
        assertNotNull(approved.approvedAt)

        val completed = service.complete(created.id, CompleteStudentPracticeRequest(
            summary = "Talaba o'quv rejasida belgilangan barcha amaliy vazifalarni ish joyida to'liq bajardi.",
            evidenceReference = "PRACTICE-REPORT/2026/001",
        ), requireNotNull(actor.id))
        assertEquals("COMPLETED", completed.status)
        assertNotNull(completed.completedAt)
        assertEquals(1, service.mine(requireNotNull(student.user.id)).size)
    }

    @Test
    fun `ishlamaydigan yoki nomos ish joyidagi talaba uchun OTM kelishuvi majburiy`() {
        val actor = user("practice-partner-staff")
        val student = student("practice-partner-student")
        val request = partnerRequest(requireNotNull(student.id))

        val missingAgreement = assertThrows<IllegalArgumentException> {
            service.create(request.copy(agreementNumber = null), requireNotNull(actor.id))
        }
        assertTrue(missingAgreement.message.orEmpty().contains("kelishuv raqami"))

        val created = service.create(request, requireNotNull(actor.id))
        assertTrue(created.ruleCompliant)
        assertEquals("PARTNER_ORGANIZATION", created.placementBasis)
        assertEquals("KEL-23/2026-17", created.agreementNumber)
    }

    private fun workplaceRequest(studentId: Long, specialtyMatch: Boolean = true) = SaveStudentPracticeRequest(
        studentId = studentId,
        academicYear = "2025-2026",
        planReference = "O'R-2025/17, 8-semestr ishlab chiqarish amaliyoti",
        startsOn = LocalDate.of(2026, 6, 1),
        endsOn = LocalDate.of(2026, 7, 15),
        placementBasis = PracticePlacementBasis.CURRENT_WORKPLACE,
        organizationName = "Raqamli yechimlar markazi",
        organizationAddress = "Toshkent shahri, Amir Temur ko'chasi 1",
        jobTitle = "Backend dasturchi",
        specialtyMatchConfirmed = specialtyMatch,
        basisEvidenceReference = "EMPLOYMENT-REF/2026/441",
    )

    private fun partnerRequest(studentId: Long) = SaveStudentPracticeRequest(
        studentId = studentId,
        academicYear = "2026-2027",
        planReference = "O'R-2026/21, 7-semestr malakaviy amaliyot",
        startsOn = LocalDate.of(2027, 2, 1),
        endsOn = LocalDate.of(2027, 3, 15),
        placementBasis = PracticePlacementBasis.PARTNER_ORGANIZATION,
        organizationName = "Universitet hamkor texnoparki",
        organizationAddress = "Toshkent shahri, Universitet ko'chasi 7",
        agreementNumber = "KEL-23/2026-17",
        agreementDate = LocalDate.of(2026, 12, 10),
        basisEvidenceReference = "AGREEMENT-ARCHIVE/KEL-23-2026-17",
    )

    private fun user(username: String) = userRepository.save(User(
        username = "$username-${System.nanoTime()}",
        password = "encoded-password",
        fullName = "Amaliyot bo'limi xodimi",
    ))

    private fun student(username: String): StudentProfile {
        val user = user(username)
        return studentRepository.save(StudentProfile(
            user = user,
            pinfl = "${System.nanoTime()}".takeLast(14).padStart(14, '1'),
            lastName = "Karimov",
            firstName = "Ali",
            birthDate = LocalDate.of(2000, 1, 1),
            gender = Gender.MALE,
            studentNumber = "PR-${System.nanoTime()}",
            educationForm = EducationForm.DISTANCE,
            educationLanguage = "uz",
        ))
    }
}

