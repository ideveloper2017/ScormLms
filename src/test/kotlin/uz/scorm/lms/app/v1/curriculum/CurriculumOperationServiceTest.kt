package uz.scorm.lms.app.v1.curriculum

import io.mockk.every
import io.mockk.mockk
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import uz.scorm.lms.app.v1.academicperiod.service.AcademicPeriodService
import uz.scorm.lms.app.v1.curriculum.dto.AssignCurriculumStudentsRequest
import uz.scorm.lms.app.v1.curriculum.model.CurriculumStatus
import uz.scorm.lms.app.v1.curriculum.model.ProgramCurriculumVersion
import uz.scorm.lms.app.v1.curriculum.repository.CurriculumSemesterPeriodRepository
import uz.scorm.lms.app.v1.curriculum.repository.CurriculumStudentAssignmentRepository
import uz.scorm.lms.app.v1.curriculum.repository.ProgramCurriculumVersionRepository
import uz.scorm.lms.app.v1.curriculum.service.CurriculumOperationService
import uz.scorm.lms.app.v1.student.repository.StudentRepository

class CurriculumOperationServiceTest {
    private val curricula = mockk<ProgramCurriculumVersionRepository>()
    private val periods = mockk<CurriculumSemesterPeriodRepository>()
    private val assignments = mockk<CurriculumStudentAssignmentRepository>()
    private val students = mockk<StudentRepository>()
    private val academicPeriods = mockk<AcademicPeriodService>()
    private val service = CurriculumOperationService(curricula, periods, assignments, students, academicPeriods)

    @Test
    fun `talaba faqat tasdiqlangan oquv rejaga biriktiriladi`() {
        val curriculum = mockk<ProgramCurriculumVersion>()
        every { curriculum.status } returns CurriculumStatus.DRAFT
        every { curricula.findByIdAndDeletedFalse(5) } returns curriculum

        assertThrows<IllegalArgumentException> {
            service.assign(5, AssignCurriculumStudentsRequest(setOf(10), 1))
        }
    }
}
