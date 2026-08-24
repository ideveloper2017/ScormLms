package uz.scorm.lms.app.v1.university.repository

import org.springframework.data.jpa.repository.JpaRepository
import uz.scorm.lms.app.v1.university.model.University

interface UniversityRepository : JpaRepository<University, Long> {
    fun findAllByDeletedFalseOrderByNameAsc(): List<University>
    fun findByIdAndDeletedFalse(id: Long): University?
    fun findByNameIgnoreCaseAndDeletedFalse(name: String): University?
}
