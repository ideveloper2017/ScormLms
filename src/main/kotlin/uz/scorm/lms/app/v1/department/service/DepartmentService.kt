package uz.scorm.lms.app.v1.department.service

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.department.dto.DepartmentCreateRequest
import uz.scorm.lms.app.v1.department.dto.DepartmentDto
import uz.scorm.lms.app.v1.department.dto.DepartmentUpdateRequest
import uz.scorm.lms.app.v1.department.mapper.DepartmentMapper
import uz.scorm.lms.app.v1.department.model.Department
import uz.scorm.lms.app.v1.department.repository.DepartmentRepository
import uz.scorm.lms.app.v1.faculty.service.FacultyService

@Service
class DepartmentService(
    private val departmentRepository: DepartmentRepository,
    private val departmentMapper: DepartmentMapper,
    private val facultyService: FacultyService
) {
    fun list(facultyId: Long? = null): List<DepartmentDto> {
        val items = if (facultyId != null) {
            departmentRepository.findAllByFacultyId(facultyId)
        } else {
            departmentRepository.findAll()
        }
        return items.map(departmentMapper::toDto)
    }

    fun getById(id: Long): DepartmentDto =
        departmentMapper.toDto(getEntity(id))

    fun getEntity(id: Long): Department =
        departmentRepository.findById(id)
            .orElseThrow { IllegalArgumentException("Department not found: $id") }

    @Transactional
    fun create(request: DepartmentCreateRequest): DepartmentDto {
        if (request.code != null && departmentRepository.existsByCode(request.code)) {
            throw IllegalArgumentException("Department code already exists: ${request.code}")
        }
        return departmentMapper.toDto(
            departmentRepository.save(
                Department(
                    name = request.name,
                    code = request.code,
                    active = request.active,
                    faculty = request.facultyId?.let { facultyService.getEntity(it) }
                )
            )
        )
    }

    @Transactional
    fun update(id: Long, request: DepartmentUpdateRequest): DepartmentDto {
        val department = getEntity(id)
        request.name?.let { department.name = it }
        request.code?.let { department.code = it }
        request.active?.let { department.active = it }
        request.facultyId?.let { department.faculty = facultyService.getEntity(it) }
        return departmentMapper.toDto(departmentRepository.save(department))
    }

    @Transactional
    fun delete(id: Long) {
        departmentRepository.delete(getEntity(id))
    }
}
