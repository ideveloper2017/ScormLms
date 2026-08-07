package uz.scorm.lms.app.v1.chat

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.ActiveProfiles
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.chat.dto.ChatMessageCreateRequest
import uz.scorm.lms.app.v1.chat.dto.ChatMessageHideRequest
import uz.scorm.lms.app.v1.chat.dto.ChatReadRequest
import uz.scorm.lms.app.v1.chat.dto.DirectConversationRequest
import uz.scorm.lms.app.v1.chat.dto.GroupConversationRequest
import uz.scorm.lms.app.v1.chat.dto.GroupMembersRequest
import uz.scorm.lms.app.v1.chat.service.ChatService
import uz.scorm.lms.app.v1.courses.model.Course
import uz.scorm.lms.app.v1.courses.model.CourseEnrollment
import uz.scorm.lms.app.v1.courses.model.CourseEnrollmentStatus
import uz.scorm.lms.app.v1.courses.model.CourseStatus
import uz.scorm.lms.app.v1.courses.repository.CourseEnrollmentRepository
import uz.scorm.lms.app.v1.courses.repository.CourseRepository
import uz.scorm.lms.app.v1.student.model.Gender
import uz.scorm.lms.app.v1.student.model.StudentProfile
import uz.scorm.lms.app.v1.student.repository.StudentRepository
import uz.scorm.lms.app.v1.user.model.User
import uz.scorm.lms.app.v1.user.repository.UserRepository
import java.time.LocalDate

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class ChatWorkflowIntegrationTest {
    @Autowired private lateinit var service: ChatService
    @Autowired private lateinit var userRepository: UserRepository
    @Autowired private lateinit var studentRepository: StudentRepository
    @Autowired private lateinit var courseRepository: CourseRepository
    @Autowired private lateinit var enrollmentRepository: CourseEnrollmentRepository

    @Test
    fun `kurs aloqasidagi userlar direct chatda delivery va read auditini koradi`() {
        val teacher = user("chat-teacher-1")
        val student = student("chat-student-1", "71000000000001", "CHAT-001")
        val peer = student("chat-peer-1", "71000000000002", "CHAT-002")
        val outsider = student("chat-outsider-1", "71000000000003", "CHAT-003")
        val course = course(teacher, "Chat kursi")
        enroll(course, student)
        enroll(course, peer)

        val studentContacts = service.contacts(requireNotNull(student.user.id), false, null)
        assertEquals(setOf(requireNotNull(teacher.id), requireNotNull(peer.user.id)), studentContacts.map { it.userId }.toSet())
        assertFalse(studentContacts.any { it.userId == outsider.user.id })

        val direct = service.direct(
            DirectConversationRequest(requireNotNull(teacher.id)),
            requireNotNull(student.user.id),
            false,
        )
        assertEquals(direct.id, service.direct(
            DirectConversationRequest(requireNotNull(student.user.id)),
            requireNotNull(teacher.id),
            false,
        ).id)
        val sent = service.send(direct.id, ChatMessageCreateRequest("Assalomu alaykum, ustoz"), requireNotNull(student.user.id))
        assertEquals(1, sent.deliveredCount)
        assertEquals(0, sent.readCount)
        assertEquals(1, service.conversations(requireNotNull(teacher.id)).single().unreadCount)

        val teacherMessages = service.messages(direct.id, requireNotNull(teacher.id), 0, 50)
        assertEquals("Assalomu alaykum, ustoz", teacherMessages.messages.single().body)
        service.markRead(direct.id, ChatReadRequest(sent.id), requireNotNull(teacher.id))
        assertEquals(0, service.conversations(requireNotNull(teacher.id)).single().unreadCount)
        assertEquals(1, service.messages(direct.id, requireNotNull(student.user.id), 0, 50).messages.single().readCount)

        val hidden = service.hideMessage(
            direct.id,
            sent.id,
            ChatMessageHideRequest("Muallif xabarni qaytarib oldi"),
            requireNotNull(student.user.id),
        )
        assertTrue(hidden.hidden)
        assertNull(hidden.body)
        assertThrows<IllegalArgumentException> {
            service.messages(direct.id, requireNotNull(outsider.user.id), 0, 50)
        }
    }

    @Test
    fun `guruh egasi azolarni boshqaradi va arxiv yozishni bloklaydi`() {
        val teacher = user("chat-teacher-2")
        val first = student("chat-student-2", "71000000000004", "CHAT-004")
        val second = student("chat-student-3", "71000000000005", "CHAT-005")
        val course = course(teacher, "Guruh chat kursi")
        enroll(course, first)
        enroll(course, second)
        val group = service.group(
            GroupConversationRequest(
                title = "Loyiha guruhi",
                memberIds = setOf(requireNotNull(first.user.id), requireNotNull(second.user.id)),
            ),
            requireNotNull(teacher.id),
            false,
        )
        assertEquals("GROUP", group.type)
        assertEquals(3, group.members.size)
        val message = service.send(group.id, ChatMessageCreateRequest("Guruhga birinchi xabar"), requireNotNull(first.user.id))
        assertEquals(2, message.recipientCount)

        assertThrows<IllegalArgumentException> {
            service.updateGroupMembers(
                group.id,
                GroupMembersRequest(removeMemberIds = setOf(requireNotNull(second.user.id))),
                requireNotNull(first.user.id),
                false,
            )
        }
        val updated = service.updateGroupMembers(
            group.id,
            GroupMembersRequest(removeMemberIds = setOf(requireNotNull(second.user.id))),
            requireNotNull(teacher.id),
            false,
        )
        assertEquals(2, updated.members.size)
        assertThrows<IllegalArgumentException> {
            service.messages(group.id, requireNotNull(second.user.id), 0, 50)
        }

        val archived = service.archive(group.id, requireNotNull(teacher.id))
        assertEquals("ARCHIVED", archived.status)
        assertThrows<IllegalArgumentException> {
            service.send(group.id, ChatMessageCreateRequest("Arxivdan keyingi xabar"), requireNotNull(first.user.id))
        }
        assertFalse(service.messages(group.id, requireNotNull(first.user.id), 0, 50).canSend)
    }

    private fun user(username: String): User = userRepository.save(User(
        username = username,
        password = "test-password-hash",
        fullName = username,
    ))

    private fun student(username: String, pinfl: String, number: String): StudentProfile = studentRepository.save(
        StudentProfile(
            user = user(username),
            pinfl = pinfl,
            lastName = "Chat",
            firstName = "Talaba",
            birthDate = LocalDate.of(2002, 1, 1),
            gender = Gender.MALE,
            studentNumber = number,
        ),
    )

    private fun course(owner: User, title: String): Course = courseRepository.save(Course(
        title = title,
        slug = title.lowercase().replace(' ', '-'),
        userId = requireNotNull(owner.id),
        status = CourseStatus.PUBLISHED.name,
    ))

    private fun enroll(course: Course, student: StudentProfile) {
        enrollmentRepository.save(CourseEnrollment(
            course = course,
            student = student,
            status = CourseEnrollmentStatus.ACTIVE,
            academicYear = "2026-2027",
        ))
    }
}
