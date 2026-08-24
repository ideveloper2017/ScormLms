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
import uz.scorm.lms.app.v1.subjectcategory.service.SubjectCategoryService

@Service
class SubjectService(
    private val subjectRepository: SubjectRepository,
    private val subjectMapper: SubjectMapper,
    private val programService: ProgramService,
    private val subjectCategoryService: SubjectCategoryService,
) {
    fun list(programId: Long? = null, subjectCategoryId: Long? = null): List<SubjectDto> {
        val items = when {
            programId != null && subjectCategoryId != null ->
                subjectRepository.findAllByProgramIdAndSubjectCategoryId(programId, subjectCategoryId)
            programId != null -> subjectRepository.findAllByProgramId(programId)
            subjectCategoryId != null -> subjectRepository.findAllBySubjectCategoryId(subjectCategoryId)
            else -> subjectRepository.findAll()
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
                    nameEn = clean(request.nameEn), nameRu = clean(request.nameRu),
                    nameKaa = clean(request.nameKaa), nameUzCyrillic = clean(request.nameUzCyrillic),
                    code = request.code,
                    credits = request.credits,
                    subjectType = request.subjectType,
                    active = request.active,
                    program = request.programId?.let { programService.getEntity(it) },
                    subjectCategory = request.subjectCategoryId?.let { subjectCategoryService.getEntity(it) },
                )
            )
        )
    }

    @Transactional
    fun update(id: Long, request: SubjectUpdateRequest): SubjectDto {
        val subject = getEntity(id)
        if (request.clearOptionalFields) {
            subject.nameEn = null
            subject.nameRu = null
            subject.nameKaa = null
            subject.nameUzCyrillic = null
            subject.code = null
            subject.credits = null
            subject.subjectType = null
            subject.program = null
        }
        request.name?.let { subject.name = it }
        request.nameEn?.let { subject.nameEn = clean(it) }
        request.nameRu?.let { subject.nameRu = clean(it) }
        request.nameKaa?.let { subject.nameKaa = clean(it) }
        request.nameUzCyrillic?.let { subject.nameUzCyrillic = clean(it) }
        request.code?.let { subject.code = it }
        request.credits?.let { subject.credits = it }
        request.subjectType?.let { subject.subjectType = it }
        request.active?.let { subject.active = it }
        request.programId?.let { subject.program = programService.getEntity(it) }
        if (request.clearSubjectCategory) {
            subject.subjectCategory = null
        } else {
            request.subjectCategoryId?.let { subject.subjectCategory = subjectCategoryService.getEntity(it) }
        }
        return subjectMapper.toDto(subjectRepository.save(subject))
    }

    @Transactional
    fun delete(id: Long) {
        subjectRepository.delete(getEntity(id))
    }

    private fun clean(value: String?): String? = value?.trim()?.takeIf(String::isNotEmpty)
}
