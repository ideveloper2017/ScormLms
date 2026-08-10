package uz.scorm.lms.app.v1.academicperiod

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.ActiveProfiles
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.academicperiod.dto.CreateAcademicYearRequest
import uz.scorm.lms.app.v1.academicperiod.dto.UpdateAcademicSemesterRequest
import uz.scorm.lms.app.v1.academicperiod.dto.UpdateAcademicYearStateRequest
import uz.scorm.lms.app.v1.academicperiod.service.AcademicPeriodService
import uz.scorm.lms.app.v1.user.model.User
import uz.scorm.lms.app.v1.user.repository.UserRepository

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class AcademicPeriodServiceIntegrationTest {
    @Autowired private lateinit var service: AcademicPeriodService
    @Autowired private lateinit var userRepository: UserRepository

    @Test
    fun `seeded years and semesters provide one controlled active catalog`() {
        val years = service.listYears(true)
        assertTrue(years.any { it.code == "2026-2027" && it.current && it.active })
        assertEquals(1, years.count { it.current })
        assertEquals((1..12).toList(), service.listSemesters(true).map { it.semesterNumber })
        assertEquals(2, service.requireActiveSemester(3).courseNumber)
    }

    @Test
    fun `new current year replaces previous current without changing historical codes`() {
        val actor = actor()
        val created = service.createYear(CreateAcademicYearRequest("2029-2030", active = true, current = true), requireNotNull(actor.id))

        assertEquals("2029-2030", created.code)
        assertTrue(created.current)
        assertEquals(1, service.listYears(true).count { it.current })
        assertFalse(service.listYears(true).single { it.code == "2026-2027" }.current)
        assertThrows<IllegalArgumentException> {
            service.updateYearState(created.id, UpdateAcademicYearStateRequest(active = false, current = false), requireNotNull(actor.id))
        }
    }

    @Test
    fun `inactive semester is rejected by new curriculum flows`() {
        val actor = actor()
        val semester = service.listSemesters(true).single { it.semesterNumber == 12 }
        service.updateSemester(semester.id, UpdateAcademicSemesterRequest(semester.nameUz, active = false), requireNotNull(actor.id))

        assertThrows<IllegalArgumentException> { service.requireActiveSemester(12) }
    }

    private fun actor() = userRepository.save(User(
        username = "academic-period-${System.nanoTime()}",
        password = "encoded-password",
        fullName = "Akademik registrator",
    ))
}
