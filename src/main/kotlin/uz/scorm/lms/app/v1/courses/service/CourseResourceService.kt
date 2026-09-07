package uz.scorm.lms.app.v1.courses.service

import jakarta.persistence.EntityManager
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.courses.model.Course
import uz.scorm.lms.app.v1.courses.model.CourseEnrollmentStatus
import uz.scorm.lms.app.v1.student.dto.StudentResourceDto
import uz.scorm.lms.app.v1.student.dto.ResourceCategoryDto

@Service
@Transactional(readOnly = true)
class CourseResourceService(private val em: EntityManager, private val contents: CourseContentService) {
    fun list(userId: Long, manageAll: Boolean = false, studentOnly: Boolean = true, courseId: Long? = null,
             type: String? = null, category: String? = null): List<StudentResourceDto> {
        require(courseId == null || courseId > 0) { "Kurs identifikatori noto'g'ri" }
        require(type == null || type in setOf("pdf", "video", "link", "document", "image", "archive", "text")) { "Resurs turi noto'g'ri" }
        val categoryCourse = category?.let { requireNotNull(it.toLongOrNull()?.takeIf { id -> id > 0 }) { "Kategoriya noto'g'ri" } }
        val courses = em.createQuery("""
            select c from Course c where c.deleted = false and
            ((:studentOnly = false and (:all = true or c.userId = :userId)) or
              (c.status = 'PUBLISHED' and exists (select e.id from CourseEnrollment e where e.course = c
               and e.deleted = false and e.student.user.id = :userId and e.status in :statuses)))
            order by c.title
        """.trimIndent(), Course::class.java).setParameter("studentOnly", studentOnly).setParameter("all", manageAll)
            .setParameter("userId", userId).setParameter("statuses", setOf(CourseEnrollmentStatus.ACTIVE, CourseEnrollmentStatus.COMPLETED)).resultList
        return courses.filter { (courseId == null || it.id == courseId) && (categoryCourse == null || it.id == categoryCourse) }.flatMap { course ->
            contents.list(requireNotNull(course.id), userId, manageAll && !studentOnly).map { content ->
                val media = content.asset?.mediaType.orEmpty().lowercase()
                val resourceType = when {
                    media == "application/pdf" -> "pdf"
                    media.startsWith("image/") -> "image"
                    media.startsWith("video/") || content.contentType.equals("video", true) -> "video"
                    media.contains("zip") || media.contains("compressed") -> "archive"
                    content.contentType.equals("text", true) -> "text"
                    content.contentType.equals("link", true) -> "link"
                    else -> "document"
                }
                StudentResourceDto(id = "content-${content.id}", title = content.title, type = resourceType,
                    url = if (studentOnly) "/student/courses/${course.id}/learn?content=${content.id}" else "/teacher/courses/${course.id}/contents",
                    courseId = course.id.toString(), courseName = course.title, course = course.title,
                    uploadedAt = (content.asset?.uploadedAt ?: content.publishedAt ?: content.metadataUpdatedAt).toString(),
                    size = content.asset?.sizeBytes, description = content.description, contentId = content.id,
                    fileName = content.asset?.originalFileName, externalUrl = content.contentUrl?.takeIf { it.startsWith("https://") || it.startsWith("http://") })
            }
        }.filter { type == null || it.type == type }.sortedByDescending { it.uploadedAt }
    }

    fun categories(userId: Long): List<ResourceCategoryDto> = list(userId).groupBy { it.courseId }.map { (id, items) ->
        ResourceCategoryDto(requireNotNull(id), items.first().courseName.orEmpty(), items.size)
    }
}
