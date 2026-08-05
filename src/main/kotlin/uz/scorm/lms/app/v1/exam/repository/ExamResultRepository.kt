package uz.scorm.lms.app.v1.exam.repository

import org.springframework.data.jpa.repository.EntityGraph
import org.springframework.data.jpa.repository.JpaRepository
import uz.scorm.lms.app.v1.exam.model.ExamResult

interface ExamResultRepository : JpaRepository<ExamResult, Long> {
    @EntityGraph(attributePaths = ["examSession", "enrollment", "gradedBy"])
    fun findAllByExamSessionIdAndDeletedFalseOrderByScoreDesc(
        examSessionId: Long,
    ): List<ExamResult>

    @EntityGraph(attributePaths = ["examSession", "enrollment", "gradedBy"])
    fun findAllByEnrollmentIdAndDeletedFalseOrderByGradingDateDesc(
        enrollmentId: Long,
    ): List<ExamResult>

    @EntityGraph(attributePaths = ["examSession", "enrollment", "gradedBy"])
    fun findAllByExamSessionIdAndPassedAndDeletedFalse(
        examSessionId: Long,
        passed: Boolean,
    ): List<ExamResult>

    @EntityGraph(attributePaths = ["examSession", "enrollment", "gradedBy"])
    fun findByExamSessionIdAndEnrollmentIdAndDeletedFalse(
        examSessionId: Long,
        enrollmentId: Long,
    ): ExamResult?

    @EntityGraph(attributePaths = ["examSession", "enrollment", "gradedBy"])
    fun findByIdAndDeletedFalse(id: Long): ExamResult?

    fun countByExamSessionIdAndPassedAndDeletedFalse(
        examSessionId: Long,
        passed: Boolean,
    ): Long
}