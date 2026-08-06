package uz.scorm.lms.app.v1.compliance

import jakarta.transaction.Transactional
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.ActiveProfiles
import uz.scorm.lms.app.v1.program.model.Program
import uz.scorm.lms.app.v1.program.repository.ProgramRepository
import uz.scorm.lms.app.v1.user.model.User
import uz.scorm.lms.app.v1.user.repository.UserRepository
import java.time.LocalDate

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class ComplianceIssueWorkflowIntegrationTest {
    @Autowired private lateinit var service: ComplianceIssueService
    @Autowired private lateinit var complianceService: Decision559ComplianceService
    @Autowired private lateinit var userRepository: UserRepository
    @Autowired private lateinit var programRepository: ProgramRepository
    @Autowired private lateinit var issueRepository: ComplianceIssueRepository

    @Test
    fun `buzilish masul deadline yechim va real yopilish nazorati bilan kuzatiladi`() {
        issueRepository.deleteAll()
        val actor = userRepository.save(User(username = "compliance-admin", password = "test", fullName = "Compliance Admin"))
        val owner = userRepository.save(User(username = "compliance-owner", password = "test", fullName = "Mas'ul Xodim"))
        val violation = complianceService.summary().violations.first { it.code == "NO_DISTANCE_PROGRAM" }

        val created = service.create(CreateComplianceIssueRequest(
            violationCode = violation.code,
            ownerId = owner.id!!,
            dueDate = LocalDate.now().plusDays(5),
            remediationPlan = "Masofaviy yo'nalish va litsenziya rekvizitlarini sozlash",
        ), actor.id!!)
        assertEquals(ComplianceIssueStatus.OPEN, created.status)
        assertEquals(owner.id, created.ownerId)
        assertThrows(IllegalArgumentException::class.java) {
            service.create(CreateComplianceIssueRequest(violation.code, owner.id!!, LocalDate.now().plusDays(3), "Takror"), actor.id!!)
        }
        assertThrows(IllegalArgumentException::class.java) {
            service.changeStatus(created.id, ChangeComplianceIssueStatusRequest(ComplianceIssueStatus.RESOLVED, "dalil"), actor.id!!)
        }

        service.changeStatus(created.id, ChangeComplianceIssueStatusRequest(ComplianceIssueStatus.IN_PROGRESS), actor.id!!)
        assertThrows(IllegalArgumentException::class.java) {
            service.changeStatus(created.id, ChangeComplianceIssueStatusRequest(ComplianceIssueStatus.RESOLVED), actor.id!!)
        }
        val resolved = service.changeStatus(
            created.id,
            ChangeComplianceIssueStatusRequest(ComplianceIssueStatus.RESOLVED, "Yo'nalish kartasi yaratildi"),
            actor.id!!,
        )
        assertNotNull(resolved.resolvedAt)
        assertThrows(IllegalArgumentException::class.java) {
            service.changeStatus(created.id, ChangeComplianceIssueStatusRequest(ComplianceIssueStatus.CLOSED), actor.id!!)
        }

        programRepository.save(Program(
            name = "Masofaviy IT",
            code = "DIST-IT-MON02",
            degreeLevel = "BACHELOR",
            distanceEnabled = true,
            informationTechnologyProgram = true,
            licenseReference = "LICENSE-MON02",
        ))
        val closed = service.changeStatus(created.id, ChangeComplianceIssueStatusRequest(ComplianceIssueStatus.CLOSED), actor.id!!)
        assertEquals(ComplianceIssueStatus.CLOSED, closed.status)
        assertNotNull(closed.closedAt)
    }
}
