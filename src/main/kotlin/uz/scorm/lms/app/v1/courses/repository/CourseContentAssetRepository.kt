package uz.scorm.lms.app.v1.courses.repository

import org.springframework.data.jpa.repository.EntityGraph
import org.springframework.data.jpa.repository.JpaRepository
import uz.scorm.lms.app.v1.courses.model.CourseContentAsset

interface CourseContentAssetRepository : JpaRepository<CourseContentAsset, Long> {
    @EntityGraph(attributePaths = ["course"])
    fun findByIdAndCourseIdAndDeletedFalse(id: Long, courseId: Long): CourseContentAsset?
    @EntityGraph(attributePaths = ["subject"])
    fun findByIdAndSubjectIdAndDeletedFalse(id: Long, subjectId: Long): CourseContentAsset?
}
