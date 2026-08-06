package uz.scorm.lms.app.v1.courses.repository

import org.springframework.data.jpa.repository.EntityGraph
import org.springframework.data.jpa.repository.JpaRepository
import uz.scorm.lms.app.v1.courses.model.CourseContentReview

interface CourseContentReviewRepository : JpaRepository<CourseContentReview, Long> {
    @EntityGraph(attributePaths = ["content", "content.module", "content.module.course"])
    fun findAllByStatusAndDeletedFalseOrderBySubmittedAtAsc(status: String): List<CourseContentReview>

    @EntityGraph(attributePaths = ["content", "content.module", "content.module.course"])
    fun findAllByContentIdAndDeletedFalseOrderBySubmittedAtDesc(contentId: Long): List<CourseContentReview>

    @EntityGraph(attributePaths = ["content", "content.module", "content.module.course"])
    fun findByIdAndDeletedFalse(id: Long): CourseContentReview?

    fun existsByContentIdAndRevisionNumberAndDeletedFalse(contentId: Long, revisionNumber: Int): Boolean
}
