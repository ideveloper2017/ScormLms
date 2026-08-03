package uz.scorm.lms.app.v1.courses.repository

import org.springframework.data.jpa.repository.JpaRepository
import uz.scorm.lms.app.v1.courses.model.Course

interface CourseRepository : JpaRepository<Course, Long> {
    fun findAllByUserIdAndDeletedFalseOrderByCreatedAtDesc(userId: Long): List<Course>
    fun findAllByDeletedFalseOrderByCreatedAtDesc(): List<Course>
}
