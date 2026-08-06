package uz.scorm.lms.app.v1.exam.repository

import org.springframework.data.jpa.repository.EntityGraph
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import uz.scorm.lms.app.v1.exam.model.ExamSession
import uz.scorm.lms.app.v1.exam.model.ExamSessionStatus
import java.time.LocalDate

interface ExamSessionRepository : JpaRepository<ExamSession, Long> {
    @EntityGraph(attributePaths = ["course", "examiner", "secondaryExaminer"])
    fun findAllByDeletedFalseOrderByExamDateDesc(): List<ExamSession>

    @EntityGraph(attributePaths = ["course", "examiner", "secondaryExaminer"])
    fun findAllByCourseIdAndDeletedFalseOrderByExamDateDesc(courseId: Long): List<ExamSession>

    @EntityGraph(attributePaths = ["course", "examiner", "secondaryExaminer"])
    fun findAllByExaminerIdAndDeletedFalseOrderByExamDateDesc(examinerId: Long): List<ExamSession>

    @EntityGraph(attributePaths = ["course", "examiner", "secondaryExaminer"])
    fun findAllBySecondaryExaminerIdAndDeletedFalseOrderByExamDateDesc(secondaryExaminerId: Long): List<ExamSession>

    @EntityGraph(attributePaths = ["course", "examiner", "secondaryExaminer"])
    fun findAllByStatusAndDeletedFalseOrderByExamDateAsc(
        status: ExamSessionStatus,
    ): List<ExamSession>

    @EntityGraph(attributePaths = ["course", "examiner", "secondaryExaminer"])
    fun findAllByExamDateBetweenAndDeletedFalseOrderByExamDateAsc(
        from: LocalDate,
        to: LocalDate,
    ): List<ExamSession>

    @EntityGraph(attributePaths = ["course", "examiner", "secondaryExaminer"])
    fun findByIdAndDeletedFalse(id: Long): ExamSession?

    @Query(
        """
        SELECT es FROM ExamSession es
        WHERE es.course.id = :courseId AND es.deleted = false
        AND es.examDate = :examDate
        AND es.location = :location
    """
    )
    fun findByCourseIdAndDateAndLocation(
        @Param("courseId") courseId: Long,
        @Param("examDate") examDate: LocalDate,
        @Param("location") location: String,
    ): ExamSession?
}
