package uz.scorm.lms.app.v1.program.service

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.department.service.DepartmentService
import uz.scorm.lms.app.v1.program.dto.ProgramCreateRequest
import uz.scorm.lms.app.v1.program.dto.ProgramDto
import uz.scorm.lms.app.v1.program.dto.ProgramUpdateRequest
import uz.scorm.lms.app.v1.program.mapper.ProgramMapper
import uz.scorm.lms.app.v1.program.model.Program
import uz.scorm.lms.app.v1.program.repository.ProgramRepository

@Service
class ProgramService(
    private val programRepository: ProgramRepository,
    private val programMapper: ProgramMapper,
    private val departmentService: DepartmentService
) {
    fun list(departmentId: Long? = null): List<ProgramDto> {
        val items = if (departmentId != null) {
            programRepository.findAllByDepartmentId(departmentId)
        } else {
            programRepository.findAll()
        }
        return items.map(programMapper::toDto)
    }

    fun getById(id: Long): ProgramDto =
        programMapper.toDto(getEntity(id))

    fun getEntity(id: Long): Program =
        programRepository.findById(id)
            .orElseThrow { IllegalArgumentException("Program not found: $id") }

    @Transactional
    fun create(request: ProgramCreateRequest): ProgramDto {
        if (request.code != null && programRepository.existsByCode(request.code)) {
            throw IllegalArgumentException("Program code already exists: ${request.code}")
        }
        return programMapper.toDto(
            programRepository.save(
                Program(
                    name = request.name,
                    code = request.code,
                    degreeLevel = request.degreeLevel,
                    active = request.active,
                    department = request.departmentId?.let { departmentService.getEntity(it) }
                )
            )
        )
    }

    @Transactional
    fun update(id: Long, request: ProgramUpdateRequest): ProgramDto {
        val program = getEntity(id)
        request.name?.let { program.name = it }
        request.code?.let { program.code = it }
        request.degreeLevel?.let { program.degreeLevel = it }
        request.active?.let { program.active = it }
        request.departmentId?.let { program.department = departmentService.getEntity(it) }
        return programMapper.toDto(programRepository.save(program))
    }

    @Transactional
    fun delete(id: Long) {
        programRepository.delete(getEntity(id))
    }
}
