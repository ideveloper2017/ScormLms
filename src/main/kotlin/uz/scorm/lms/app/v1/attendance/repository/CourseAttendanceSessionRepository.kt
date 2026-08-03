package uz.scorm.lms.app.v1.attendance.repository

import org.springframework.data.jpa.repository.EntityGraph
import org.springframework.data.jpa.repository.JpaRepository
import uz.scorm.lms.app.v1.attendance.model.CourseAttendanceSession

interface CourseAttendanceSessionRepository : JpaRepository<CourseAttendanceSession, Long> {
    @EntityGraph(attributePaths = ["course"])
    fun findAllByCourseIdInAndDeletedFalseOrderByOpensAtDesc(courseIds: Collection<Long>): List<CourseAttendanceSession>

    @EntityGraph(attributePaths = ["course"])
    fun findAllByCourseUserIdAndDeletedFalseOrderByOpensAtDesc(userId: Long): List<CourseAttendanceSession>

    @EntityGraph(attributePaths = ["course"])
    fun findAllByDeletedFalseOrderByOpensAtDesc(): List<CourseAttendanceSession>
}
