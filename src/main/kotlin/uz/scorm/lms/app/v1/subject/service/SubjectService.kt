package uz.scorm.lms.app.v1.subject.service

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.program.service.ProgramService
import uz.scorm.lms.app.v1.subject.dto.SubjectCreateRequest
import uz.scorm.lms.app.v1.subject.dto.SubjectDto
import uz.scorm.lms.app.v1.subject.dto.SubjectUpdateRequest
import uz.scorm.lms.app.v1.subject.mapper.SubjectMapper
import uz.scorm.lms.app.v1.subject.model.Subject
import uz.scorm.lms.app.v1.subject.repository.SubjectRepository

@Service
class SubjectService(
    private val subjectRepository: SubjectRepository,
    private val subjectMapper: SubjectMapper,
    private val programService: ProgramService
) {
    fun list(programId: Long? = null): List<SubjectDto> {
        val items = if (programId != null) {
            subjectRepository.findAllByProgramId(programId)
        } else {
            subjectRepository.findAll()
        }
        return items.map(subjectMapper::toDto)
    }

    fun getById(id: Long): SubjectDto =
        subjectMapper.toDto(getEntity(id))

    fun getEntity(id: Long): Subject =
        subjectRepository.findById(id)
            .orElseThrow { IllegalArgumentException("Subject not found: $id") }

    @Transactional
    fun create(request: SubjectCreateRequest): SubjectDto {
        if (request.code != null && subjectRepository.existsByCode(request.code)) {
            throw IllegalArgumentException("Subject code already exists: ${request.code}")
        }
        return subjectMapper.toDto(
            subjectRepository.save(
                Subject(
                    name = request.name,
                    code = request.code,
                    credits = request.credits,
                    active = request.active,
                    program = request.programId?.let { programService.getEntity(it) }
                )
            )
        )
    }

    @Transactional
    fun update(id: Long, request: SubjectUpdateRequest): SubjectDto {
        val subject = getEntity(id)
        request.name?.let { subject.name = it }
        request.code?.let { subject.code = it }
        request.credits?.let { subject.credits = it }
        request.active?.let { subject.active = it }
        request.programId?.let { subject.program = programService.getEntity(it) }
        return subjectMapper.toDto(subjectRepository.save(subject))
    }

    @Transactional
    fun delete(id: Long) {
        subjectRepository.delete(getEntity(id))
    }
}
