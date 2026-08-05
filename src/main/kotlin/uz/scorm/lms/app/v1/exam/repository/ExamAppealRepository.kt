package uz.scorm.lms.app.v1.exam.repository

import org.springframework.data.jpa.repository.EntityGraph
import org.springframework.data.jpa.repository.JpaRepository
import uz.scorm.lms.app.v1.exam.model.AppealStatus
import uz.scorm.lms.app.v1.exam.model.ExamAppeal

interface ExamAppealRepository : JpaRepository<ExamAppeal, Long> {
    @EntityGraph(attributePaths = ["examResult", "student", "reviewedBy"])
    fun findAllByExamResultIdAndDeletedFalseOrderByAppealDateDesc(
        examResultId: Long,
    ): List<ExamAppeal>

    @EntityGraph(attributePaths = ["examResult", "student", "reviewedBy"])
    fun findAllByStudentIdAndDeletedFalseOrderByAppealDateDesc(
        studentId: Long,
    ): List<ExamAppeal>

    @EntityGraph(attributePaths = ["examResult", "student", "reviewedBy"])
    fun findAllByStatusAndDeletedFalseOrderByAppealDateAsc(
        status: AppealStatus,
    ): List<ExamAppeal>

    @EntityGraph(attributePaths = ["examResult", "student", "reviewedBy"])
    fun findByIdAndDeletedFalse(id: Long): ExamAppeal?

    fun countByStatusAndDeletedFalse(
        status: AppealStatus,
    ): Long
}