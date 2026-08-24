package uz.scorm.lms.app.v1.tutorgroup.repository

import org.springframework.data.jpa.repository.JpaRepository
import uz.scorm.lms.app.v1.tutorgroup.model.TutorGroup

interface TutorGroupRepository : JpaRepository<TutorGroup, Long> {
    fun findAllByDeletedFalseOrderByNameAsc(): List<TutorGroup>
    fun findByIdAndDeletedFalse(id: Long): TutorGroup?
    fun existsByCodeIgnoreCaseAndDeletedFalse(code: String): Boolean
    fun existsByCodeIgnoreCaseAndDeletedFalseAndIdNot(code: String, id: Long): Boolean
}
