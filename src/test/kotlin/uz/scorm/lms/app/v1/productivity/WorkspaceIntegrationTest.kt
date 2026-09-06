package uz.scorm.lms.app.v1.productivity

import jakarta.persistence.EntityManager
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.context.TestPropertySource
import org.springframework.mock.web.MockMultipartFile
import uz.scorm.lms.app.v1.courses.service.CourseContentAssetService
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.assignment.model.*
import uz.scorm.lms.app.v1.courses.model.*
import uz.scorm.lms.app.v1.courses.repository.*
import uz.scorm.lms.app.v1.dashboard.DashboardService
import uz.scorm.lms.app.v1.program.model.Program
import uz.scorm.lms.app.v1.subject.model.Subject
import uz.scorm.lms.app.v1.student.model.*
import uz.scorm.lms.app.v1.user.model.User
import uz.scorm.lms.app.v1.quiz.model.*
import uz.scorm.lms.app.v1.notification.repository.NotificationRepository
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

@SpringBootTest
@ActiveProfiles("test")
@TestPropertySource(properties = ["app.course-content.storage-dir=build/test-mvp-content"])
@Transactional
class WorkspaceIntegrationTest {
    @Autowired lateinit var em: EntityManager
    @Autowired lateinit var workspace: WorkspaceService
    @Autowired lateinit var copies: CourseCopyService
    @Autowired lateinit var reminders: DeadlineReminderService
    @Autowired lateinit var dashboard: DashboardService
    @Autowired lateinit var progress: CourseContentProgressRepository
    @Autowired lateinit var contents: CourseContentRepository
    @Autowired lateinit var modules: CourseModuleRepository
    @Autowired lateinit var notifications: NotificationRepository
    @Autowired lateinit var assets: CourseContentAssetService

    private fun <T : Any> save(value: T): T = value.also { em.persist(it); em.flush() }
    private fun user() = save(User(username = "mvp-${UUID.randomUUID()}", password = "test-hash"))
    private fun fixture(): Triple<User, CourseEnrollment, CourseContent> {
        val owner = user()
        val program = save(Program(name = "MVP dastur", active = true, distanceEnabled = true, fullTimeAvailable = true,
            fullTimeBasisReference = "TEST-2026", fullTimeDurationMonths = 48, distanceDurationMonths = 48, educationLanguage = "uz"))
        val subject = save(Subject(name = "MVP fan", active = true, program = program))
        val student = save(StudentProfile(user = user(), pinfl = (System.nanoTime() % 10_000_000_000_000L).toString().padStart(14, '3'),
            firstName = "MvpStudent", lastName = "Test", birthDate = LocalDate.of(2002, 1, 1), gender = Gender.MALE,
            studentNumber = "MVP-${UUID.randomUUID().toString().take(8)}", programId = program.id, educationLanguage = "uz"))
        val course = save(Course(title = "MVP visible course", userId = owner.id, subject = subject, language = "uz", status = CourseStatus.PUBLISHED.name))
        val enrollment = save(CourseEnrollment(course, student, progress = 100))
        val module = save(CourseModule(course, "MVP module", status = LearningItemStatus.PUBLISHED.name))
        val content = save(CourseContent(module = module, title = "MVP lesson", contentType = CourseContentType.TEXT,
            contentBody = "<p>Read this lesson.</p>", status = LearningItemStatus.PUBLISHED.name,
            languageCode = "uz", authorName = "Teacher", contentVersion = "1.0", sourceName = "Original",
            validFrom = LocalDate.now().minusDays(1), metadataUpdatedAt = Instant.now(), reviewStatus = ContentReviewStatus.APPROVED.name))
        return Triple(owner, enrollment, content)
    }

    @Test
    fun `search is scoped to visible courses and students and handles literal wildcards`() {
        val (owner, enrollment, _) = fixture()
        val stranger = user()
        save(Course(title = "MVP secret course", userId = stranger.id))
        val studentResults = workspace.search(enrollment.student.user.id!!, "MVP", false, true, false, false, true)
        assertEquals(listOf("MVP visible course"), studentResults.map { it.title })
        assertTrue(workspace.search(stranger.id!!, "MVP", false, true, false, false, true).none { it.id.startsWith("student-") })
        assertEquals(1, workspace.search(owner.id!!, "MvpStudent", false, true, false, true, false).size)
        assertTrue(workspace.search(owner.id!!, "%%", true, true, true, false, false).isEmpty())
        assertEquals(5, workspace.setup().size)
    }

    @Test
    fun `resume keeps completion and hides revoked or draft lessons`() {
        val (_, enrollment, content) = fixture()
        save(CourseContentProgress(enrollment, content, progress = 100, completedAt = Instant.now()))
        workspace.viewed(enrollment.student.user.id!!, enrollment.course.id!!, content.id!!)
        assertEquals(100, progress.findByEnrollmentIdAndContentIdAndDeletedFalse(enrollment.id!!, content.id!!)!!.progress)
        assertTrue(workspace.resume(enrollment.student.user.id!!)!!.url.endsWith("content=${content.id}"))
        content.status = LearningItemStatus.DRAFT.name
        em.flush()
        assertNull(workspace.resume(enrollment.student.user.id!!))
        assertThrows(IllegalArgumentException::class.java) { workspace.viewed(enrollment.student.user.id!!, enrollment.course.id!!, content.id!!) }
    }

    @Test
    fun `course copy creates only draft teaching content and does not copy enrollments`() {
        val (owner, enrollment, content) = fixture()
        val asset = assets.upload(enrollment.course.id!!,
            MockMultipartFile("file", "lesson.txt", "text/plain", "Original file content".toByteArray()), owner.id!!, false)
        content.contentType = CourseContentType.FILE
        content.contentBody = null
        content.asset = em.find(CourseContentAsset::class.java, asset.id)
        em.flush()
        val clone = copies.copy(enrollment.course.id!!, owner.id!!, false, false)
        assertEquals("draft", clone.status)
        assertEquals(0, clone.students)
        val clonedModules = modules.findAllByCourseIdAndDeletedFalseOrderByPositionAsc(clone.id)
        assertEquals(LearningItemStatus.DRAFT.name, clonedModules.single().status)
        val clonedContent = contents.findAllByModuleCourseIdAndDeletedFalseOrderByModulePositionAscPositionAsc(clone.id).single()
        assertEquals(content.contentBody, clonedContent.contentBody)
        assertEquals(ContentReviewStatus.DRAFT.name, clonedContent.reviewStatus)
        assertNotEquals(content.id, clonedContent.id)
        assertNotEquals(content.asset!!.storageKey, clonedContent.asset!!.storageKey)
        assertEquals(clone.id, clonedContent.asset!!.course!!.id)
        assets.download(clone.id, clonedContent.id!!, owner.id!!, false).resource.inputStream.use {
            assertEquals("Original file content", it.readAllBytes().toString(Charsets.UTF_8))
        }
        assertThrows(IllegalArgumentException::class.java) { copies.copy(enrollment.course.id!!, user().id!!, false, false) }
    }

    @Test
    fun `reminders are idempotent survive deletion and omit submitted work`() {
        val (_, enrollment, _) = fixture()
        val now = Instant.now()
        val assignment = save(CourseAssignment(enrollment.course, "MVP deadline", dueAt = now.plusSeconds(3600), status = AssignmentStatus.PUBLISHED))
        assertEquals(listOf(assignment.id), reminders.dueIds(0, now))
        assertEquals(1, reminders.deliver(assignment.id!!, now))
        assertEquals(0, reminders.deliver(assignment.id!!, now))
        val delivered = notifications.findByUserIdOrderByCreatedAtDesc(enrollment.student.user.id!!).single()
        assertEquals("/student/assignments?assignment=${assignment.id}", delivered.actionUrl)
        notifications.delete(delivered)
        em.flush()
        assertEquals(0, reminders.deliver(assignment.id!!, now))
        assignment.dueAt = now.plusSeconds(7200)
        save(AssignmentSubmission(assignment, enrollment, 1))
        assertEquals(0, reminders.deliver(assignment.id!!, now))
        assertTrue(workspace.tasks(enrollment.student.user.id!!, true).none { it.id == "assignment-${assignment.id}" })
    }

    @Test
    fun `journal uses assessment scores instead of completion and distinguishes missing grades`() {
        val (owner, enrollment, _) = fixture()
        val empty = dashboard.teacherGradebook(owner, enrollment.course.id!!).single()
        assertNull(empty.finalGrade)
        assertNull(empty.assignments)
        val assignment = save(CourseAssignment(enrollment.course, "Assessed task", dueAt = Instant.now(), status = AssignmentStatus.PUBLISHED))
        save(AssignmentSubmission(assignment, enrollment, 1, status = SubmissionStatus.GRADED, score = 80))
        val quiz = save(CourseQuiz(course = enrollment.course, title = "Quiz", opensAt = Instant.now().minusSeconds(100), closesAt = Instant.now().plusSeconds(1000), durationMinutes = 10))
        save(QuizAttempt(quiz, enrollment, 1, Instant.now().minusSeconds(50), Instant.now().plusSeconds(550),
            status = QuizAttemptStatus.SUBMITTED, questionOrder = "", percentage = 30.0))
        val graded = dashboard.teacherGradebook(owner, enrollment.course.id!!).single()
        assertEquals(80.0, graded.assignments)
        assertEquals(30.0, graded.tests)
        assertEquals(30.0, graded.finalGrade)
        assertNull(graded.attendance)
        assertEquals(30.0, dashboard.teacherStudents(owner, enrollment.course.id!!).single().avgScore)
        assertThrows(NoSuchElementException::class.java) { dashboard.teacherGradebook(user(), enrollment.course.id!!) }
    }
}
