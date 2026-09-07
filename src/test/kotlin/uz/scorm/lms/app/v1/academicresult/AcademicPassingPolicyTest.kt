package uz.scorm.lms.app.v1.academicresult

import io.mockk.every
import io.mockk.mockk
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import uz.scorm.lms.app.v1.academicresult.service.*
import uz.scorm.lms.app.v1.courses.model.CourseEnrollment
import uz.scorm.lms.app.v1.curriculum.model.*
import uz.scorm.lms.app.v1.curriculum.repository.CurriculumStudentAssignmentRepository

class AcademicPassingPolicyTest {
    private val repository = mockk<CurriculumStudentAssignmentRepository>()
    private val policy = AcademicPassingPolicy(repository)
    private val enrollment = mockk<CourseEnrollment> {
        every { student.id } returns 17L
        every { academicYear } returns "2026-2027"
        every { semester } returns 3
    }
    private fun assignment(pass: Int, maximum: Int = 100, state: CurriculumStatus = CurriculumStatus.APPROVED, minimum: Int = 0, snapshot: Double? = null) = mockk<CurriculumStudentAssignment> {
        every { curriculumVersion } returns mockk {
            every { deleted } returns false
            every { status } returns state
            every { passingScore } returns pass
            every { passingPercentage } returns snapshot
            every { ratingSystem } returns mockk {
                every { minScore } returns minimum
                every { maxScore } returns maximum
            }
        }
    }
    @Test fun `assigned pass threshold controls failure letter and earned points`() {
        every { repository.findAllByStudentIdAndAcademicYearAndSemesterNumberAndDeletedFalse(17, "2026-2027", 3) } returns listOf(assignment(70))
        assertFalse(policy.passed(enrollment, 65.0))
        assertTrue(policy.passed(enrollment, 70.0))
        assertEquals("F", GradeCalculation.letterGrade(65.0, policy.threshold(enrollment)))
        assertEquals(0.0, GradeCalculation.gpaPoint(65.0, policy.threshold(enrollment)))
    }
    @Test fun `historical plan and non hundred point scale resolve to percentages`() {
        every { repository.findAllByStudentIdAndAcademicYearAndSemesterNumberAndDeletedFalse(17, "2026-2027", 3) } returns listOf(assignment(7, 10, CurriculumStatus.ARCHIVED))
        assertEquals(70.0, policy.threshold(enrollment))
    }
    @Test fun `unassigned legacy enrollment retains sixty percent rule`() {
        every { repository.findAllByStudentIdAndAcademicYearAndSemesterNumberAndDeletedFalse(17, "2026-2027", 3) } returns emptyList()
        assertEquals(60.0, policy.threshold(enrollment))
    }
    @Test fun `approved snapshot remains stable after catalog scale changes`() {
        val row = assignment(3, 10, snapshot = 60.0)
        every { repository.findAllByStudentIdAndAcademicYearAndSemesterNumberAndDeletedFalse(17, "2026-2027", 3) } returns listOf(row)
        assertEquals(60.0, policy.threshold(enrollment))
    }
    @Test fun `nonzero scale minimum does not shift earned over maximum percentages`() {
        val row = assignment(3, 5, minimum = 1)
        every { repository.findAllByStudentIdAndAcademicYearAndSemesterNumberAndDeletedFalse(17, "2026-2027", 3) } returns listOf(row)
        assertEquals(60.0, policy.threshold(enrollment))
    }
    @Test fun `conflicting assigned plans are reported instead of picking arbitrary threshold`() {
        every { repository.findAllByStudentIdAndAcademicYearAndSemesterNumberAndDeletedFalse(17, "2026-2027", 3) } returns listOf(assignment(60), assignment(70))
        assertThrows<IllegalArgumentException> { policy.threshold(enrollment) }
    }
}
