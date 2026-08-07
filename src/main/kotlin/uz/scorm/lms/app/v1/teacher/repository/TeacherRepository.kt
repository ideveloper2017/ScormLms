package uz.scorm.lms.app.v1.teacher.repository

import org.springframework.data.jpa.repository.JpaRepository
import uz.scorm.lms.app.v1.teacher.model.Teacher

interface TeacherRepository : JpaRepository<Teacher, Long> {
    fun findAllByDepartmentId(departmentId: Long): List<Teacher>
    fun findByUserId(userId: Long): Teacher?
    fun findAllByActiveTrueOrderByFullNameAsc(): List<Teacher>
    fun countByActiveTrue(): Long
}
