package uz.scorm.lms.app.v1.faculty.repository

import org.springframework.data.jpa.repository.JpaRepository
import uz.scorm.lms.app.v1.faculty.model.Faculty

interface FacultyRepository : JpaRepository<Faculty, Long> {
    fun existsByCode(code: String): Boolean
}
