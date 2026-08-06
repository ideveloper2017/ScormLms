package uz.scorm.lms.app.v1.compliance

import jakarta.transaction.Transactional
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.ActiveProfiles
import uz.scorm.lms.app.v1.attendance.repository.LearningActivityEventRepository
import uz.scorm.lms.app.v1.courses.repository.CourseRepository
import uz.scorm.lms.app.v1.scorm.repository.ScormPackageRepository

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class Decision559ComplianceIntegrationTest {
    @Autowired private lateinit var service: Decision559ComplianceService
    @Autowired private lateinit var courseRepository: CourseRepository
    @Autowired private lateinit var scormRepository: ScormPackageRepository
    @Autowired private lateinit var activityRepository: LearningActivityEventRepository

    @Test
    fun `compliance dalillari real repository hisoblagichlaridan olinadi`() {
        val summary = service.summary()
        val evidence = summary.evidence.associateBy { it.code }
        assertEquals(courseRepository.countByDeletedFalse(), evidence.getValue("COURSES").recordCount)
        assertEquals(scormRepository.countByDeletedFalse(), evidence.getValue("SCORM_PACKAGES").recordCount)
        assertEquals(activityRepository.countByDeletedFalse(), evidence.getValue("LEARNING_EVENTS").recordCount)
        assertTrue(evidence.size >= 15)
        assertTrue(summary.requirements.first { it.code == "COURSES" }.evidenceCodes.contains("COURSES"))
        assertTrue(summary.requirements.first { it.code == "ATTESTATION" }.evidenceCodes.contains("CERTIFICATES"))
        assertTrue(summary.requirements.first { it.code == "FEEDBACK" }.evidenceCodes.contains("SURVEYS"))
        assertTrue(summary.requirements.all { it.evidenceCodes.isNotEmpty() })
        assertEquals(ComplianceStatus.NON_COMPLIANT, evidence.getValue("EXTERNAL_INTEGRATIONS").status)
    }
}
