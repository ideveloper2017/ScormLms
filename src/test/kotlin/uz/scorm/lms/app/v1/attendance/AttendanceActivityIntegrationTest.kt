package uz.scorm.lms.app.v1.attendance

import jakarta.transaction.Transactional
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.ActiveProfiles
import uz.scorm.lms.app.v1.attendance.dto.AttendanceSessionRequest
import uz.scorm.lms.app.v1.attendance.model.LearningActivitySource
import uz.scorm.lms.app.v1.attendance.model.LearningActivityType
import uz.scorm.lms.app.v1.attendance.repository.LearningActivityEventRepository
import uz.scorm.lms.app.v1.attendance.service.AttendanceService
import uz.scorm.lms.app.v1.attendance.service.LearningActivityService
import uz.scorm.lms.app.v1.courses.dto.CourseCreateRequest
import uz.scorm.lms.app.v1.courses.dto.CourseEnrollmentRequest
import uz.scorm.lms.app.v1.courses.model.CourseStatus
import uz.scorm.lms.app.v1.courses.service.CourseEnrollmentService
import uz.scorm.lms.app.v1.courses.service.CourseService
import uz.scorm.lms.app.v1.courses.repository.CourseRepository
import uz.scorm.lms.app.v1.courses.repository.CourseEnrollmentRepository
import uz.scorm.lms.app.v1.scorm.dto.ScormRuntimeUpdateRequest
import uz.scorm.lms.app.v1.scorm.model.ScormPackage
import uz.scorm.lms.app.v1.scorm.model.ScormVersion
import uz.scorm.lms.app.v1.scorm.repository.ScormPackageRepository
import uz.scorm.lms.app.v1.scorm.service.ScormService
import uz.scorm.lms.app.v1.student.model.Gender
import uz.scorm.lms.app.v1.student.model.StudentProfile
import uz.scorm.lms.app.v1.student.repository.StudentRepository
import uz.scorm.lms.app.v1.user.model.User
import uz.scorm.lms.app.v1.user.repository.UserRepository
import java.time.Duration
import java.time.Instant
import java.time.LocalDate

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class AttendanceActivityIntegrationTest {
    @Autowired private lateinit var attendanceService: AttendanceService
    @Autowired private lateinit var activityService: LearningActivityService
    @Autowired private lateinit var activityRepository: LearningActivityEventRepository
    @Autowired private lateinit var courseService: CourseService
    @Autowired private lateinit var enrollmentService: CourseEnrollmentService
    @Autowired private lateinit var userRepository: UserRepository
    @Autowired private lateinit var studentRepository: StudentRepository
    @Autowired private lateinit var courseRepository: CourseRepository
    @Autowired private lateinit var scormPackageRepository: ScormPackageRepository
    @Autowired private lateinit var scormService: ScormService
    @Autowired private lateinit var courseEnrollmentRepository: CourseEnrollmentRepository

    @Test
    fun `davomat login emas kurs faolligi asosida present va absent hisoblaydi`() {
        val teacher = user("attendance-teacher")
        val activeStudent = student("10000000000011", "ST-ATT-001", "attendance-student-active")
        val inactiveStudent = student("10000000000012", "ST-ATT-002", "attendance-student-inactive")
        val course = publishedCourse(teacher, "Masofaviy matematika")
        enrollmentService.enroll(
            course.id,
            CourseEnrollmentRequest(setOf(requireNotNull(activeStudent.id), requireNotNull(inactiveStudent.id))),
            requireNotNull(teacher.id),
            false,
        )
        val opensAt = Instant.now().minus(Duration.ofDays(2))
        val closesAt = opensAt.plus(Duration.ofHours(2))
        backdateEnrollment(course.id, requireNotNull(activeStudent.id), opensAt.minusSeconds(1))
        backdateEnrollment(course.id, requireNotNull(inactiveStudent.id), opensAt.minusSeconds(1))
        attendanceService.createSession(
            AttendanceSessionRequest(
                courseId = course.id,
                title = "1-mavzu faolligi",
                opensAt = opensAt,
                closesAt = closesAt,
            ),
            requireNotNull(teacher.id),
            false,
        )
        activityService.recordIfEnrolled(
            courseId = course.id,
            userId = requireNotNull(activeStudent.user.id),
            eventType = LearningActivityType.CONTENT_COMPLETED,
            sourceType = LearningActivitySource.COURSE_CONTENT,
            sourceId = 101,
            occurredAt = opensAt.plus(Duration.ofMinutes(15)),
        )

        val activeRecord = attendanceService.studentRecords(requireNotNull(activeStudent.user.id)).single()
        val inactiveRecord = attendanceService.studentRecords(requireNotNull(inactiveStudent.user.id)).single()
        assertEquals("present", activeRecord.status)
        assertEquals("absent", inactiveRecord.status)
        assertEquals(100.0, attendanceService.studentStats(requireNotNull(activeStudent.user.id)).attendancePercentage)
        assertEquals(0.0, attendanceService.studentStats(requireNotNull(inactiveStudent.user.id)).attendancePercentage)

        val teacherSummary = attendanceService.teacherSessions(requireNotNull(teacher.id), false).single()
        assertEquals(1, teacherSummary.present)
        assertEquals(1, teacherSummary.absent)
        assertEquals(2, teacherSummary.total)
        assertEquals(1, activityRepository.countByEnrollmentIdAndDeletedFalse(
            enrollmentId(course.id, requireNotNull(activeStudent.id)),
        ))
    }

    @Test
    fun `minimal SCORM vaqti va kechikish chegarasi dalildan hisoblanadi`() {
        val teacher = user("attendance-late-teacher")
        val student = student("10000000000013", "ST-ATT-003", "attendance-student-late")
        val course = publishedCourse(teacher, "SCORM davomat")
        enrollmentService.enroll(
            course.id,
            CourseEnrollmentRequest(setOf(requireNotNull(student.id))),
            requireNotNull(teacher.id),
            false,
        )
        val opensAt = Instant.now().minus(Duration.ofDays(3))
        val closesAt = opensAt.plus(Duration.ofHours(2))
        val lateAfter = opensAt.plus(Duration.ofMinutes(10))
        backdateEnrollment(course.id, requireNotNull(student.id), opensAt.minusSeconds(1))
        attendanceService.createSession(
            AttendanceSessionRequest(
                courseId = course.id,
                title = "SCORM amaliyoti",
                opensAt = opensAt,
                closesAt = closesAt,
                lateAfter = lateAfter,
                minimumActivitySeconds = 60,
            ),
            requireNotNull(teacher.id),
            false,
        )
        activityService.recordIfEnrolled(
            courseId = course.id,
            userId = requireNotNull(student.user.id),
            eventType = LearningActivityType.SCORM_COMMITTED,
            sourceType = LearningActivitySource.SCORM_PACKAGE,
            sourceId = 202,
            durationSeconds = 90,
            occurredAt = lateAfter.plusSeconds(1),
        )

        val record = attendanceService.studentRecords(requireNotNull(student.user.id)).single()
        assertEquals("late", record.status)
        val stats = attendanceService.studentStats(requireNotNull(student.user.id))
        assertEquals(1, stats.attended)
        assertEquals(1, stats.late)
        assertEquals(100.0, stats.attendancePercentage)
    }

    @Test
    fun `SCORM launch va commit avtomatik oquv faolligi hodisasini yaratadi`() {
        val teacher = user("attendance-scorm-teacher")
        val student = student("10000000000014", "ST-ATT-004", "attendance-scorm-student")
        val created = publishedCourse(teacher, "SCORM avtomatik davomat")
        enrollmentService.enroll(
            created.id,
            CourseEnrollmentRequest(setOf(requireNotNull(student.id))),
            requireNotNull(teacher.id),
            false,
        )
        val opensAt = Instant.now().minus(Duration.ofMinutes(10))
        attendanceService.createSession(
            AttendanceSessionRequest(
                courseId = created.id,
                title = "Jonli SCORM faolligi",
                opensAt = opensAt,
                closesAt = opensAt.plus(Duration.ofMinutes(20)),
                minimumActivitySeconds = 60,
            ),
            requireNotNull(teacher.id),
            false,
        )
        val course = courseRepository.findById(created.id).orElseThrow()
        val pack = scormPackageRepository.save(ScormPackage(
            course = course,
            title = "Davomat SCORM paketi",
            version = ScormVersion.SCORM_1_2,
            entryPoint = "index.html",
            storageKey = "attendance-scorm-package",
            sha256 = "b".repeat(64),
            importedBy = teacher.username,
        ))
        val launch = scormService.launch(requireNotNull(pack.id), requireNotNull(student.user.id))
        scormService.updateRuntime(
            launch.dto.attemptId,
            requireNotNull(student.user.id),
            ScormRuntimeUpdateRequest(values = mapOf(
                "cmi.core.lesson_status" to "incomplete",
                "cmi.core.session_time" to "00:01:30",
            )),
        )

        val record = attendanceService.studentRecords(requireNotNull(student.user.id)).single()
        assertEquals("present", record.status)
        assertEquals(2, activityRepository.countByEnrollmentIdAndDeletedFalse(
            enrollmentId(created.id, requireNotNull(student.id)),
        ))
    }

    private fun publishedCourse(teacher: User, title: String) = courseService.create(
        CourseCreateRequest(title = title), requireNotNull(teacher.id),
    ).also {
        courseService.changeStatus(it.id, CourseStatus.PUBLISHED, requireNotNull(teacher.id), false)
    }

    private fun enrollmentId(courseId: Long, studentId: Long): Long = requireNotNull(
        courseEnrollmentRepository.findByCourseIdAndStudentId(courseId, studentId)?.id
    )

    private fun backdateEnrollment(courseId: Long, studentId: Long, enrolledAt: Instant) {
        val enrollment = courseEnrollmentRepository.findByCourseIdAndStudentId(courseId, studentId)
            ?: error("Test enrollment topilmadi")
        enrollment.enrolledAt = enrolledAt
        courseEnrollmentRepository.save(enrollment)
    }

    private fun user(username: String): User = userRepository.save(User(
        username = username,
        password = "test-password-hash",
        fullName = username,
    ))

    private fun student(pinfl: String, number: String, username: String): StudentProfile = studentRepository.save(
        StudentProfile(
            user = user(username),
            pinfl = pinfl,
            lastName = "Testov",
            firstName = "Talaba",
            birthDate = LocalDate.of(2002, 1, 1),
            gender = Gender.MALE,
            studentNumber = number,
        )
    )
}
