package uz.scorm.lms.app.v1.contentstandard.repository

import org.springframework.data.jpa.repository.EntityGraph
import org.springframework.data.jpa.repository.JpaRepository
import uz.scorm.lms.app.v1.contentstandard.model.ContentStandardAssessment
import uz.scorm.lms.app.v1.contentstandard.model.ContentStandardAssessmentStatus
import uz.scorm.lms.app.v1.contentstandard.model.ContentStandardChecklist
import uz.scorm.lms.app.v1.contentstandard.model.ContentStandardChecklistStatus

interface ContentStandardChecklistRepository : JpaRepository<ContentStandardChecklist, Long> {
    @EntityGraph(attributePaths = ["criteria", "createdByUser", "reviewedByUser"])
    fun findAllByDeletedFalseOrderByCreatedAtDesc(): List<ContentStandardChecklist>
    @EntityGraph(attributePaths = ["criteria", "createdByUser", "reviewedByUser"])
    fun findByIdAndDeletedFalse(id: Long): ContentStandardChecklist?
    fun findFirstByStatusAndDeletedFalse(status: ContentStandardChecklistStatus): ContentStandardChecklist?
    fun existsByStandardCodeAndVersionCodeAndDeletedFalse(standardCode: String, versionCode: String): Boolean
    fun existsByStandardCodeAndVersionCodeAndDeletedFalseAndIdNot(standardCode: String, versionCode: String, id: Long): Boolean
}

interface ContentStandardAssessmentRepository : JpaRepository<ContentStandardAssessment, Long> {
    @EntityGraph(attributePaths = ["contentRevision", "contentRevision.content", "contentRevision.content.module", "contentRevision.content.module.course", "checklist", "responses", "responses.criterion", "createdByUser", "reviewedByUser"])
    fun findAllByDeletedFalseOrderByCreatedAtDesc(): List<ContentStandardAssessment>
    @EntityGraph(attributePaths = ["contentRevision", "contentRevision.content", "contentRevision.content.module", "contentRevision.content.module.course", "checklist", "responses", "responses.criterion", "createdByUser", "reviewedByUser"])
    fun findByIdAndDeletedFalse(id: Long): ContentStandardAssessment?
    fun existsByContentRevisionIdAndChecklistIdAndDeletedFalse(contentRevisionId: Long, checklistId: Long): Boolean
    fun existsByContentRevisionIdAndChecklistIdAndStatusAndDeletedFalse(contentRevisionId: Long, checklistId: Long, status: ContentStandardAssessmentStatus): Boolean
}
