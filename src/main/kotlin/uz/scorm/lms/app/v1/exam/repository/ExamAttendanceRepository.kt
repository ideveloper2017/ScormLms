package uz.scorm.lms.app.v1.exam.repository

import org.springframework.data.jpa.repository.EntityGraph
import org.springframework.data.jpa.repository.JpaRepository
import uz.scorm.lms.app.v1.exam.model.AttendanceStatus
import uz.scorm.lms.app.v1.exam.model.ExamAttendance

interface ExamAttendanceRepository : JpaRepository<ExamAttendance, Long> {
    @EntityGraph(attributePaths = ["examSession", "enrollment", "enrollment.student", "enrollment.student.user", "enrollment.course", "attendanceVerifiedBy"])
    fun findAllByExamSessionIdAndDeletedFalseOrderByArrivalTimeAsc(
        examSessionId: Long,
    ): List<ExamAttendance>

    @EntityGraph(attributePaths = ["examSession", "enrollment", "enrollment.student", "enrollment.student.user", "enrollment.course", "attendanceVerifiedBy"])
    fun findAllByEnrollmentIdAndDeletedFalseOrderByExamSessionIdDesc(
        enrollmentId: Long,
    ): List<ExamAttendance>

    @EntityGraph(attributePaths = ["examSession", "enrollment", "enrollment.student", "enrollment.student.user", "enrollment.course", "attendanceVerifiedBy"])
    fun findAllByExamSessionIdAndAttendanceStatusAndDeletedFalse(
        examSessionId: Long,
        status: AttendanceStatus,
    ): List<ExamAttendance>

    @EntityGraph(attributePaths = ["examSession", "enrollment", "enrollment.student", "enrollment.student.user", "enrollment.course", "attendanceVerifiedBy"])
    fun findByExamSessionIdAndEnrollmentIdAndDeletedFalse(
        examSessionId: Long,
        enrollmentId: Long,
    ): ExamAttendance?

    @EntityGraph(attributePaths = ["examSession", "enrollment", "attendanceVerifiedBy"])
    fun findByIdAndDeletedFalse(id: Long): ExamAttendance?

    fun countByExamSessionIdAndAttendanceStatusAndDeletedFalse(
        examSessionId: Long,
        status: AttendanceStatus,
    ): Long
}
