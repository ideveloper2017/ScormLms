package uz.scorm.lms.app.v1.department.controller

import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import uz.scorm.lms.app.v1.department.model.Department
import uz.scorm.lms.app.v1.department.service.DepartmentService

@RestController
@RequestMapping("/")
class DeparmentController(private val departmentService:DepartmentService
) {


    @GetMapping("")
    fun getAll(): ResponseEntity<List<Department>> =
        departmentService.getAllDepartment() as ResponseEntity<List<Department>>;

}