package uz.scorm.lms.app.v1.courses

import io.mockk.every
import io.mockk.mockk
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test
import uz.scorm.lms.app.v1.courses.dto.CourseUpdateRequest
import uz.scorm.lms.app.v1.courses.model.Course
import uz.scorm.lms.app.v1.courses.model.CourseExpiryPeriodType
import uz.scorm.lms.app.v1.courses.repository.CourseRepository
import uz.scorm.lms.app.v1.courses.service.CourseAccessService
import uz.scorm.lms.app.v1.courses.service.CourseService
import java.time.LocalDate

class CourseDateUpdateTest {
    private val repository = mockk<CourseRepository>()
    private val access = mockk<CourseAccessService>()
    private val service = CourseService(repository, mockk(relaxed = true), access,
        mockk(), mockk(relaxed = true), mockk(), mockk())
    private val course = Course(title = "Kurs", userId = 1,
        startDate = LocalDate.of(2026, 9, 1), endDate = LocalDate.of(2026, 10, 1)).apply { id = 10 }

    init {
        every { access.requireManage(10, 1, false) } returns course
        every { repository.save(course) } returns course
    }

    @Test
    fun `omitted dates remain unchanged when only title is edited`() {
        val result = service.update(10, CourseUpdateRequest(title = "Yangi nom"), 1, false)
        assertEquals(LocalDate.of(2026, 9, 1), result.startDate)
        assertEquals(LocalDate.of(2026, 10, 1), result.endDate)
    }

    @Test
    fun `explicit clear removes dates when changing to lifetime`() {
        course.expiryPeriodType = CourseExpiryPeriodType.LIMITED_TIME.name
        val result = service.update(10, CourseUpdateRequest(clearStartDate = true, clearEndDate = true,
            expiryPeriodType = CourseExpiryPeriodType.LIFETIME), 1, false)
        assertNull(result.startDate)
        assertNull(result.endDate)
    }

    @Test
    fun `a limited course still requires an end date`() {
        course.expiryPeriodType = CourseExpiryPeriodType.LIMITED_TIME.name
        assertThrows(IllegalArgumentException::class.java) {
            service.update(10, CourseUpdateRequest(clearEndDate = true), 1, false)
        }
    }

    @Test
    fun `replacement dates are validated together`() {
        assertThrows(IllegalArgumentException::class.java) {
            service.update(10, CourseUpdateRequest(startDate = LocalDate.of(2026, 11, 1)), 1, false)
        }
        assertEquals(LocalDate.of(2026, 9, 1), course.startDate)
    }
}
