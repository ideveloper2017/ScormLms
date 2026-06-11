package uz.scorm.lms.app.v1.student.repository

import org.springframework.data.jpa.repository.JpaRepository
import uz.scorm.lms.app.v1.student.model.StudentProfile

interface StudentRepository : JpaRepository<StudentProfile, Long> {
    fun findByUserUsername(username: String): StudentProfile?
}
