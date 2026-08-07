package uz.scorm.lms.app.v1.courses

import jakarta.transaction.Transactional
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.ActiveProfiles
import uz.scorm.lms.app.v1.courses.dto.CourseCreateRequest
import uz.scorm.lms.app.v1.courses.dto.CourseEnrollmentRequest
import uz.scorm.lms.app.v1.courses.dto.CourseUpdateRequest
import uz.scorm.lms.app.v1.courses.dto.CourseModuleRequest
import uz.scorm.lms.app.v1.courses.dto.CourseContentRequest
import uz.scorm.lms.app.v1.courses.dto.ContentReviewDecisionRequest
import uz.scorm.lms.app.v1.courses.model.ContentReviewDecision
import uz.scorm.lms.app.v1.courses.model.CourseContentType
import uz.scorm.lms.app.v1.courses.model.LearningItemStatus
import uz.scorm.lms.app.v1.courses.model.CourseStatus
import uz.scorm.lms.app.v1.courses.service.CourseAccessService
import uz.scorm.lms.app.v1.courses.service.CourseEnrollmentService
import uz.scorm.lms.app.v1.courses.service.CourseService
import uz.scorm.lms.app.v1.courses.service.CourseModuleService
import uz.scorm.lms.app.v1.courses.service.CourseContentService
import uz.scorm.lms.app.v1.courses.service.CourseContentReviewService
import uz.scorm.lms.app.v1.courses.service.StudyPlanService
import uz.scorm.lms.app.v1.courses.repository.CourseRepository
import uz.scorm.lms.app.v1.scorm.model.ScormAttempt
import uz.scorm.lms.app.v1.scorm.model.ScormAttemptStatus
import uz.scorm.lms.app.v1.scorm.model.ScormPackage
import uz.scorm.lms.app.v1.scorm.model.ScormVersion
import uz.scorm.lms.app.v1.scorm.repository.ScormAttemptRepository
import uz.scorm.lms.app.v1.scorm.repository.ScormPackageRepository
import uz.scorm.lms.app.v1.attendance.repository.LearningActivityEventRepository
import uz.scorm.lms.app.v1.student.model.Gender
import uz.scorm.lms.app.v1.student.model.StudentProfile
import uz.scorm.lms.app.v1.student.repository.StudentRepository
import uz.scorm.lms.app.v1.student.service.StudentPortalService
import uz.scorm.lms.app.v1.user.model.User
import uz.scorm.lms.app.v1.user.repository.UserRepository
import uz.scorm.lms.app.v1.program.model.Program
import uz.scorm.lms.app.v1.program.repository.ProgramRepository
import uz.scorm.lms.app.v1.subject.model.Subject
import uz.scorm.lms.app.v1.subject.repository.SubjectRepository
import java.time.LocalDate

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class CourseLifecycleIntegrationTest {
    @Autowired private lateinit var courseService: CourseService
    @Autowired private lateinit var enrollmentService: CourseEnrollmentService
    @Autowired private lateinit var accessService: CourseAccessService
    @Autowired private lateinit var userRepository: UserRepository
    @Autowired private lateinit var studentRepository: StudentRepository
    @Autowired private lateinit var studentPortalService: StudentPortalService
    @Autowired private lateinit var moduleService: CourseModuleService
    @Autowired private lateinit var contentService: CourseContentService
    @Autowired private lateinit var contentReviewService: CourseContentReviewService
    @Autowired private lateinit var studyPlanService: StudyPlanService
    @Autowired private lateinit var courseRepository: CourseRepository
    @Autowired private lateinit var scormPackageRepository: ScormPackageRepository
    @Autowired private lateinit var scormAttemptRepository: ScormAttemptRepository
    @Autowired private lateinit var learningActivityEventRepository: LearningActivityEventRepository
    @Autowired private lateinit var programRepository: ProgramRepository
    @Autowired private lateinit var subjectRepository: SubjectRepository

    @Test
    fun `oqituvchi draft yaratadi publish qiladi va biriktirilgan talaba kursni ochadi`() {
        val teacher = user("course-teacher-1")
        val student = student("10000000000001", "ST-E2E-001", "course-student-1")
        val outsider = student("10000000000002", "ST-E2E-002", "course-student-2")

        val draft = courseService.create(CourseCreateRequest(
            title = "Masofaviy dasturlash",
            description = "SCORM asosidagi kurs",
            subjectName = "Dasturlash",
            groupName = "E2E-01",
            startDate = LocalDate.of(2026, 9, 1),
            endDate = LocalDate.of(2026, 12, 20),
        ), requireNotNull(teacher.id))
        assertEquals("draft", draft.status)

        val updated = courseService.update(
            draft.id,
            CourseUpdateRequest(description = "Yangilangan kurs tavsifi"),
            requireNotNull(teacher.id),
            false,
        )
        assertEquals("Yangilangan kurs tavsifi", updated.description)

        assertThrows<IllegalArgumentException> {
            accessService.requireRead(draft.id, requireNotNull(student.user.id), false)
        }

        val published = courseService.changeStatus(draft.id, CourseStatus.PUBLISHED, requireNotNull(teacher.id), false)
        assertEquals("published", published.status)
        enrollmentService.enroll(draft.id, setOf(requireNotNull(student.id)), requireNotNull(teacher.id), false)

        assertEquals(draft.id, accessService.requireRead(draft.id, requireNotNull(student.user.id), false).id)
        val studentCourses = studentPortalService.getCourses(student.user)
        assertEquals(1, studentCourses.size)
        assertEquals(draft.id.toString(), studentCourses.single().id)
        assertEquals("active", studentCourses.single().status)
        assertThrows<IllegalArgumentException> {
            accessService.requireRead(draft.id, requireNotNull(outsider.user.id), false)
        }
    }

    @Test
    fun `withdraw qilingan talaba kirishi bloklanadi va arxivlangan kursga yangi talaba qoshilmaydi`() {
        val teacher = user("course-teacher-2")
        val student = student("10000000000003", "ST-E2E-003", "course-student-3")
        val course = courseService.create(CourseCreateRequest(title = "Arxiv testi"), requireNotNull(teacher.id))
        courseService.changeStatus(course.id, CourseStatus.PUBLISHED, requireNotNull(teacher.id), false)
        enrollmentService.enroll(course.id, setOf(requireNotNull(student.id)), requireNotNull(teacher.id), false)

        enrollmentService.withdraw(course.id, requireNotNull(student.id), requireNotNull(teacher.id), false)
        assertThrows<IllegalArgumentException> {
            accessService.requireRead(course.id, requireNotNull(student.user.id), false)
        }

        courseService.changeStatus(course.id, CourseStatus.ARCHIVED, requireNotNull(teacher.id), false)
        assertThrows<IllegalArgumentException> {
            enrollmentService.enroll(course.id, setOf(requireNotNull(student.id)), requireNotNull(teacher.id), false)
        }
        courseService.delete(course.id, requireNotNull(teacher.id), false)
        assertTrue(courseService.owned(requireNotNull(teacher.id), false).none { it.id == course.id })
    }

    @Test
    fun `modul va kontent CRUD publish hamda student visibility oqimi ishlaydi`() {
        val teacher = user("course-teacher-3")
        val student = student("10000000000004", "ST-E2E-004", "course-student-4")
        val course = compliantCourse(teacher, "Kontent testi", "Kontent fani", student)
        courseService.changeStatus(course.id, CourseStatus.PUBLISHED, requireNotNull(teacher.id), false)
        enrollmentService.enroll(course.id, setOf(requireNotNull(student.id)), requireNotNull(teacher.id), false)

        val module = moduleService.create(
            course.id, CourseModuleRequest(title = "1-modul", description = "Kirish"), requireNotNull(teacher.id), false,
        )
        val content = contentService.create(
            course.id,
            module.id,
            CourseContentRequest(
                title = "Video dars",
                contentType = CourseContentType.VIDEO,
                contentUrl = "https://cdn.example.uz/video/1",
                durationMinutes = 15,
                languageCode = "uz-Latn",
                authorName = "Test muallifi",
                contentVersion = "1.0.0",
                sourceName = "Universitet media markazi",
                sourceUrl = "https://cdn.example.uz/catalog/1",
                validFrom = LocalDate.of(2026, 1, 1),
            ),
            requireNotNull(teacher.id),
            false,
        )
        assertTrue(moduleService.list(course.id, requireNotNull(student.user.id), false).isEmpty())
        assertTrue(contentService.list(course.id, requireNotNull(student.user.id), false).isEmpty())

        moduleService.changeStatus(course.id, module.id, LearningItemStatus.PUBLISHED, requireNotNull(teacher.id), false)
        assertThrows<IllegalArgumentException> {
            contentService.changeStatus(course.id, content.id, LearningItemStatus.PUBLISHED, requireNotNull(teacher.id), false)
        }
        approveContent(course.id, content.id, requireNotNull(teacher.id))
        contentService.changeStatus(course.id, content.id, LearningItemStatus.PUBLISHED, requireNotNull(teacher.id), false)
        assertEquals(1, moduleService.list(course.id, requireNotNull(student.user.id), false).size)
        assertEquals(1, contentService.list(course.id, requireNotNull(student.user.id), false).size)
        assertEquals("uz-Latn", content.languageCode)
        assertEquals("1.0.0", content.contentVersion)
        assertEquals(1, contentService.revisions(course.id, content.id, requireNotNull(teacher.id), false).size)

        assertThrows<IllegalArgumentException> {
            contentService.update(
                course.id,
                content.id,
                CourseContentRequest(
                    title = "Versiyasiz yangilash",
                    contentType = CourseContentType.VIDEO,
                    contentUrl = "https://cdn.example.uz/video/2",
                    languageCode = "uz-Latn",
                    authorName = "Test muallifi",
                    contentVersion = "1.0.0",
                    sourceName = "Universitet media markazi",
                    validFrom = LocalDate.of(2026, 1, 1),
                ),
                requireNotNull(teacher.id),
                false,
            )
        }

        val updatedModule = moduleService.update(
            course.id, module.id, CourseModuleRequest(title = "Yangilangan modul", position = 2), requireNotNull(teacher.id), false,
        )
        val updatedContent = contentService.update(
            course.id,
            content.id,
            CourseContentRequest(
                title = "Yangilangan video",
                contentType = CourseContentType.VIDEO,
                contentUrl = "https://cdn.example.uz/video/2",
                durationMinutes = 20,
                languageCode = "uz-Latn",
                authorName = "Yangilangan muallif",
                contentVersion = "2.0.0",
                sourceName = "Universitet media markazi",
                sourceUrl = "https://cdn.example.uz/catalog/2",
                validFrom = LocalDate.of(2026, 2, 1),
                validUntil = LocalDate.of(2027, 12, 31),
            ),
            requireNotNull(teacher.id),
            false,
        )
        assertEquals("Yangilangan modul", updatedModule.title)
        assertEquals("Yangilangan video", updatedContent.title)
        assertEquals("2.0.0", updatedContent.contentVersion)
        assertEquals("draft", updatedContent.reviewStatus)
        assertTrue(contentService.list(course.id, requireNotNull(student.user.id), false).isEmpty())
        approveContent(course.id, content.id, requireNotNull(teacher.id))
        contentService.changeStatus(course.id, content.id, LearningItemStatus.PUBLISHED, requireNotNull(teacher.id), false)
        val revisions = contentService.revisions(course.id, content.id, requireNotNull(student.user.id), false)
        assertEquals(listOf("2.0.0", "1.0.0"), revisions.map { it.contentVersion })
        assertEquals("Video dars", revisions.last().title)

        contentService.delete(course.id, content.id, requireNotNull(teacher.id), false)
        moduleService.delete(course.id, module.id, requireNotNull(teacher.id), false)
        assertTrue(moduleService.list(course.id, requireNotNull(teacher.id), false).isEmpty())
        assertTrue(contentService.list(course.id, requireNotNull(teacher.id), false).isEmpty())
    }

    @Test
    fun `individual reja fan progressini kontentdan avtomatik hisoblaydi`() {
        val teacher = user("study-plan-teacher")
        val student = student("10000000000005", "ST-PLAN-001", "study-plan-student")
        val course = compliantCourse(teacher, "Algoritmlar", "Algoritmlar nazariyasi", student)
        courseService.changeStatus(course.id, CourseStatus.PUBLISHED, requireNotNull(teacher.id), false)
        enrollmentService.enroll(
            course.id,
            CourseEnrollmentRequest(
                studentIds = setOf(requireNotNull(student.id)),
                academicYear = "2026-2027",
                semester = 2,
                credits = 6,
                required = true,
            ),
            requireNotNull(teacher.id),
            false,
        )
        val module = moduleService.create(
            course.id, CourseModuleRequest(title = "Algoritmlar kirish"), requireNotNull(teacher.id), false,
        )
        moduleService.changeStatus(course.id, module.id, LearningItemStatus.PUBLISHED, requireNotNull(teacher.id), false)
        val content = contentService.create(
            course.id,
            module.id,
            CourseContentRequest(
                title = "Birinchi mavzu",
                contentType = CourseContentType.LINK,
                contentUrl = "https://lms.example.uz/algorithms/1",
                languageCode = "uz",
                authorName = "Algoritmlar kafedrasi",
                contentVersion = "1.0",
                sourceName = "Universitet LMS",
                sourceUrl = "https://lms.example.uz/catalog/algorithms/1",
                validFrom = LocalDate.of(2026, 1, 1),
            ),
            requireNotNull(teacher.id),
            false,
        )
        approveContent(course.id, content.id, requireNotNull(teacher.id))
        contentService.changeStatus(course.id, content.id, LearningItemStatus.PUBLISHED, requireNotNull(teacher.id), false)

        val initial = studyPlanService.studyPlan(requireNotNull(student.user.id), "2026-2027")
        assertEquals(6, initial.totalCredits)
        assertEquals(0, initial.overallProgress)
        assertEquals(2, initial.courses.single().semester)
        assertEquals("Algoritmlar nazariyasi", initial.courses.single().subjectName)

        val partial = studyPlanService.recordContentProgress(
            course.id, content.id, 50, requireNotNull(student.user.id),
        )
        assertEquals(50, partial.progress)
        assertEquals("active", partial.status)

        val completed = studyPlanService.recordContentProgress(
            course.id, content.id, 100, requireNotNull(student.user.id),
        )
        assertEquals(100, completed.progress)
        assertEquals(1, completed.completedContents)
        assertEquals("completed", completed.status)

        val finalPlan = studyPlanService.studyPlan(requireNotNull(student.user.id), "2026-2027")
        assertEquals(100, finalPlan.overallProgress)
        assertEquals(6, finalPlan.completedCredits)
        assertEquals("completed", finalPlan.courses.single().status)
        assertEquals(2, learningActivityEventRepository.countByEnrollmentIdAndDeletedFalse(
            finalPlan.courses.single().enrollmentId,
        ))
    }

    @Test
    fun `individual reja SCORM natijasini fan progressiga qoshib hisoblaydi`() {
        val teacher = user("study-plan-scorm-teacher")
        val student = student("10000000000006", "ST-PLAN-002", "study-plan-scorm-student")
        val created = courseService.create(
            CourseCreateRequest(title = "SCORM fan"), requireNotNull(teacher.id),
        )
        courseService.changeStatus(created.id, CourseStatus.PUBLISHED, requireNotNull(teacher.id), false)
        enrollmentService.enroll(
            created.id,
            CourseEnrollmentRequest(
                studentIds = setOf(requireNotNull(student.id)),
                academicYear = "2026-2027",
                semester = 1,
                credits = 4,
            ),
            requireNotNull(teacher.id),
            false,
        )
        val course = courseRepository.findById(created.id).orElseThrow()
        val pack = scormPackageRepository.save(ScormPackage(
            course = course,
            title = "SCORM progress paketi",
            version = ScormVersion.SCORM_2004,
            entryPoint = "index.html",
            storageKey = "study-plan-scorm-package",
            sha256 = "a".repeat(64),
            importedBy = teacher.username,
        ))
        val attempt = scormAttemptRepository.save(ScormAttempt(
            scormPackage = pack,
            userId = requireNotNull(student.user.id),
            status = ScormAttemptStatus.IN_PROGRESS,
            progressMeasure = 0.4,
        ))

        assertEquals(40, studyPlanService.courseProgress(created.id, requireNotNull(student.user.id)).progress)
        attempt.status = ScormAttemptStatus.PASSED
        attempt.progressMeasure = 1.0
        scormAttemptRepository.save(attempt)

        val completed = studyPlanService.studyPlan(requireNotNull(student.user.id), "2026-2027")
        assertEquals(100, completed.overallProgress)
        assertEquals(1, completed.courses.single().completedScormPackages)
        assertEquals(4, completed.completedCredits)
    }

    @Test
    fun `student faqat amal qilayotgan kontentni koradi va progress yozadi`() {
        val teacher = user("content-validity-teacher")
        val student = student("10000000000007", "ST-CONT-007", "content-validity-student")
        val course = compliantCourse(teacher, "Metadata kursi", "Metadata fani", student)
        courseService.changeStatus(course.id, CourseStatus.PUBLISHED, requireNotNull(teacher.id), false)
        enrollmentService.enroll(course.id, setOf(requireNotNull(student.id)), requireNotNull(teacher.id), false)
        val module = moduleService.create(
            course.id, CourseModuleRequest(title = "Metadata modul"), requireNotNull(teacher.id), false,
        )
        moduleService.changeStatus(course.id, module.id, LearningItemStatus.PUBLISHED, requireNotNull(teacher.id), false)
        val today = LocalDate.now()
        val content = contentService.create(
            course.id,
            module.id,
            CourseContentRequest(
                title = "Rejalangan material",
                contentType = CourseContentType.DOCUMENT,
                contentUrl = "https://content.example.uz/material.pdf",
                languageCode = "uz",
                authorName = "Metodika bo'limi",
                contentVersion = "1.0",
                sourceName = "Tasdiqlangan metodik fond",
                sourceUrl = "https://content.example.uz/catalog/material",
                validFrom = today.plusDays(1),
                validUntil = today.plusYears(1),
            ),
            requireNotNull(teacher.id),
            false,
        )
        approveContent(course.id, content.id, requireNotNull(teacher.id))
        contentService.changeStatus(course.id, content.id, LearningItemStatus.PUBLISHED, requireNotNull(teacher.id), false)
        assertTrue(contentService.list(course.id, requireNotNull(student.user.id), false).isEmpty())
        assertThrows<NoSuchElementException> {
            studyPlanService.recordContentProgress(course.id, content.id, 100, requireNotNull(student.user.id))
        }

        contentService.update(
            course.id,
            content.id,
            CourseContentRequest(
                title = "Amaldagi material",
                contentType = CourseContentType.DOCUMENT,
                contentUrl = "https://content.example.uz/material-v2.pdf",
                languageCode = "uz",
                authorName = "Metodika bo'limi",
                contentVersion = "2.0",
                sourceName = "Tasdiqlangan metodik fond",
                sourceUrl = "https://content.example.uz/catalog/material-v2",
                validFrom = today.minusDays(1),
                validUntil = today.plusYears(1),
            ),
            requireNotNull(teacher.id),
            false,
        )
        approveContent(course.id, content.id, requireNotNull(teacher.id))
        contentService.changeStatus(course.id, content.id, LearningItemStatus.PUBLISHED, requireNotNull(teacher.id), false)
        assertEquals(1, contentService.list(course.id, requireNotNull(student.user.id), false).size)
        assertEquals(100, studyPlanService.recordContentProgress(
            course.id, content.id, 100, requireNotNull(student.user.id),
        ).progress)

        contentService.update(
            course.id,
            content.id,
            CourseContentRequest(
                title = "Muddati tugagan material",
                contentType = CourseContentType.DOCUMENT,
                contentUrl = "https://content.example.uz/material-v3.pdf",
                languageCode = "uz",
                authorName = "Metodika bo'limi",
                contentVersion = "3.0",
                sourceName = "Tasdiqlangan metodik fond",
                validFrom = today.minusYears(1),
                validUntil = today.minusDays(1),
            ),
            requireNotNull(teacher.id),
            false,
        )
        assertTrue(contentService.list(course.id, requireNotNull(student.user.id), false).isEmpty())
        approveContent(course.id, content.id, requireNotNull(teacher.id))
        contentService.changeStatus(course.id, content.id, LearningItemStatus.DRAFT, requireNotNull(teacher.id), false)
        assertThrows<IllegalArgumentException> {
            contentService.changeStatus(course.id, content.id, LearningItemStatus.PUBLISHED, requireNotNull(teacher.id), false)
        }
        assertEquals(3, contentService.revisions(course.id, content.id, requireNotNull(teacher.id), false).size)
    }

    @Test
    fun `kontent egasidan mustaqil ekspert qarorisiz joriy revision nashr qilinmaydi`() {
        val teacher = user("review-workflow-teacher")
        val reviewer = user("review-workflow-metodist")
        val course = compliantCourse(teacher, "Ekspertiza kursi", "Ekspertiza fani")
        courseService.changeStatus(course.id, CourseStatus.PUBLISHED, requireNotNull(teacher.id), false)
        val module = moduleService.create(
            course.id, CourseModuleRequest(title = "Ekspertiza moduli"), requireNotNull(teacher.id), false,
        )
        moduleService.changeStatus(course.id, module.id, LearningItemStatus.PUBLISHED, requireNotNull(teacher.id), false)
        val content = contentService.create(
            course.id,
            module.id,
            CourseContentRequest(
                title = "Ekspertiza materiali",
                contentType = CourseContentType.DOCUMENT,
                contentUrl = "https://content.example.uz/review-v1.pdf",
                languageCode = "uz",
                authorName = "Test muallifi",
                contentVersion = "1.0",
                sourceName = "Metodik fond",
                validFrom = LocalDate.now(),
            ),
            requireNotNull(teacher.id),
            false,
        )

        val firstReview = contentReviewService.submit(course.id, content.id, requireNotNull(teacher.id), false)
        assertEquals("pending", firstReview.status)
        assertThrows<IllegalArgumentException> {
            contentReviewService.submit(course.id, content.id, requireNotNull(teacher.id), false)
        }
        assertThrows<IllegalArgumentException> {
            contentReviewService.decide(
                firstReview.id,
                ContentReviewDecisionRequest(ContentReviewDecision.APPROVED),
                requireNotNull(teacher.id),
                true,
            )
        }
        assertThrows<IllegalArgumentException> {
            contentService.update(
                course.id,
                content.id,
                CourseContentRequest(
                    title = "Ekspertizadagi tahrir",
                    contentType = CourseContentType.DOCUMENT,
                    languageCode = "uz",
                    authorName = "Test muallifi",
                    contentVersion = "2.0",
                    sourceName = "Metodik fond",
                    validFrom = LocalDate.now(),
                ),
                requireNotNull(teacher.id),
                false,
            )
        }
        assertThrows<IllegalArgumentException> {
            contentReviewService.decide(
                firstReview.id,
                ContentReviewDecisionRequest(ContentReviewDecision.CHANGES_REQUESTED, "qisqa"),
                requireNotNull(reviewer.id),
                true,
            )
        }
        val rejected = contentReviewService.decide(
            firstReview.id,
            ContentReviewDecisionRequest(ContentReviewDecision.CHANGES_REQUESTED, "Manba izohini aniqlashtiring"),
            requireNotNull(reviewer.id),
            true,
        )
        assertEquals("changes_requested", rejected.status)
        assertThrows<IllegalArgumentException> {
            contentService.changeStatus(course.id, content.id, LearningItemStatus.PUBLISHED, requireNotNull(teacher.id), false)
        }

        val revised = contentService.update(
            course.id,
            content.id,
            CourseContentRequest(
                title = "Tuzatilgan ekspertiza materiali",
                contentType = CourseContentType.DOCUMENT,
                contentUrl = "https://content.example.uz/review-v2.pdf",
                languageCode = "uz",
                authorName = "Test muallifi",
                contentVersion = "2.0",
                sourceName = "Aniqlashtirilgan metodik fond",
                validFrom = LocalDate.now(),
            ),
            requireNotNull(teacher.id),
            false,
        )
        assertEquals("draft", revised.reviewStatus)
        val secondReview = contentReviewService.submit(course.id, content.id, requireNotNull(teacher.id), false)
        contentReviewService.decide(
            secondReview.id,
            ContentReviewDecisionRequest(ContentReviewDecision.APPROVED, "Talablar bajarildi"),
            requireNotNull(reviewer.id),
            true,
        )
        val published = contentService.changeStatus(
            course.id, content.id, LearningItemStatus.PUBLISHED, requireNotNull(teacher.id), false,
        )
        assertEquals("approved", published.reviewStatus)
        assertEquals(2, published.approvedRevisionNumber)
        assertEquals(
            listOf("approved", "changes_requested"),
            contentReviewService.history(course.id, content.id, requireNotNull(teacher.id), false).map { it.status },
        )
        assertTrue(contentReviewService.pending(true).none { it.contentId == content.id })
    }

    private fun user(username: String): User = userRepository.save(User(
        username = username,
        password = "test-password-hash",
        fullName = username,
    ))

    private fun compliantCourse(
        owner: User,
        title: String,
        subjectName: String,
        vararg students: StudentProfile,
    ): uz.scorm.lms.app.v1.courses.dto.CourseDto {
        val program = programRepository.save(Program(
            name = "$title dasturi",
            active = true,
            distanceEnabled = true,
            fullTimeAvailable = true,
            fullTimeBasisReference = "BUYRUQ-3/2026",
            fullTimeDurationMonths = 48,
            distanceDurationMonths = 48,
            educationLanguage = "uz",
        ))
        students.forEach { student ->
            student.programId = requireNotNull(program.id)
            student.educationLanguage = "uz"
            studentRepository.save(student)
        }
        val subject = subjectRepository.save(Subject(name = subjectName, active = true, program = program))
        return courseService.create(
            CourseCreateRequest(
                title = title,
                subjectId = requireNotNull(subject.id),
                language = "uz",
            ),
            requireNotNull(owner.id),
        )
    }

    private fun approveContent(courseId: Long, contentId: Long, ownerId: Long) {
        val submitted = contentReviewService.submit(courseId, contentId, ownerId, false)
        val reviewer = user("content-reviewer-$contentId-${submitted.revisionNumber}")
        val approved = contentReviewService.decide(
            submitted.id,
            ContentReviewDecisionRequest(ContentReviewDecision.APPROVED, "Metodik talablar tekshirildi"),
            requireNotNull(reviewer.id),
            true,
        )
        assertEquals("approved", approved.status)
    }

    private fun student(pinfl: String, number: String, username: String): StudentProfile {
        val user = user(username)
        return studentRepository.save(StudentProfile(
            user = user,
            pinfl = pinfl,
            lastName = "Testov",
            firstName = "Talaba",
            birthDate = LocalDate.of(2002, 1, 1),
            gender = Gender.MALE,
            studentNumber = number,
        ))
    }
}
