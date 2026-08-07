package uz.scorm.lms.app.v1.license

import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.ActiveProfiles
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.license.dto.AddLicenseProgramScopeRequest
import uz.scorm.lms.app.v1.license.dto.RevokeNonStateEducationLicenseRequest
import uz.scorm.lms.app.v1.license.dto.SaveNonStateEducationLicenseRequest
import uz.scorm.lms.app.v1.license.dto.VerifyNonStateEducationLicenseRequest
import uz.scorm.lms.app.v1.license.model.NonStateLicenseStatus
import uz.scorm.lms.app.v1.license.repository.NonStateLicenseProgramScopeRepository
import uz.scorm.lms.app.v1.license.service.NonStateEducationLicenseService
import uz.scorm.lms.app.v1.program.model.Program
import uz.scorm.lms.app.v1.program.repository.ProgramRepository
import uz.scorm.lms.app.v1.user.model.User
import uz.scorm.lms.app.v1.user.repository.UserRepository
import java.time.LocalDate

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class NonStateLicenseWorkflowIntegrationTest {
    @Autowired private lateinit var service: NonStateEducationLicenseService
    @Autowired private lateinit var scopeRepository: NonStateLicenseProgramScopeRepository
    @Autowired private lateinit var programRepository: ProgramRepository
    @Autowired private lateinit var userRepository: UserRepository

    @Test
    fun `verified scope is effective by date and revocation removes coverage`() {
        val suffix = System.nanoTime()
        val author = userRepository.save(User(username = "license-author-$suffix", password = "x"))
        val verifier = userRepository.save(User(username = "license-verifier-$suffix", password = "x"))
        val program = programRepository.save(Program(
            name = "16-band dasturi", code = "LIC-$suffix", degreeLevel = "BACHELOR",
            active = true, distanceEnabled = true, fullTimeDurationMonths = 48, distanceDurationMonths = 48,
            fullTimeAvailable = true, fullTimeBasisReference = "BUYRUQ-3/2026",
        ))
        val today = LocalDate.now()
        val license = service.create(SaveNonStateEducationLicenseRequest(
            institutionName = "Nodavlat universitet", licenseNumber = "NS-$suffix",
            issuingAuthority = "Vakolatli organ", issueDate = today.minusDays(10),
            validFrom = today.minusDays(5), validUntil = today.plusYears(1),
            officialRegistryReference = "registry.gov.uz/$suffix",
        ), requireNotNull(author.id))
        service.addScope(license.id, AddLicenseProgramScopeRequest(requireNotNull(program.id)), requireNotNull(author.id))

        assertThrows<IllegalArgumentException> {
            service.verify(license.id, VerifyNonStateEducationLicenseRequest("Rasmiy reyestr tekshiruvi"), requireNotNull(author.id))
        }
        service.verify(license.id, VerifyNonStateEducationLicenseRequest("Rasmiy reyestr tekshiruvi"), requireNotNull(verifier.id))

        assertTrue(scopeRepository.existsEffectiveCoverage(requireNotNull(program.id), NonStateLicenseStatus.VERIFIED, today))
        assertFalse(scopeRepository.existsEffectiveCoverage(requireNotNull(program.id), NonStateLicenseStatus.VERIFIED, today.plusYears(2)))

        service.revoke(license.id, RevokeNonStateEducationLicenseRequest("Vakolatli organ qarori bilan bekor qilindi", "REV-$suffix"), requireNotNull(verifier.id))
        assertFalse(scopeRepository.existsEffectiveCoverage(requireNotNull(program.id), NonStateLicenseStatus.VERIFIED, today))
    }
}
