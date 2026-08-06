package uz.scorm.lms.app.v1.exam

import jakarta.transaction.Transactional
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.ActiveProfiles
import uz.scorm.lms.app.v1.courses.dto.CourseCreateRequest
import uz.scorm.lms.app.v1.courses.dto.CourseEnrollmentRequest
import uz.scorm.lms.app.v1.courses.model.CourseStatus
import uz.scorm.lms.app.v1.courses.repository.CourseEnrollmentRepository
import uz.scorm.lms.app.v1.courses.service.CourseEnrollmentService
import uz.scorm.lms.app.v1.courses.service.CourseService
import uz.scorm.lms.app.v1.exam.dto.*
import uz.scorm.lms.app.v1.exam.model.AppealStatus
import uz.scorm.lms.app.v1.exam.model.AttendanceStatus
import uz.scorm.lms.app.v1.exam.model.ExamType
import uz.scorm.lms.app.v1.exam.service.ExamAttendanceService
import uz.scorm.lms.app.v1.exam.service.ExamResultService
import uz.scorm.lms.app.v1.exam.service.ExamSessionService
import uz.scorm.lms.app.v1.student.model.Gender
import uz.scorm.lms.app.v1.student.model.StudentProfile
import uz.scorm.lms.app.v1.student.repository.StudentRepository
import uz.scorm.lms.app.v1.user.model.User
import uz.scorm.lms.app.v1.user.repository.UserRepository
import java.math.BigDecimal
import java.time.LocalDate
import java.time.LocalTime

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class ExamWorkflowIntegrationTest {
    @Autowired private lateinit var sessions: ExamSessionService
    @Autowired private lateinit var attendance: ExamAttendanceService
    @Autowired private lateinit var results: ExamResultService
    @Autowired private lateinit var courseService: CourseService
    @Autowired private lateinit var enrollmentService: CourseEnrollmentService
    @Autowired private lateinit var enrollmentRepository: CourseEnrollmentRepository
    @Autowired private lateinit var userRepository: UserRepository
    @Autowired private lateinit var studentRepository: StudentRepository

    @Test
    fun `yakuniy nazorat davomat baho yakunlash va apellyatsiya oqimi ishlaydi`() {
        val teacher = user("exam-teacher")
        val student = student("50000000000001", "ST-EX-001", "exam-student")
        val course = publishedCourse(teacher, "Yakuniy nazorat kursi")
        enrollmentService.enroll(course.id, CourseEnrollmentRequest(setOf(student.id!!)), teacher.id!!, false)
        val enrollment = enrollmentRepository.findByCourseIdAndStudentId(course.id, student.id!!)!!

        val session = sessions.createExamSession(
            CreateExamSessionRequest(course.id, title = "Semestr yakuniy nazorati", examDate = LocalDate.now(),
                examTime = LocalTime.of(10, 0), location = "A bino, 101-xona", examType = ExamType.WRITTEN),
            teacher.id!!, false,
        )
        sessions.publishExamSession(session.id.toLong(), PublishExamSessionRequest(), teacher.id!!, false)
        val sheet = attendance.sheet(session.id.toLong(), teacher.id!!, false)
        assertEquals(1, sheet.totalEnrolled)
        assertEquals("EXPECTED", sheet.attendanceRecords.single().status)

        sessions.startExamSession(session.id.toLong(), teacher.id!!, false)
        val verified = attendance.record(session.id.toLong(), enrollment.id!!,
            RecordAttendanceRequest(AttendanceStatus.PRESENT), teacher.id!!, false)
        assertNotNull(verified.verificationTime)
        assertEquals(teacher.fullName, verified.verifiedBy)

        val result = results.record(session.id.toLong(), enrollment.id!!,
            RecordExamResultRequest(enrollment.id!!, BigDecimal("75"), grade = "A"), teacher.id!!, false)
        assertEquals(75.0, result.percentage)
        assertEquals("C", result.grade)
        assertTrue(result.passed)
        sessions.completeExamSession(session.id.toLong(), CompleteExamSessionRequest(), teacher.id!!, false)

        val studentResults = results.studentResults(student.user.id!!)
        assertEquals(1, studentResults.size)
        val appeal = results.appeal(ExamAppealRequestDto(result.id.toLong(), "Natijamni qayta tekshirishingizni so'rayman"), student.user.id!!)
        assertEquals("PENDING", appeal.status)
        val reviewed = results.reviewAppeal(appeal.id.toLong(),
            ReviewExamAppealRequest(AppealStatus.APPROVED, "Yozma ish qayta tekshirildi", BigDecimal("85")), teacher.id!!, false)
        assertEquals("APPROVED", reviewed.status)
        assertEquals(85.0, reviewed.newScore)
        assertEquals("B", results.teacherResults(session.id.toLong(), teacher.id!!, false).single().grade)
    }

    @Test
    fun `begona oqituvchi davomat va bahoga kira olmaydi hamda davomatsiz baho bloklanadi`() {
        val teacher = user("exam-guard-teacher")
        val otherTeacher = user("exam-guard-other")
        val student = student("50000000000002", "ST-EX-002", "exam-guard-student")
        val course = publishedCourse(teacher, "Nazorat vakolati")
        enrollmentService.enroll(course.id, CourseEnrollmentRequest(setOf(student.id!!)), teacher.id!!, false)
        val enrollment = enrollmentRepository.findByCourseIdAndStudentId(course.id, student.id!!)!!
        val session = sessions.createExamSession(CreateExamSessionRequest(course.id, title = "Himoyalangan nazorat",
            examDate = LocalDate.now(), examTime = LocalTime.NOON, location = "202-xona"), teacher.id!!, false)
        sessions.publishExamSession(session.id.toLong(), null, teacher.id!!, false)
        sessions.startExamSession(session.id.toLong(), teacher.id!!, false)

        assertThrows(IllegalArgumentException::class.java) {
            attendance.record(session.id.toLong(), enrollment.id!!, RecordAttendanceRequest(AttendanceStatus.PRESENT), otherTeacher.id!!, false)
        }
        assertThrows(IllegalArgumentException::class.java) {
            results.record(session.id.toLong(), enrollment.id!!, RecordExamResultRequest(enrollment.id!!, BigDecimal("80")), teacher.id!!, false)
        }
        attendance.record(session.id.toLong(), enrollment.id!!, RecordAttendanceRequest(AttendanceStatus.ABSENT), teacher.id!!, false)
        assertThrows(IllegalArgumentException::class.java) {
            results.record(session.id.toLong(), enrollment.id!!, RecordExamResultRequest(enrollment.id!!, BigDecimal("80")), teacher.id!!, false)
        }
    }

    private fun publishedCourse(teacher: User, title: String) = courseService.create(CourseCreateRequest(title = title), teacher.id!!).also {
        courseService.changeStatus(it.id, CourseStatus.PUBLISHED, teacher.id!!, false)
    }
    private fun user(username: String) = userRepository.save(User(username = username, password = "test-password", fullName = username))
    private fun student(pinfl: String, number: String, username: String) = studentRepository.save(StudentProfile(
        user = user(username), pinfl = pinfl, lastName = "Testov", firstName = "Talaba", birthDate = LocalDate.of(2002, 1, 1),
        gender = Gender.MALE, studentNumber = number,
    ))
}
