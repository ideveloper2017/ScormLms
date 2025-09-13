package uz.scorm.lms.app.v1.department.service

import org.springframework.stereotype.Service
import uz.scorm.lms.app.v1.department.model.Department



interface DepartmentService {

    fun getAllDepartment():List<Department>;


}
