package uz.scorm.lms.app.v1.group.service

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.group.dto.GroupCreateRequest
import uz.scorm.lms.app.v1.group.dto.GroupDto
import uz.scorm.lms.app.v1.group.dto.GroupUpdateRequest
import uz.scorm.lms.app.v1.group.mapper.GroupMapper
import uz.scorm.lms.app.v1.group.model.Group
import uz.scorm.lms.app.v1.group.repository.GroupRepository
import uz.scorm.lms.app.v1.program.service.ProgramService

@Service
class GroupService(
    private val groupRepository: GroupRepository,
    private val groupMapper: GroupMapper,
    private val programService: ProgramService
) {
    fun list(programId: Long? = null): List<GroupDto> {
        val items = if (programId != null) {
            groupRepository.findAllByProgramId(programId)
        } else {
            groupRepository.findAll()
        }
        return items.map(groupMapper::toDto)
    }

    fun getById(id: Long): GroupDto =
        groupMapper.toDto(getEntity(id))

    fun getEntity(id: Long): Group =
        groupRepository.findById(id)
            .orElseThrow { IllegalArgumentException("Group not found: $id") }

    @Transactional
    fun create(request: GroupCreateRequest): GroupDto =
        groupMapper.toDto(
            groupRepository.save(
                Group(
                    name = request.name,
                    educationYear = request.educationYear,
                    language = request.language,
                    active = request.active,
                    program = request.programId?.let { programService.getEntity(it) }
                )
            )
        )

    @Transactional
    fun update(id: Long, request: GroupUpdateRequest): GroupDto {
        val group = getEntity(id)
        request.name?.let { group.name = it }
        request.educationYear?.let { group.educationYear = it }
        request.language?.let { group.language = it }
        request.active?.let { group.active = it }
        request.programId?.let { group.program = programService.getEntity(it) }
        return groupMapper.toDto(groupRepository.save(group))
    }

    @Transactional
    fun delete(id: Long) {
        groupRepository.delete(getEntity(id))
    }
}
