package uz.scorm.lms.app.v1.attestation

import jakarta.transaction.Transactional
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.ActiveProfiles
import uz.scorm.lms.app.v1.attestation.dto.*
import uz.scorm.lms.app.v1.attestation.model.DefenseDecision
import uz.scorm.lms.app.v1.attestation.repository.StudentDefenseRepository
import uz.scorm.lms.app.v1.attestation.service.AttestationSessionService
import uz.scorm.lms.app.v1.attestation.service.GraduationCertificateService
import uz.scorm.lms.app.v1.attestation.service.StudentDefenseService
import uz.scorm.lms.app.v1.attestation.service.AttestationProtocolService
import uz.scorm.lms.app.v1.courses.dto.CourseCreateRequest
import uz.scorm.lms.app.v1.courses.dto.CourseEnrollmentRequest
import uz.scorm.lms.app.v1.courses.model.CourseStatus
import uz.scorm.lms.app.v1.courses.repository.CourseEnrollmentRepository
import uz.scorm.lms.app.v1.courses.service.CourseEnrollmentService
import uz.scorm.lms.app.v1.courses.service.CourseService
import uz.scorm.lms.app.v1.student.model.Gender
import uz.scorm.lms.app.v1.student.model.StudentProfile
import uz.scorm.lms.app.v1.student.repository.StudentRepository
import uz.scorm.lms.app.v1.user.model.User
import uz.scorm.lms.app.v1.user.repository.UserRepository
import java.math.BigDecimal
import java.time.LocalDate
import java.time.LocalTime

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class AttestationWorkflowIntegrationTest {
    @Autowired private lateinit var sessions: AttestationSessionService
    @Autowired private lateinit var defenses: StudentDefenseService
    @Autowired private lateinit var certificates: GraduationCertificateService
    @Autowired private lateinit var protocols: AttestationProtocolService
    @Autowired private lateinit var defenseRepository: StudentDefenseRepository
    @Autowired private lateinit var courseService: CourseService
    @Autowired private lateinit var enrollmentService: CourseEnrollmentService
    @Autowired private lateinit var enrollmentRepository: CourseEnrollmentRepository
    @Autowired private lateinit var userRepository: UserRepository
    @Autowired private lateinit var studentRepository: StudentRepository

    @Test
    fun `komissiya himoyani baholaydi qaror chiqaradi va tekshiriladigan sertifikat yaratiladi`() {
        val chair = user("att-chair")
        val member1 = user("att-member-1")
        val member2 = user("att-member-2")
        val outsider = user("att-outsider")
        val student = student("60000000000001", "ST-AT-001", "att-student")
        val stranger = student("60000000000002", "ST-AT-002", "att-stranger")
        val course = courseService.create(CourseCreateRequest(title = "Bitiruv loyihasi"), chair.id!!).also {
            courseService.changeStatus(it.id, CourseStatus.PUBLISHED, chair.id!!, false)
        }
        enrollmentService.enroll(course.id, CourseEnrollmentRequest(setOf(student.id!!)), chair.id!!, false)
        val enrollment = enrollmentRepository.findByCourseIdAndStudentId(course.id, student.id!!)!!
        val session = sessions.createSession(CreateAttestationSessionRequest(
            courseId = course.id, title = "Davlat attestatsiyasi", examDate = LocalDate.now(), examTime = LocalTime.of(9, 0),
            location = "Bosh bino, majlislar zali", commissionChairId = chair.id!!, minCommissionMembers = 3, minPassScore = 60,
        ), chair.id!!, false)
        sessions.addCommissionMember(session.id.toLong(), AddCommissionMemberRequest(member1.id!!, "MEMBER"), chair.id!!, false)
        sessions.addCommissionMember(session.id.toLong(), AddCommissionMemberRequest(member2.id!!, "SECRETARY"), chair.id!!, false)
        sessions.publishSession(session.id.toLong(), null, chair.id!!, false)
        assertFalse(defenses.getMyAttestations(student.user.id!!).single().resultPublished)
        sessions.startSession(session.id.toLong(), chair.id!!, false)

        val defense = defenseRepository.findByAttestationSessionIdAndEnrollmentIdAndDeletedFalse(session.id.toLong(), enrollment.id!!)!!
        defenses.recordDefense(defense.id!!, RecordDefenseRequest(defenseStatus = "DEFENDED"), chair.id!!, false)
        assertThrows(IllegalArgumentException::class.java) {
            defenses.submitGrade(defense.id!!, outsider.id!!, SubmitGradeRequest(BigDecimal("100")), false)
        }
        defenses.submitGrade(defense.id!!, chair.id!!, SubmitGradeRequest(BigDecimal("70")), false)
        defenses.submitGrade(defense.id!!, member1.id!!, SubmitGradeRequest(BigDecimal("80")), false)
        defenses.submitGrade(defense.id!!, member2.id!!, SubmitGradeRequest(BigDecimal("90")), false)
        val decided = defenseRepository.findByIdAndDeletedFalse(defense.id!!)!!
        assertEquals(0, BigDecimal("80").compareTo(decided.commissionScore))
        assertEquals(DefenseDecision.PASS, decided.commissionDecision)
        sessions.completeSession(session.id.toLong(), null, chair.id!!, false)
        assertEquals("PASS", defenses.getMyAttestations(student.user.id!!).single().myDefenseDecision)
        val protocol = protocols.generateProtocol(session.id.toLong(), chair.id!!, false)
        assertThrows(IllegalArgumentException::class.java) { protocols.approveProtocol(protocol.id.toLong(), chair.id!!, false) }
        protocols.approveProtocol(protocol.id.toLong(), outsider.id!!, true)
        assertTrue(protocols.getProtocol(protocol.id.toLong(), chair.id!!, false).approved)
        val certificate = certificates.generateCertificate(GenerateCertificateRequest(defense.id!!, outsider.id!!), chair.id!!, false)
        assertEquals(chair.fullName, certificate.issuedByName)
        assertTrue(certificates.verifyCertificate(VerifyCertificateRequest(certificateNumber = certificate.certificateNumber)).isValid)
        assertEquals(certificate.certificateNumber, certificates.getMyCertificates(student.user.id!!).single().certificateNumber)
        assertThrows(IllegalArgumentException::class.java) { certificates.getStudentCertificate(enrollment.id!!, stranger.user.id!!) }
        assertThrows(IllegalArgumentException::class.java) { defenses.getStudentDefenseHistory(enrollment.id!!, stranger.user.id!!) }
    }

    private fun user(username: String) = userRepository.save(User(username = username, password = "test-password", fullName = username))
    private fun student(pinfl: String, number: String, username: String) = studentRepository.save(StudentProfile(
        user = user(username), pinfl = pinfl, lastName = "Testov", firstName = "Talaba", birthDate = LocalDate.of(2002, 1, 1),
        gender = Gender.MALE, studentNumber = number,
    ))
}
