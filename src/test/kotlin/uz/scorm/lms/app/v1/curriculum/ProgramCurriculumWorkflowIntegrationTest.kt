package uz.scorm.lms.app.v1.curriculum

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.ActiveProfiles
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.curriculum.dto.AddCurriculumSubjectRequest
import uz.scorm.lms.app.v1.curriculum.dto.ApproveCurriculumRequest
import uz.scorm.lms.app.v1.curriculum.dto.SaveCurriculumVersionRequest
import uz.scorm.lms.app.v1.curriculum.model.CurriculumCredentialType
import uz.scorm.lms.app.v1.curriculum.model.CurriculumNormativeBasisType
import uz.scorm.lms.app.v1.curriculum.model.CurriculumPlanItemType
import uz.scorm.lms.app.v1.curriculum.service.ProgramCurriculumService
import uz.scorm.lms.app.v1.program.model.Program
import uz.scorm.lms.app.v1.program.repository.ProgramRepository
import uz.scorm.lms.app.v1.subject.model.Subject
import uz.scorm.lms.app.v1.subject.repository.SubjectRepository
import uz.scorm.lms.app.v1.user.model.User
import uz.scorm.lms.app.v1.user.repository.UserRepository
import java.time.LocalDate

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class ProgramCurriculumWorkflowIntegrationTest {
    @Autowired private lateinit var service: ProgramCurriculumService
    @Autowired private lateinit var programRepository: ProgramRepository
    @Autowired private lateinit var subjectRepository: SubjectRepository
    @Autowired private lateinit var userRepository: UserRepository

    @Test
    fun `19-band curriculum normativ asos fan snapshoti va mustaqil tasdiq bilan yuritiladi`() {
        val author = user("curriculum-author")
        val approver = user("curriculum-approver")
        val program = program("curriculum-program")
        val subject = subject(program, "DAST101", "Dasturlash", 6)

        val invalidBasis = assertThrows<IllegalArgumentException> {
            service.create(request(requireNotNull(program.id), basis = CurriculumNormativeBasisType.PROFESSIONAL_STANDARD), requireNotNull(author.id))
        }
        assertTrue(invalidBasis.message.orEmpty().contains("davlat ta'lim standartiga"))

        val created = service.create(request(requireNotNull(program.id)), requireNotNull(author.id))
        assertEquals("DRAFT", created.status)
        val withSubject = service.addSubject(created.id, AddCurriculumSubjectRequest(
            subjectId = requireNotNull(subject.id),
            semester = 1,
            planItemType = CurriculumPlanItemType.REQUIRED,
        ), requireNotNull(author.id))
        assertEquals(1, withSubject.subjectCount)
        assertEquals(6, withSubject.totalCredits)

        val selfApproval = assertThrows<IllegalArgumentException> {
            service.approve(created.id, approval(), requireNotNull(author.id))
        }
        assertTrue(selfApproval.message.orEmpty().contains("o'z versiyasini"))

        val approved = service.approve(created.id, approval(), requireNotNull(approver.id))
        assertEquals("APPROVED", approved.status)
        assertNotNull(approved.approvedAt)
        assertEquals("Curriculum tasdiqlovchi", approved.approvedByName)

        subject.name = "Keyin o'zgargan nom"
        subject.credits = 8
        subjectRepository.save(subject)
        val immutableSnapshot = service.get(created.id).subjects.single()
        assertEquals("Dasturlash", immutableSnapshot.subjectName)
        assertEquals(6, immutableSnapshot.credits)

        assertThrows<IllegalArgumentException> {
            service.addSubject(created.id, AddCurriculumSubjectRequest(requireNotNull(subject.id), 2, CurriculumPlanItemType.ELECTIVE), requireNotNull(author.id))
        }
    }

    @Test
    fun `curriculumga faqat shu dasturga tegishli kod va kreditli faol fan qo'shiladi`() {
        val author = user("curriculum-scope-author")
        val program = program("curriculum-scope-program")
        val otherProgram = program("curriculum-other-program")
        val foreignSubject = subject(otherProgram, "OTHER101", "Begona fan", 5)
        val created = service.create(request(requireNotNull(program.id), versionSuffix = "scope"), requireNotNull(author.id))

        val foreign = assertThrows<IllegalArgumentException> {
            service.addSubject(created.id, AddCurriculumSubjectRequest(requireNotNull(foreignSubject.id), 1, CurriculumPlanItemType.REQUIRED), requireNotNull(author.id))
        }
        assertTrue(foreign.message.orEmpty().contains("tegishli emas"))

        val noItems = assertThrows<IllegalArgumentException> {
            service.approve(created.id, approval(), requireNotNull(user("curriculum-scope-approver").id))
        }
        assertTrue(noItems.message.orEmpty().contains("kamida bitta fan"))
    }

    private fun request(
        programId: Long,
        basis: CurriculumNormativeBasisType = CurriculumNormativeBasisType.STATE_EDUCATION_STANDARD,
        versionSuffix: String = "main",
    ) = SaveCurriculumVersionRequest(
        programId = programId,
        versionCode = "CUR-2026-${versionSuffix}-${System.nanoTime()}",
        academicYear = "2026-2027",
        credentialType = CurriculumCredentialType.STATE_DIPLOMA,
        normativeBasisType = basis,
        standardReference = "DTS-2026/17, rasmiy reestr yozuvi",
        qualificationRequirementsReference = "MT-2026/09, malaka talablari",
        validFrom = LocalDate.of(2026, 9, 1),
        validUntil = LocalDate.of(2027, 8, 31),
    )

    private fun approval() = ApproveCurriculumRequest(
        approvalOrderNumber = "BUYRUQ-2026/441",
        approvalOrderDate = LocalDate.now(),
    )

    private fun program(name: String) = programRepository.save(Program(
        name = "$name-${System.nanoTime()}",
        code = "P-${System.nanoTime()}",
        degreeLevel = "BACHELOR",
        active = true,
        distanceEnabled = true,
        fullTimeAvailable = true,
        fullTimeBasisReference = "BUYRUQ-3/2026",
    ))

    private fun subject(program: Program, code: String, name: String, credits: Int) = subjectRepository.save(Subject(
        name = name,
        code = "$code-${System.nanoTime()}",
        credits = credits,
        active = true,
        program = program,
    ))

    private fun user(username: String) = userRepository.save(User(
        username = "$username-${System.nanoTime()}",
        password = "encoded-password",
        fullName = if (username.contains("approver")) "Curriculum tasdiqlovchi" else "Curriculum muallifi",
    ))
}
