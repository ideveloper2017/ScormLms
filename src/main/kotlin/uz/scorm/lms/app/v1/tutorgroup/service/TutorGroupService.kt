package uz.scorm.lms.app.v1.tutorgroup.service

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.audit.service.AuditService
import uz.scorm.lms.app.v1.faculty.repository.FacultyRepository
import uz.scorm.lms.app.v1.teacher.repository.TeacherRepository
import uz.scorm.lms.app.v1.tutorgroup.dto.*
import uz.scorm.lms.app.v1.tutorgroup.model.TutorGroup
import uz.scorm.lms.app.v1.tutorgroup.repository.TutorGroupRepository

@Service
class TutorGroupService(
    private val groups: TutorGroupRepository,
    private val faculties: FacultyRepository,
    private val teachers: TeacherRepository,
    private val audit: AuditService,
) {
    @Transactional(readOnly = true) fun list() = groups.findAllByDeletedFalseOrderByNameAsc().map(::dto)
    @Transactional(readOnly = true) fun options() = TutorGroupOptionsDto(
        faculties = faculties.findAll().filter { !it.deleted && it.active }.map { IdNameDto(requireNotNull(it.id), it.name) }.sortedBy { it.name },
        tutors = teachers.findAllByActiveTrueOrderByFullNameAsc().filter { !it.deleted }.map { IdNameDto(requireNotNull(it.id), it.fullName) },
    )
    @Transactional fun create(request: SaveTutorGroupRequest, actorId: Long): TutorGroupDto {
        val normalized = normalize(request)
        require(!groups.existsByCodeIgnoreCaseAndDeletedFalse(normalized.code)) { "Tutor guruhi kodi mavjud: ${normalized.code}" }
        val saved = groups.save(TutorGroup(normalized.name, normalized.code, faculty(normalized.facultyId), tutor(normalized.tutorId), normalized.nameUz, normalized.nameRu, normalized.nameEn, normalized.active))
        audit.logAction("TUTOR_GROUP_CREATED", actorId, "id=${saved.id}; code=${saved.code}")
        return dto(saved)
    }
    @Transactional fun update(id: Long, request: SaveTutorGroupRequest, actorId: Long): TutorGroupDto {
        val normalized = normalize(request)
        require(!groups.existsByCodeIgnoreCaseAndDeletedFalseAndIdNot(normalized.code, id)) { "Tutor guruhi kodi mavjud: ${normalized.code}" }
        val entity = groups.findByIdAndDeletedFalse(id) ?: throw NoSuchElementException("Tutor guruhi topilmadi: $id")
        entity.name = normalized.name; entity.code = normalized.code; entity.faculty = faculty(normalized.facultyId); entity.tutor = tutor(normalized.tutorId)
        entity.nameUz = normalized.nameUz; entity.nameRu = normalized.nameRu; entity.nameEn = normalized.nameEn; entity.active = normalized.active
        val saved = groups.save(entity)
        audit.logAction("TUTOR_GROUP_UPDATED", actorId, "id=$id; code=${saved.code}")
        return dto(saved)
    }
    @Transactional fun delete(id: Long, actorId: Long) {
        val entity = groups.findByIdAndDeletedFalse(id) ?: throw NoSuchElementException("Tutor guruhi topilmadi: $id")
        entity.deleted = true; groups.save(entity); audit.logAction("TUTOR_GROUP_DELETED", actorId, "id=$id; code=${entity.code}")
    }
    private fun normalize(request: SaveTutorGroupRequest): SaveTutorGroupRequest {
        val name = request.name.trim(); val code = request.code.trim().uppercase()
        require(name.length in 2..180) { "Nomi 2-180 belgi bo'lishi kerak" }; require(code.length in 2..60) { "Kodi 2-60 belgi bo'lishi kerak" }
        return request.copy(name = name, code = code, nameUz = request.nameUz?.trim()?.takeIf(String::isNotBlank), nameRu = request.nameRu?.trim()?.takeIf(String::isNotBlank), nameEn = request.nameEn?.trim()?.takeIf(String::isNotBlank))
    }
    private fun faculty(id: Long?) = id?.let { faculties.findById(it).orElseThrow { NoSuchElementException("Fakultet topilmadi: $it") } }
    private fun tutor(id: Long?) = id?.let { teachers.findById(it).orElseThrow { NoSuchElementException("Tutor topilmadi: $it") } }
    private fun dto(value: TutorGroup) = TutorGroupDto(requireNotNull(value.id), value.name, value.code, value.faculty?.id, value.faculty?.name, value.tutor?.id, value.tutor?.fullName, value.nameUz, value.nameRu, value.nameEn, value.active)
}
