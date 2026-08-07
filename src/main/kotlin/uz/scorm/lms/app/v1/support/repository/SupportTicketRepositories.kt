package uz.scorm.lms.app.v1.support.repository

import jakarta.persistence.LockModeType
import org.springframework.data.jpa.repository.EntityGraph
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Lock
import uz.scorm.lms.app.v1.support.model.SupportTicket
import uz.scorm.lms.app.v1.support.model.SupportTicketEvent
import uz.scorm.lms.app.v1.support.model.SupportTicketStatus

interface SupportTicketRepository : JpaRepository<SupportTicket, Long> {
    fun countByDeletedFalse(): Long

    @EntityGraph(attributePaths = ["requester", "assignee", "course"])
    fun findAllByRequesterIdAndDeletedFalseOrderByLastActivityAtDesc(requesterId: Long): List<SupportTicket>

    @EntityGraph(attributePaths = ["requester", "assignee", "course"])
    fun findAllByDeletedFalseOrderByLastActivityAtDesc(): List<SupportTicket>

    @EntityGraph(attributePaths = ["requester", "assignee", "course"])
    fun findByIdAndDeletedFalse(id: Long): SupportTicket?

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @EntityGraph(attributePaths = ["requester", "assignee", "course"])
    fun findFirstByIdAndDeletedFalse(id: Long): SupportTicket?

    fun countByStatusInAndDeletedFalse(statuses: Collection<SupportTicketStatus>): Long
}

interface SupportTicketEventRepository : JpaRepository<SupportTicketEvent, Long> {
    @EntityGraph(attributePaths = ["actor"])
    fun findAllByTicketIdAndDeletedFalseOrderBySequenceNoAsc(ticketId: Long): List<SupportTicketEvent>

    fun findFirstByTicketIdAndDeletedFalseOrderBySequenceNoDesc(ticketId: Long): SupportTicketEvent?
}
