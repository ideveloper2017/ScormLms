package uz.scorm.lms.app.v1.courses.repository

import org.springframework.data.jpa.repository.EntityGraph
import org.springframework.data.jpa.repository.JpaRepository
import uz.scorm.lms.app.v1.courses.model.CourseContent

interface CourseContentRepository : JpaRepository<CourseContent, Long> {
    @EntityGraph(attributePaths = ["module", "module.course"])
    fun findAllByStatusAndDeletedFalse(status: String): List<CourseContent>
    fun countByModuleCourseIdAndDeletedFalse(courseId: Long): Long
    @EntityGraph(attributePaths = ["module", "module.course"])
    fun findAllByModuleCourseIdAndDeletedFalseOrderByModulePositionAscPositionAsc(courseId: Long): List<CourseContent>
    @EntityGraph(attributePaths = ["module", "module.course"])
    fun findAllByModuleCourseIdInAndDeletedFalseOrderByModuleCourseIdAscModulePositionAscPositionAsc(courseIds: Collection<Long>): List<CourseContent>

    @EntityGraph(attributePaths = ["module", "module.course"])
    fun findAllByModuleIdAndDeletedFalseOrderByPositionAsc(moduleId: Long): List<CourseContent>

    fun findFirstByModuleIdAndDeletedFalseOrderByPositionDesc(moduleId: Long): CourseContent?
    fun countByModuleIdAndDeletedFalse(moduleId: Long): Long
}
