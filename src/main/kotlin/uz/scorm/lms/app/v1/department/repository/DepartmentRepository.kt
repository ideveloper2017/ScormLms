package uz.scorm.lms.app.v1.department.repository

import org.springframework.data.jpa.repository.JpaRepository
import uz.scorm.lms.app.v1.department.model.Department

interface DepartmentRepository : JpaRepository<Department, Long> {
}
