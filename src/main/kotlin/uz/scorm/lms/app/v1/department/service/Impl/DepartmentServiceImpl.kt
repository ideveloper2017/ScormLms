package uz.scorm.lms.app.v1.department.service.Impl

import io.swagger.v3.oas.annotations.servers.Server
import org.springframework.stereotype.Service
import uz.scorm.lms.app.v1.department.model.Department
import uz.scorm.lms.app.v1.department.repository.DepartmentRepository
import uz.scorm.lms.app.v1.department.service.DepartmentService

@Service
data class DepartmentServiceImpl(private val departmentRepository: DepartmentRepository) : DepartmentService {
    override fun getAllDepartment(): List<Department> {
        return departmentRepository.findAll();
    }

}
