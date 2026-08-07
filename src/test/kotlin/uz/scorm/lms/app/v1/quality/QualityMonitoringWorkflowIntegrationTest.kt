package uz.scorm.lms.app.v1.quality

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.ActiveProfiles
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.security.RolePermissions
import uz.scorm.lms.app.v1.quality.dto.CompleteQualityMonitoringStudyRequest
import uz.scorm.lms.app.v1.quality.dto.CreateQualityMonitoringStudyRequest
import uz.scorm.lms.app.v1.quality.model.QualityMonitoringMethod
import uz.scorm.lms.app.v1.quality.service.QualityMonitoringStudyService
import uz.scorm.lms.app.v1.user.model.User
import uz.scorm.lms.app.v1.user.repository.UserRepository
import java.time.Instant

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class QualityMonitoringWorkflowIntegrationTest {
    @Autowired private lateinit var service: QualityMonitoringStudyService
    @Autowired private lateinit var userRepository: UserRepository

    @Test
    fun `fokus guruh agregat dalil bilan yakunlanadi va tasdiqlanadi`() {
        val author = user("quality-author")
        val approver = user("quality-approver")
        val created = service.create(request(QualityMonitoringMethod.FOCUS_GROUP), requireNotNull(author.id))
        assertEquals("DRAFT", created.status)
        assertFalse(created.participantIdentitiesStored)

        val tooSmall = assertThrows<IllegalArgumentException> {
            service.complete(created.id, completion(participantCount = 2), requireNotNull(author.id))
        }
        assertTrue(tooSmall.message.orEmpty().contains("3 dan 50"))

        val completed = service.complete(created.id, completion(participantCount = 7), requireNotNull(author.id))
        assertEquals("COMPLETED", completed.status)
        assertEquals(7, completed.participantCount)
        assertNotNull(completed.completedAt)
        assertFalse(completed.participantIdentitiesStored)

        val approved = service.approve(created.id, requireNotNull(approver.id))
        assertEquals("APPROVED", approved.status)
        assertEquals("Sifat tasdiqlovchi", approved.approvedByName)
        assertNotNull(approved.approvedAt)

        assertThrows<IllegalArgumentException> {
            service.complete(created.id, completion(participantCount = 8), requireNotNull(author.id))
        }
    }

    @Test
    fun `monitoring roli dalilni oqiydi ammo akademik yozish vakolatiga ega emas`() {
        val permissions = RolePermissions.forRole("monitoring")
        assertTrue(RolePermissions.STAT_READ in permissions)
        assertFalse(RolePermissions.ACADEMIC_WRITE in permissions)
    }

    private fun request(method: QualityMonitoringMethod) = CreateQualityMonitoringStudyRequest(
        method = method,
        title = "Masofaviy ta'lim sifati fokus-guruhi",
        objective = "Talabalarning LMS va metodik yordam tajribasini agregat tahlil qilish",
        academicYear = "2026-2027",
        startsAt = Instant.now().minusSeconds(3600),
        endsAt = Instant.now().plusSeconds(3600),
        locationDescription = "A bino, sifat markazi",
        populationScope = "1-kurs masofaviy ta'lim talabalari",
    )

    private fun completion(participantCount: Int) = CompleteQualityMonitoringStudyRequest(
        participantCount = participantCount,
        summary = "Ishtirokchilar LMS navigatsiyasini qulay, texnik yordam javobini esa tushunarli deb baholadi.",
        findings = "Mobil qurilmada ayrim katta SCORM materiallarini ochish vaqti bo'yicha takomillashtirish ehtiyoji aniqlandi.",
        recommendations = "Kontent hajmini optimallashtirish va mobil yuklanish vaqtini oylik nazorat qilish tavsiya etildi.",
        evidenceReference = "QMS-2026-08-06/FG-001",
    )

    private fun user(username: String): User = userRepository.save(User(
        username = "$username-${System.nanoTime()}",
        password = "encoded-password",
        fullName = if (username.contains("approver")) "Sifat tasdiqlovchi" else "Sifat moderatori",
    ))
}

