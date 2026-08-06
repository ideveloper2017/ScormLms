package uz.scorm.lms.app.v1.courses.repository

import org.springframework.data.jpa.repository.EntityGraph
import org.springframework.data.jpa.repository.JpaRepository
import uz.scorm.lms.app.v1.courses.model.CourseContentRevision

interface CourseContentRevisionRepository : JpaRepository<CourseContentRevision, Long> {
    @EntityGraph(attributePaths = ["content", "content.module", "content.module.course"])
    fun findAllByContentIdAndDeletedFalseOrderByRevisionNumberDesc(contentId: Long): List<CourseContentRevision>

    fun findFirstByContentIdAndDeletedFalseOrderByRevisionNumberDesc(contentId: Long): CourseContentRevision?
    fun findByContentIdAndRevisionNumberAndDeletedFalse(contentId: Long, revisionNumber: Int): CourseContentRevision?
    fun existsByContentIdAndContentVersionAndDeletedFalse(contentId: Long, contentVersion: String): Boolean
}
