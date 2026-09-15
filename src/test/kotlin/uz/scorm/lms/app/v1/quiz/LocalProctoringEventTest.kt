package uz.scorm.lms.app.v1.quiz

import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Test
import uz.scorm.lms.app.v1.biometric.service.BiometricConsentBinding
import uz.scorm.lms.app.v1.biometric.service.BiometricGovernanceService
import uz.scorm.lms.app.v1.quiz.dto.ProctoringClientEventRequest
import uz.scorm.lms.app.v1.quiz.dto.ProctoringEventBatchRequest
import uz.scorm.lms.app.v1.quiz.model.*
import uz.scorm.lms.app.v1.quiz.repository.ProctoringEventRepository
import uz.scorm.lms.app.v1.quiz.repository.ProctoringSessionRepository
import uz.scorm.lms.app.v1.quiz.service.ProctoringEventService
import java.time.Instant
import java.util.UUID

class LocalProctoringEventTest {
    private val sessions = mockk<ProctoringSessionRepository>()
    private val events = mockk<ProctoringEventRepository>(relaxed = true)
    private val governance = mockk<BiometricGovernanceService>(relaxed = true)
    private val service = ProctoringEventService(sessions, events, governance)
    private val session = mockk<ProctoringSession>(relaxed = true)
    private val binding = mockk<BiometricConsentBinding>(relaxed = true)

    private fun setup(enabled: Boolean) {
        every { events.save(any<ProctoringEvent>()) } answers { firstArg() }
        every { sessions.findFirstByAttemptIdAndDeletedFalse(21) } returns session
        every { session.id } returns 10
        every { session.attempt!!.id } returns 21
        every { session.quiz.id } returns 9
        every { session.attempt!!.quiz.id } returns 9
        every { session.enrollment.student.user.id } returns 7
        every { session.attempt!!.enrollment.student.user.id } returns 7
        every { session.status } returns ProctoringSessionStatus.CONSUMED
        every { session.attempt!!.status } returns QuizAttemptStatus.IN_PROGRESS
        every { session.attempt!!.startedAt } returns Instant.now().minusSeconds(60)
        every { session.attempt!!.expiresAt } returns Instant.now().plusSeconds(600)
        every { governance.requireActiveConsent(7) } returns binding
        every { binding.policy.localMonitoringEnabled } returns enabled
    }

    private fun request() = ProctoringEventBatchRequest(listOf(ProctoringClientEventRequest(UUID.randomUUID().toString(), ProctoringEventType.AUDIO_ACTIVITY, Instant.now())))

    @Test fun `sensor event is rejected for legacy policy`() {
        setup(false)
        assertThrows(IllegalArgumentException::class.java) { service.recordClientEvents(9, 21, 7, request()) }
        verify(exactly = 0) { events.save(any()) }
    }

    @Test fun `withdrawn consent prevents sensor events`() {
        setup(true)
        every { governance.requireActiveConsent(7) } throws IllegalArgumentException("withdrawn")
        assertThrows(IllegalArgumentException::class.java) { service.recordClientEvents(9, 21, 7, request()) }
        verify(exactly = 0) { events.save(any()) }
    }

    @Test fun `consented sensor event is saved as advisory client signal`() {
        setup(true)
        assertEquals(1, service.recordClientEvents(9, 21, 7, request()).accepted)
        verify { governance.requireSameBinding(any(), any(), binding) }
        verify { events.save(match { it.type == ProctoringEventType.AUDIO_ACTIVITY && it.severity == ProctoringEventSeverity.LOW && it.source == ProctoringEventSource.CLIENT }) }
    }
}
