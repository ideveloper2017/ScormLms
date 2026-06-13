package uz.scorm.lms.app.v1.subject.repository

import org.springframework.data.jpa.repository.JpaRepository
import uz.scorm.lms.app.v1.subject.model.Subject

interface SubjectRepository : JpaRepository<Subject, Long> {
    fun existsByCode(code: String): Boolean
    fun findAllByProgramId(programId: Long): List<Subject>
}
