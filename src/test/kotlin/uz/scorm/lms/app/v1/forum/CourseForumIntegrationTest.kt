package uz.scorm.lms.app.v1.forum

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
import uz.scorm.lms.app.v1.courses.model.Course
import uz.scorm.lms.app.v1.courses.model.CourseEnrollment
import uz.scorm.lms.app.v1.courses.model.CourseEnrollmentStatus
import uz.scorm.lms.app.v1.courses.model.CourseStatus
import uz.scorm.lms.app.v1.courses.repository.CourseEnrollmentRepository
import uz.scorm.lms.app.v1.courses.repository.CourseRepository
import uz.scorm.lms.app.v1.forum.dto.ForumPostCreateRequest
import uz.scorm.lms.app.v1.forum.dto.ForumPostHideRequest
import uz.scorm.lms.app.v1.forum.dto.ForumPostUpdateRequest
import uz.scorm.lms.app.v1.forum.dto.ForumTopicCreateRequest
import uz.scorm.lms.app.v1.forum.dto.ForumTopicModerationRequest
import uz.scorm.lms.app.v1.forum.model.ForumTopicStatus
import uz.scorm.lms.app.v1.forum.service.CourseForumService
import uz.scorm.lms.app.v1.student.model.Gender
import uz.scorm.lms.app.v1.student.model.StudentProfile
import uz.scorm.lms.app.v1.student.repository.StudentRepository
import uz.scorm.lms.app.v1.user.model.User
import uz.scorm.lms.app.v1.user.repository.UserRepository
import java.time.LocalDate

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class CourseForumIntegrationTest {
    @Autowired private lateinit var service: CourseForumService
    @Autowired private lateinit var userRepository: UserRepository
    @Autowired private lateinit var studentRepository: StudentRepository
    @Autowired private lateinit var courseRepository: CourseRepository
    @Autowired private lateinit var enrollmentRepository: CourseEnrollmentRepository

    @Test
    fun `faol talaba mavzu va post yaratadi tahrir tarixi saqlanadi va moderator yashiradi`() {
        val teacher = user("forum-teacher-1")
        val active = student("forum-active-1", "70000000000001", "FORUM-001")
        val outsider = student("forum-outsider-1", "70000000000002", "FORUM-002")
        val course = publishedCourse(teacher, "Forum audit kursi")
        enroll(course, active, CourseEnrollmentStatus.ACTIVE)

        val topic = service.createTopic(
            requireNotNull(course.id),
            ForumTopicCreateRequest("Birinchi muhokama", "Kurs bo'yicha birinchi muhokama matni"),
            requireNotNull(active.user.id),
            false,
        )
        assertEquals(1, service.topics(requireNotNull(course.id), requireNotNull(active.user.id), false, 0, 20).items.size)
        assertThrows<IllegalArgumentException> {
            service.topics(requireNotNull(course.id), requireNotNull(outsider.user.id), false, 0, 20)
        }

        val post = service.createPost(
            requireNotNull(course.id),
            topic.id,
            ForumPostCreateRequest("Dastlabki javob"),
            requireNotNull(active.user.id),
            false,
        )
        val edited = service.editPost(
            requireNotNull(course.id),
            topic.id,
            post.id,
            ForumPostUpdateRequest("Aniqlashtirilgan javob"),
            requireNotNull(active.user.id),
            false,
        )
        assertEquals(2, edited.revisionNumber)
        val history = service.revisions(
            requireNotNull(course.id), topic.id, post.id, requireNotNull(active.user.id), false,
        )
        assertEquals(1, history.size)
        assertEquals("Dastlabki javob", history.single().body)

        val hidden = service.hidePost(
            requireNotNull(course.id),
            topic.id,
            post.id,
            ForumPostHideRequest("Moderator tomonidan yashirildi"),
            requireNotNull(teacher.id),
            false,
        )
        assertTrue(hidden.hidden)
        assertNull(hidden.body)
        assertEquals(1, service.posts(requireNotNull(course.id), topic.id, requireNotNull(active.user.id), false, 0, 50).posts.size)
    }

    @Test
    fun `lock archive va completed oqimlari yozishni bloklaydi`() {
        val teacher = user("forum-teacher-2")
        val active = student("forum-active-2", "70000000000003", "FORUM-003")
        val completed = student("forum-completed-2", "70000000000004", "FORUM-004")
        val course = publishedCourse(teacher, "Forum moderatsiya kursi")
        enroll(course, active, CourseEnrollmentStatus.ACTIVE)
        enroll(course, completed, CourseEnrollmentStatus.COMPLETED)
        val courseId = requireNotNull(course.id)
        val topic = service.createTopic(
            courseId,
            ForumTopicCreateRequest("Moderatsiya mavzusi", "Moderatsiya uchun yetarli mavzu matni"),
            requireNotNull(active.user.id),
            false,
        )
        val completedPost = service.createPost(
            courseId,
            topic.id,
            ForumPostCreateRequest("Keyin read-only bo'ladigan post"),
            requireNotNull(active.user.id),
            false,
        )
        enrollmentRepository.findByCourseIdAndStudentId(courseId, requireNotNull(active.id))!!.apply {
            status = CourseEnrollmentStatus.COMPLETED
            enrollmentRepository.save(this)
        }
        val completedView = service.posts(courseId, topic.id, requireNotNull(active.user.id), false, 0, 50)
        assertFalse(completedView.canReply)
        assertFalse(completedView.posts.single().canEdit)
        assertFalse(completedView.posts.single().canHide)
        assertThrows<IllegalArgumentException> {
            service.editPost(
                courseId, topic.id, completedPost.id, ForumPostUpdateRequest("Tugagandan keyingi tahrir"),
                requireNotNull(active.user.id), false,
            )
        }
        enrollmentRepository.findByCourseIdAndStudentId(courseId, requireNotNull(active.id))!!.apply {
            status = CourseEnrollmentStatus.ACTIVE
            enrollmentRepository.save(this)
        }

        val locked = service.moderateTopic(
            courseId,
            topic.id,
            ForumTopicModerationRequest(status = ForumTopicStatus.LOCKED, pinned = true),
            requireNotNull(teacher.id),
            false,
        )
        assertEquals("LOCKED", locked.status)
        assertTrue(locked.pinned)
        assertThrows<IllegalArgumentException> {
            service.createPost(courseId, topic.id, ForumPostCreateRequest("Yopiq javob"), requireNotNull(active.user.id), false)
        }
        assertThrows<IllegalArgumentException> {
            service.createTopic(
                courseId,
                ForumTopicCreateRequest("Tugallangan talaba", "Tugallangan talaba yangi mavzu yoza olmaydi"),
                requireNotNull(completed.user.id),
                false,
            )
        }

        service.moderateTopic(
            courseId,
            topic.id,
            ForumTopicModerationRequest(status = ForumTopicStatus.ARCHIVED),
            requireNotNull(teacher.id),
            false,
        )
        assertTrue(service.topics(courseId, requireNotNull(active.user.id), false, 0, 20).items.isEmpty())
        val managerView = service.topics(courseId, requireNotNull(teacher.id), false, 0, 20)
        assertEquals(1, managerView.items.size)
        assertFalse(managerView.items.single().pinned)
        assertFalse(service.topics(courseId, requireNotNull(completed.user.id), false, 0, 20).canCreateTopic)
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
            lastName = "Forum",
            firstName = "Talaba",
            birthDate = LocalDate.of(2002, 1, 1),
            gender = Gender.MALE,
            studentNumber = number,
        ),
    )

    private fun publishedCourse(owner: User, title: String): Course = courseRepository.save(Course(
        title = title,
        slug = title.lowercase().replace(' ', '-'),
        userId = requireNotNull(owner.id),
        status = CourseStatus.PUBLISHED.name,
    ))

    private fun enroll(course: Course, student: StudentProfile, status: CourseEnrollmentStatus) {
        enrollmentRepository.save(CourseEnrollment(
            course = course,
            student = student,
            status = status,
            academicYear = "2026-2027",
        ))
    }
}
