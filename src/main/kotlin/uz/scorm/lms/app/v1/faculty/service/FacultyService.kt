package uz.scorm.lms.app.v1.faculty.service

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.faculty.dto.FacultyCreateRequest
import uz.scorm.lms.app.v1.faculty.dto.FacultyDto
import uz.scorm.lms.app.v1.faculty.dto.FacultyUpdateRequest
import uz.scorm.lms.app.v1.faculty.mapper.FacultyMapper
import uz.scorm.lms.app.v1.faculty.model.Faculty
import uz.scorm.lms.app.v1.faculty.repository.FacultyRepository

@Service
class FacultyService(
    private val facultyRepository: FacultyRepository,
    private val facultyMapper: FacultyMapper
) {
    fun list(): List<FacultyDto> =
        facultyRepository.findAll().map(facultyMapper::toDto)

    fun getById(id: Long): FacultyDto =
        facultyMapper.toDto(getEntity(id))

    fun getEntity(id: Long): Faculty =
        facultyRepository.findById(id)
            .orElseThrow { IllegalArgumentException("Faculty not found: $id") }

    @Transactional
    fun create(request: FacultyCreateRequest): FacultyDto {
        if (request.code != null && facultyRepository.existsByCode(request.code)) {
            throw IllegalArgumentException("Faculty code already exists: ${request.code}")
        }
        return facultyMapper.toDto(
            facultyRepository.save(
                Faculty(
                    name = request.name,
                    code = request.code,
                    active = request.active
                )
            )
        )
    }

    @Transactional
    fun update(id: Long, request: FacultyUpdateRequest): FacultyDto {
        val faculty = getEntity(id)
        request.name?.let { faculty.name = it }
        request.code?.let { faculty.code = it }
        request.active?.let { faculty.active = it }
        return facultyMapper.toDto(facultyRepository.save(faculty))
    }

    @Transactional
    fun delete(id: Long) {
        facultyRepository.delete(getEntity(id))
    }
}
