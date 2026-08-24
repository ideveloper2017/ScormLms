package uz.scorm.lms.app.v1.rereading

import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import uz.scorm.lms.app.v1.academicresult.service.AcademicAnalyticsService
import uz.scorm.lms.app.v1.audit.service.AuditService
import uz.scorm.lms.app.v1.courses.repository.CourseEnrollmentRepository
import uz.scorm.lms.app.v1.group.repository.GroupRepository
import uz.scorm.lms.app.v1.rereading.dto.SaveReReadingApplicationRequest
import uz.scorm.lms.app.v1.rereading.dto.SaveReReadingPlanRequest
import uz.scorm.lms.app.v1.rereading.model.ReReadingPlan
import uz.scorm.lms.app.v1.rereading.model.ReReadingPlanStatus
import uz.scorm.lms.app.v1.rereading.repository.ReReadingApplicationRepository
import uz.scorm.lms.app.v1.rereading.repository.ReReadingPlanRepository
import uz.scorm.lms.app.v1.rereading.service.ReReadingService
import uz.scorm.lms.app.v1.student.repository.StudentRepository
import uz.scorm.lms.app.v1.teacher.repository.TeacherRepository
import java.math.BigDecimal
import java.time.LocalDate

class ReReadingServiceTest {
    private val plans = mockk<ReReadingPlanRepository>()
    private val applications = mockk<ReReadingApplicationRepository>()
    private val students = mockk<StudentRepository>()
    private val groups = mockk<GroupRepository>()
    private val enrollments = mockk<CourseEnrollmentRepository>()
    private val teachers = mockk<TeacherRepository>()
    private val analytics = mockk<AcademicAnalyticsService>()
    private val audit = mockk<AuditService>(relaxed = true)
    private val service = ReReadingService(plans, applications, students, groups, enrollments, teachers, analytics, audit)

    @Test
    fun `muddat va holat bilan qayta oqish rejasi yaratiladi`() {
        every { plans.save(any()) } answers { firstArg<ReReadingPlan>().apply { id = 12 } }
        val deadline = LocalDate.now().plusDays(10)

        val result = service.createPlan(SaveReReadingPlanRequest("  Kuzgi reja  ", deadline, "Ariza oynasi", ReReadingPlanStatus.OPEN), 4)

        assertEquals(12, result.id)
        assertEquals("Kuzgi reja", result.title)
        assertEquals(deadline, result.applicationDeadline)
        verify { audit.logAction("RE_READING_PLAN_CREATED", 4, match { it.contains("id=12") }) }
    }

    @Test
    fun `tolangan summa jami summadan oshsa ariza rad etiladi`() {
        val request = SaveReReadingApplicationRequest(
            planId = 1, studentId = 2, totalCredits = 6,
            totalAmount = BigDecimal("100000"), paidAmount = BigDecimal("100001"),
        )
        assertThrows<IllegalArgumentException> { service.createApplication(request, 3) }
    }
}
