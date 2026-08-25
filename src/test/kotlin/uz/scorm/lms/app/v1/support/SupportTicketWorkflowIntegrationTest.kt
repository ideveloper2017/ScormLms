package uz.scorm.lms.app.v1.support

import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import org.springframework.test.context.ActiveProfiles
import org.springframework.security.test.context.support.WithMockUser
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.get
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.role.model.Role
import uz.scorm.lms.app.v1.role.repository.RoleRepository
import uz.scorm.lms.app.v1.support.dto.*
import uz.scorm.lms.app.v1.support.service.SupportTicketService
import uz.scorm.lms.app.v1.user.model.User
import uz.scorm.lms.app.v1.user.repository.UserRepository
import java.time.Duration

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class SupportTicketWorkflowIntegrationTest {
    @Autowired private lateinit var service: SupportTicketService
    @Autowired private lateinit var userRepository: UserRepository
    @Autowired private lateinit var roleRepository: RoleRepository
    @Autowired private lateinit var mockMvc: MockMvc

    @Test
    @WithMockUser(username = "support-http-reader", authorities = ["SUPPORT_READ"])
    fun `ordinary requester cannot open staff queue`() {
        user("support-http-reader")
        mockMvc.get("/api/v1/support/queue").andExpect { status { isForbidden() } }
    }

    @Test
    @WithMockUser(username = "support-http-writer", authorities = ["SUPPORT_READ", "SUPPORT_WRITE"])
    fun `support writer may open staff queue`() {
        user("support-http-writer", supportRole())
        mockMvc.get("/api/v1/support/queue").andExpect {
            status { isOk() }
            jsonPath("$.success") { value(true) }
        }
    }

    @Test
    fun `ticket ownership assignment sla timeline resolve reopen and close are enforced`() {
        val requester = user("support-requester")
        val outsider = user("support-outsider")
        val support = user("support-agent", supportRole())
        val otherSupport = user("support-other-agent", supportRole())

        val created = service.create(CreateSupportTicketRequest(
            subject = "Test sahifasi ochilmayapti",
            description = "Testni boshlash tugmasi bosilganda sahifa ochilmayapti.",
            category = "TECHNICAL",
            impact = "SERVICE_BLOCKED",
        ), requireNotNull(requester.id))
        assertEquals("HIGH", created.ticket.priority)
        assertEquals("OPEN", created.ticket.status)
        assertTrue(Duration.between(created.ticket.sla.responseDueAt, created.ticket.sla.resolutionDueAt).toHours() >= 19)
        assertThrows<IllegalArgumentException> {
            service.detail(created.ticket.id, requireNotNull(outsider.id), false, false)
        }

        val assigned = service.assign(created.ticket.id, SupportAssignRequest(requireNotNull(support.id)), requireNotNull(support.id))
        assertEquals(support.id, assigned.ticket.assigneeId)
        assertThrows<IllegalArgumentException> {
            service.comment(created.ticket.id, SupportCommentRequest("Begona operator javobi"), requireNotNull(otherSupport.id), true, false)
        }

        val responded = service.comment(created.ticket.id, SupportCommentRequest("Muammoni tekshirish boshlandi."), requireNotNull(support.id), true, false)
        assertNotNull(responded.ticket.sla.firstRespondedAt)
        service.comment(created.ticket.id, SupportCommentRequest("Ichki diagnostika yozuvi", internal = true), requireNotNull(support.id), true, false)
        val waiting = service.changeStatus(created.ticket.id, SupportStatusRequest("WAITING_REQUESTER"), requireNotNull(support.id), false)
        assertTrue(waiting.ticket.sla.paused)

        val resumed = service.comment(created.ticket.id, SupportCommentRequest("Qo'shimcha ma'lumot yubordim."), requireNotNull(requester.id), false, false)
        assertEquals("IN_PROGRESS", resumed.ticket.status)
        assertFalse(resumed.ticket.sla.paused)
        val requesterView = service.detail(created.ticket.id, requireNotNull(requester.id), false, false)
        assertFalse(requesterView.events.any { it.visibility == "INTERNAL" })
        val managerView = service.detail(created.ticket.id, requireNotNull(support.id), true, false)
        assertTrue(managerView.events.any { it.visibility == "INTERNAL" })

        val resolved = service.changeStatus(
            created.ticket.id,
            SupportStatusRequest("RESOLVED", "Brauzer cache tozalandi va test sessiyasi qayta yaratildi."),
            requireNotNull(support.id),
            false,
        )
        assertEquals("RESOLVED", resolved.ticket.status)
        assertTrue(resolved.canReopen.not())
        val requesterResolved = service.detail(created.ticket.id, requireNotNull(requester.id), false, false)
        assertTrue(requesterResolved.canReopen)

        val reopened = service.reopen(created.ticket.id, requireNotNull(requester.id))
        assertEquals("OPEN", reopened.ticket.status)
        assertNull(reopened.resolutionSummary)
        service.changeStatus(
            created.ticket.id,
            SupportStatusRequest("RESOLVED", "Muammo qayta tekshirilib to'liq bartaraf etildi."),
            requireNotNull(support.id),
            false,
        )
        val closed = service.changeStatus(created.ticket.id, SupportStatusRequest("CLOSED"), requireNotNull(support.id), false)
        assertEquals("CLOSED", closed.ticket.status)
        assertFalse(closed.canComment)
        assertThrows<IllegalArgumentException> {
            service.comment(created.ticket.id, SupportCommentRequest("Yopilgandan keyin"), requireNotNull(requester.id), false, false)
        }

        val metrics = service.metrics(requireNotNull(support.id))
        assertEquals(1, metrics.resolved)
        assertEquals(0, metrics.totalActive)
        assertNotNull(metrics.averageFirstResponseMinutes)
        assertNotNull(metrics.averageResolutionMinutes)
    }

    @Test
    fun `requester may cancel own active ticket only`() {
        val requester = user("support-cancel-requester")
        val outsider = user("support-cancel-outsider")
        val ticket = service.create(CreateSupportTicketRequest(
            "Profil ma'lumoti", "Profil ma'lumotini yangilash bo'yicha yordam kerak.", "ACCESS", "LIMITED",
        ), requireNotNull(requester.id))
        assertThrows<IllegalArgumentException> { service.cancel(ticket.ticket.id, requireNotNull(outsider.id)) }
        assertEquals("CANCELLED", service.cancel(ticket.ticket.id, requireNotNull(requester.id)).ticket.status)
        assertThrows<IllegalArgumentException> { service.reopen(ticket.ticket.id, requireNotNull(requester.id)) }
    }

    private fun supportRole(): Role = roleRepository.findByName("admin") ?: roleRepository.save(Role(name = "admin"))

    private fun user(username: String, role: Role? = null): User = userRepository.save(User(
        username = username,
        password = "test-password-hash",
        fullName = username,
        role = role,
    ))
}
