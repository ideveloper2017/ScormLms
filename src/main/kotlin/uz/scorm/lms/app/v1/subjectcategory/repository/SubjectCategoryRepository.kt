package uz.scorm.lms.app.v1.subjectcategory.repository

import org.springframework.data.jpa.repository.JpaRepository
import uz.scorm.lms.app.v1.subjectcategory.model.SubjectCategory

interface SubjectCategoryRepository : JpaRepository<SubjectCategory, Long> {
    fun findAllByDeletedFalseOrderByNameAsc(): List<SubjectCategory>
    fun findByIdAndDeletedFalse(id: Long): SubjectCategory?
    fun existsByCodeIgnoreCase(code: String): Boolean
    fun existsByCodeIgnoreCaseAndIdNot(code: String, id: Long): Boolean
}
