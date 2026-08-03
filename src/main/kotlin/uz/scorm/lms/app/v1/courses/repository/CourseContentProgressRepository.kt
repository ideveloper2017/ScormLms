package uz.scorm.lms.app.v1.courses.repository

import org.springframework.data.jpa.repository.EntityGraph
import org.springframework.data.jpa.repository.JpaRepository
import uz.scorm.lms.app.v1.courses.model.CourseContentProgress

interface CourseContentProgressRepository : JpaRepository<CourseContentProgress, Long> {
    @EntityGraph(attributePaths = ["content", "content.module", "enrollment", "enrollment.course"])
    fun findAllByEnrollmentIdAndDeletedFalse(enrollmentId: Long): List<CourseContentProgress>

    fun findByEnrollmentIdAndContentIdAndDeletedFalse(enrollmentId: Long, contentId: Long): CourseContentProgress?
}
