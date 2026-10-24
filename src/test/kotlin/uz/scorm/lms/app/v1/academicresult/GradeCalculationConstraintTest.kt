package uz.scorm.lms.app.v1.academicresult

import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import uz.scorm.lms.app.v1.academicresult.service.GradeCalculation

class GradeCalculationConstraintTest {

    // exam_results.grade: VARCHAR(2) + ck_exam_result_grade (V78)
    private val dbGradePattern = Regex("^[A-F]\\+?$")

    @Test
    fun `every letter grade fits the exam_results constraint`() {
        val grades = (0..1000).map { GradeCalculation.letterGrade(it / 10.0) }.toSet()

        assertTrue(grades.containsAll(setOf("A", "B+", "C+", "D+", "F")))
        grades.forEach { grade ->
            assertTrue(grade.length <= 2 && dbGradePattern.matches(grade), "DB rad etadigan baho: $grade")
        }
    }
}
