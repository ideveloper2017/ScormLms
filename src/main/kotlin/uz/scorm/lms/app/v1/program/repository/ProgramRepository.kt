package uz.scorm.lms.app.v1.program.repository

import org.springframework.data.jpa.repository.JpaRepository
import uz.scorm.lms.app.v1.program.model.Program

interface ProgramRepository : JpaRepository<Program, Long> {
    fun existsByCode(code: String): Boolean
    fun findAllByDepartmentId(departmentId: Long): List<Program>
}
