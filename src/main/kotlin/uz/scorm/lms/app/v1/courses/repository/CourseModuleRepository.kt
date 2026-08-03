package uz.scorm.lms.app.v1.courses.repository

import org.springframework.data.jpa.repository.EntityGraph
import org.springframework.data.jpa.repository.JpaRepository
import uz.scorm.lms.app.v1.courses.model.CourseModule

interface CourseModuleRepository : JpaRepository<CourseModule, Long> {
    @EntityGraph(attributePaths = ["course"])
    fun findAllByCourseIdAndDeletedFalseOrderByPositionAsc(courseId: Long): List<CourseModule>
    fun findFirstByCourseIdAndDeletedFalseOrderByPositionDesc(courseId: Long): CourseModule?
}
