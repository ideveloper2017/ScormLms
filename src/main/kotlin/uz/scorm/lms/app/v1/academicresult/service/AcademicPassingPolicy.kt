package uz.scorm.lms.app.v1.academicresult.service

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.courses.model.CourseEnrollment
import uz.scorm.lms.app.v1.curriculum.model.CurriculumStatus
import uz.scorm.lms.app.v1.curriculum.repository.CurriculumStudentAssignmentRepository

/** Resolve the student's assigned plan for the enrollment period, including historical plans. */
@Service
@Transactional(readOnly = true)
class AcademicPassingPolicy(private val assignments: CurriculumStudentAssignmentRepository) {
    fun threshold(enrollment: CourseEnrollment): Double {
        val plans = assignments.findAllByStudentIdAndAcademicYearAndSemesterNumberAndDeletedFalse(
            requireNotNull(enrollment.student.id), enrollment.academicYear, enrollment.semester,
        ).map { it.curriculumVersion }.filter { !it.deleted && it.status != CurriculumStatus.DRAFT }
        val thresholds = plans.map { plan ->
            val scale = plan.ratingSystem
            require(scale.maxScore > scale.minScore) { "Baholash shkalasi noto'g'ri" }
            // Scores elsewhere are earned / maximum, so normalize the cutoff the same way.
            plan.passingPercentage ?: (plan.passingScore * 100.0 / scale.maxScore)
        }.distinct()
        require(thresholds.size <= 1) { "Talabaga shu semestr uchun turli o'tish ballari bilan rejalar biriktirilgan" }
        // Legacy enrollments without a curriculum retain the original 100-point rule.
        return thresholds.singleOrNull() ?: 60.0
    }

    fun passed(enrollment: CourseEnrollment, percentage: Double) = percentage >= threshold(enrollment)
}
