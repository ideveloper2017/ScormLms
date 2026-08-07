package uz.scorm.lms.app.v1.leave

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.ActiveProfiles
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.leave.dto.SaveAssessmentLeaveEvidenceRequest
import uz.scorm.lms.app.v1.leave.dto.VerifyAssessmentLeaveEvidenceRequest
import uz.scorm.lms.app.v1.leave.model.AssessmentLeavePurpose
import uz.scorm.lms.app.v1.leave.service.AssessmentLeaveEvidenceService
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
class AssessmentLeaveWorkflowIntegrationTest {
    @Autowired private lateinit var service: AssessmentLeaveEvidenceService
    @Autowired private lateinit var userRepository: UserRepository
    @Autowired private lateinit var studentRepository: StudentRepository

    @Test
    fun `22-band leave requires fifteen calendar days retained salary and independent verification`() {
        val author = user("leave-author")
        val verifier = user("leave-verifier")
        val student = student("leave-student")
        val request = request(requireNotNull(student.id))

        val short = assertThrows<IllegalArgumentException> {
            service.create(request.copy(leaveEndDate = request.leaveStartDate.plusDays(13)), requireNotNull(author.id))
        }
        assertTrue(short.message.orEmpty().contains("15 kalendar kun"))

        val created = service.create(request, requireNotNull(author.id))
        assertEquals(15, created.calendarDays)
        assertEquals("DRAFT", created.status)
        assertThrows<IllegalArgumentException> {
            service.verify(created.id, VerifyAssessmentLeaveEvidenceRequest("Rasmiy buyruq asl nusxasi tekshirildi"), requireNotNull(author.id))
        }

        val verified = service.verify(created.id, VerifyAssessmentLeaveEvidenceRequest("Rasmiy buyruq asl nusxasi tekshirildi"), requireNotNull(verifier.id))
        assertEquals("VERIFIED", verified.status)
        assertNotNull(verified.verifiedAt)
        assertEquals(1, service.mine(requireNotNull(student.user.id)).size)

        val unpaid = service.create(request.copy(
            leavePurpose = AssessmentLeavePurpose.STATE_ATTESTATION,
            assessmentReference = "DAK-2026/19",
            leaveOrderNumber = "ORDER-22/2026-2",
            salaryRetentionConfirmed = false,
        ), requireNotNull(author.id))
        val unpaidError = assertThrows<IllegalArgumentException> {
            service.verify(unpaid.id, VerifyAssessmentLeaveEvidenceRequest("Hujjat mazmuni tekshirildi"), requireNotNull(verifier.id))
        }
        assertTrue(unpaidError.message.orEmpty().contains("ish haqi saqlanishi"))
    }

    private fun request(studentId: Long) = SaveAssessmentLeaveEvidenceRequest(
        studentId = studentId,
        academicYear = "2026-2027",
        leavePurpose = AssessmentLeavePurpose.SEMESTER_FINAL_ASSESSMENT,
        assessmentReference = "8-semestr yakuniy nazorat jadvali №17",
        employerName = "Raqamli xizmatlar markazi",
        jobTitle = "Dasturchi",
        employmentDocumentReference = "MEHNAT-2025/441",
        leaveOrderNumber = "ORDER-22/2026-1",
        leaveOrderDate = LocalDate.of(2026, 8, 6),
        leaveStartDate = LocalDate.of(2026, 9, 10),
        leaveEndDate = LocalDate.of(2026, 9, 24),
        salaryRetentionConfirmed = true,
        evidenceReference = "EMPLOYER-ARCHIVE/ORDER-22-2026-1",
    )

    private fun user(prefix: String) = userRepository.save(User(
        username = "$prefix-${System.nanoTime()}", password = "encoded-password", fullName = "Ta'lim bo'limi xodimi",
    ))

    private fun student(prefix: String): StudentProfile {
        val user = user(prefix)
        return studentRepository.save(StudentProfile(
            user = user, pinfl = "${System.nanoTime()}".takeLast(14).padStart(14, '1'),
            lastName = "Karimov", firstName = "Ali", birthDate = LocalDate.of(2000, 1, 1),
            gender = Gender.MALE, studentNumber = "AL-${System.nanoTime()}", educationForm = EducationForm.DISTANCE,
            educationLanguage = "uz",
        ))
    }
}
