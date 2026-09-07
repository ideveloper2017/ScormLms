package uz.scorm.lms.app.v1.courses

import jakarta.persistence.EntityManager
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.context.TestPropertySource
import org.springframework.transaction.annotation.Transactional
import org.springframework.mock.web.MockMultipartFile
import uz.scorm.lms.app.v1.courses.model.*
import uz.scorm.lms.app.v1.courses.service.*
import uz.scorm.lms.app.v1.student.model.*
import uz.scorm.lms.app.v1.program.model.Program
import uz.scorm.lms.app.v1.subject.model.Subject
import uz.scorm.lms.app.v1.group.model.Group
import uz.scorm.lms.app.v1.user.model.User
import java.time.LocalDate
import java.time.Instant
import java.util.UUID

@SpringBootTest
@ActiveProfiles("test")
@TestPropertySource(properties = ["app.course-content.storage-dir=build/test-resource-content"])
@Transactional
class ResourceEnrollmentIntegrationTest {
    @Autowired lateinit var em: EntityManager
    @Autowired lateinit var resources: CourseResourceService
    @Autowired lateinit var candidates: CourseEnrollmentCandidateService
    @Autowired lateinit var enrollments: CourseEnrollmentService
    @Autowired lateinit var assets: CourseContentAssetService
    private fun <T : Any> save(entity: T) = entity.also { em.persist(it); em.flush() }
    private fun user() = save(User(username = "resource-${UUID.randomUUID()}", password = "test-hash"))
    private fun fixture(): Triple<User, CourseEnrollment, CourseContent> {
        val owner = user()
        val program = save(Program(name = "Resource program", active = true, distanceEnabled = true, fullTimeAvailable = true,
            fullTimeBasisReference = "TEST", fullTimeDurationMonths = 48, distanceDurationMonths = 48, educationLanguage = "uz"))
        val subject = save(Subject(name = "Resource subject", program = program))
        val student = save(StudentProfile(user = user(), pinfl = System.nanoTime().toString().takeLast(14).padStart(14, '3'),
            firstName = "Aziz", lastName = "Test", birthDate = LocalDate.of(2002, 1, 1), gender = Gender.MALE,
            studentNumber = "R-${UUID.randomUUID().toString().take(8)}", programId = program.id, educationLanguage = "uz"))
        val course = save(Course(title = "Visible course", userId = owner.id, subject = subject, language = "uz", status = "PUBLISHED"))
        val enrollment = save(CourseEnrollment(course, student))
        val module = save(CourseModule(course, "Module", status = "PUBLISHED"))
        val content = save(CourseContent(module = module, title = "Text resource", contentType = CourseContentType.TEXT,
            contentBody = "<p>Lesson</p>", status = "PUBLISHED", languageCode = "uz", authorName = "Teacher", contentVersion = "1.0",
            sourceName = "Original", validFrom = LocalDate.now().minusDays(1), metadataUpdatedAt = Instant.now(), reviewStatus = "APPROVED"))
        return Triple(owner, enrollment, content)
    }

    @Test
    fun `resources reuse student visibility and retain teacher draft access`() {
        val (owner, enrollment, content) = fixture()
        val studentId = enrollment.student.user.id!!
        val resource = resources.list(studentId).single()
        assertEquals("text", resource.type)
        assertTrue(resource.url.endsWith("?content=${content.id}"))
        assertEquals(1, resources.categories(studentId).single().count)
        assertTrue(resources.list(studentId, type = "video").isEmpty())
        assertTrue(resources.list(studentId, courseId = 999999).isEmpty())
        assertTrue(resources.list(user().id!!).isEmpty())
        content.status = "DRAFT"; em.flush()
        assertTrue(resources.list(studentId).isEmpty())
        assertEquals(1, resources.list(owner.id!!, studentOnly = false).size)
        assertTrue(resources.list(user().id!!, studentOnly = false).isEmpty())
        content.status = "PUBLISHED"; content.validUntil = LocalDate.now().minusDays(1); em.flush()
        assertTrue(resources.list(studentId).isEmpty())
        content.validUntil = null; content.module.deleted = true; em.flush()
        assertTrue(resources.list(studentId).isEmpty())
        content.module.deleted = false; enrollment.status = CourseEnrollmentStatus.WITHDRAWN; em.flush()
        assertTrue(resources.list(studentId).isEmpty())
    }

    @Test
    fun `resource file is downloaded through authenticated course access and rejects deleted module`() {
        val (owner, enrollment, content) = fixture()
        val upload = assets.upload(enrollment.course.id!!, MockMultipartFile("file", "lesson.txt", "text/plain", "Learning resource".toByteArray()), owner.id!!, false)
        content.asset = em.find(CourseContentAsset::class.java, upload.id); content.contentType = CourseContentType.FILE; content.contentBody = null; em.flush()
        assertEquals("lesson.txt", resources.list(enrollment.student.user.id!!).single().fileName)
        assets.download(enrollment.course.id!!, content.id!!, enrollment.student.user.id!!, false).resource.inputStream.use { assertEquals("Learning resource", it.readAllBytes().toString(Charsets.UTF_8)) }
        assertThrows(IllegalArgumentException::class.java) { assets.download(enrollment.course.id!!, content.id!!, user().id!!, false) }
        content.module.deleted = true; em.flush()
        assertThrows(NoSuchElementException::class.java) { assets.download(enrollment.course.id!!, content.id!!, enrollment.student.user.id!!, false) }
    }

    @Test
    fun `candidate search scopes program group and permissions and explains orientation before enrollment`() {
        val (owner, enrollment, _) = fixture()
        val courseId = enrollment.course.id!!
        val student = enrollment.student
        val group = save(Group(name = "UZ-26", program = enrollment.course.subject!!.program))
        student.groupId = group.id
        assertTrue(candidates.candidates(courseId, owner.id!!, false, null, null, 0).items.isEmpty())
        enrollment.status = CourseEnrollmentStatus.WITHDRAWN; em.flush()
        val found = candidates.candidates(courseId, owner.id!!, false, "UZ-26", group.id, 0).items.single()
        assertEquals(student.id, found.id); assertTrue(found.eligible); assertEquals("UZ-26", found.groupName)
        assertTrue(candidates.candidates(courseId, owner.id!!, false, "%", null, 0).items.isEmpty())
        assertTrue(candidates.candidates(courseId, owner.id!!, false, null, 999999, 0).items.isEmpty())
        assertThrows(IllegalArgumentException::class.java) { candidates.candidates(courseId, user().id!!, false, null, null, 0) }
        assertThrows(IllegalArgumentException::class.java) { candidates.candidates(courseId, owner.id!!, false, null, null, -1) }
        val other = fixture().second
        other.status = CourseEnrollmentStatus.WITHDRAWN; em.flush()
        assertEquals(1L, candidates.candidates(courseId, owner.id!!, false, null, null, 0).total)
        student.educationForm = EducationForm.DISTANCE
        student.lmsOrientationRequired = true; em.flush()
        assertFalse(candidates.candidates(courseId, owner.id!!, false, null, null, 0).items.single().eligible)
        assertThrows(IllegalArgumentException::class.java) { enrollments.enroll(courseId, setOf(student.id!!), owner.id!!, false) }
        student.lmsOrientationRequired = false; em.flush()
        enrollments.enroll(courseId, setOf(student.id!!), owner.id!!, false)
        assertTrue(candidates.candidates(courseId, owner.id!!, false, null, null, 0).items.isEmpty())
        assertEquals(1, resources.list(student.user.id!!).size)
    }

    @Test
    fun `suspended student cannot bypass candidate restrictions through direct enrollment`() {
        val (owner, enrollment, _) = fixture()
        enrollment.status = CourseEnrollmentStatus.WITHDRAWN
        enrollment.student.studentStatus = StudentStatus.SUSPENDED
        em.flush()
        assertTrue(candidates.candidates(enrollment.course.id!!, owner.id!!, false, null, null, 0).items.isEmpty())
        assertThrows(IllegalArgumentException::class.java) { enrollments.enroll(enrollment.course.id!!, setOf(enrollment.student.id!!), owner.id!!, false) }
    }
}
