package uz.scorm.lms.app.v1.courses.repository

import org.springframework.data.jpa.repository.JpaRepository
import uz.scorm.lms.app.v1.courses.model.CourseUnit

interface CourseUnitRepository : JpaRepository<CourseUnit, Long> {
    fun findAllByCourseIdAndDeletedFalseOrderByPositionAsc(courseId: Long): List<CourseUnit>
    fun findFirstByCourseIdAndDeletedFalseOrderByPositionDesc(courseId: Long): CourseUnit?
}
