package uz.scorm.lms.app.v1.academicresult.service

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.academicresult.dto.RatingSystemDto
import uz.scorm.lms.app.v1.academicresult.dto.SaveRatingSystemRequest
import uz.scorm.lms.app.v1.academicresult.model.RatingSystem
import uz.scorm.lms.app.v1.academicresult.repository.RatingSystemRepository
import uz.scorm.lms.app.v1.audit.service.AuditService

@Service
class RatingSystemService(
    private val repository: RatingSystemRepository,
    private val auditService: AuditService,
) {
    @Transactional(readOnly = true)
    fun list(): List<RatingSystemDto> = repository.findAllByDeletedFalseOrderByNameAsc().map(::dto)

    @Transactional
    fun create(request: SaveRatingSystemRequest, actorId: Long): RatingSystemDto {
        val normalized = validate(request)
        require(repository.findByNameIgnoreCaseAndDeletedFalse(normalized.name) == null) { "Baholash tizimi mavjud: ${normalized.name}" }
        require(repository.findByShortNameIgnoreCaseAndDeletedFalse(normalized.shortName) == null) { "Qisqacha nom mavjud: ${normalized.shortName}" }
        val saved = repository.save(RatingSystem(
            normalized.name, normalized.shortName, normalized.minScore,
            normalized.maxScore, normalized.passScore, normalized.active,
        ))
        auditService.logAction("RATING_SYSTEM_CREATED", actorId, "id=${saved.id}; name=${saved.name}")
        return dto(saved)
    }

    @Transactional
    fun update(id: Long, request: SaveRatingSystemRequest, actorId: Long): RatingSystemDto {
        val entity = repository.findByIdAndDeletedFalse(id) ?: throw NoSuchElementException("Baholash tizimi topilmadi: $id")
        val normalized = validate(request)
        val duplicateName = repository.findByNameIgnoreCaseAndDeletedFalse(normalized.name)
        val duplicateShort = repository.findByShortNameIgnoreCaseAndDeletedFalse(normalized.shortName)
        require(duplicateName == null || duplicateName.id == entity.id) { "Baholash tizimi mavjud: ${normalized.name}" }
        require(duplicateShort == null || duplicateShort.id == entity.id) { "Qisqacha nom mavjud: ${normalized.shortName}" }
        entity.name = normalized.name
        entity.shortName = normalized.shortName
        entity.minScore = normalized.minScore
        entity.maxScore = normalized.maxScore
        entity.passScore = normalized.passScore
        entity.active = normalized.active
        val saved = repository.save(entity)
        auditService.logAction("RATING_SYSTEM_UPDATED", actorId, "id=$id; name=${saved.name}")
        return dto(saved)
    }

    @Transactional
    fun delete(id: Long, actorId: Long) {
        val entity = repository.findByIdAndDeletedFalse(id) ?: throw NoSuchElementException("Baholash tizimi topilmadi: $id")
        entity.deleted = true
        entity.active = false
        repository.save(entity)
        auditService.logAction("RATING_SYSTEM_DELETED", actorId, "id=$id; name=${entity.name}")
    }

    private fun validate(request: SaveRatingSystemRequest): SaveRatingSystemRequest {
        val name = request.name.trim()
        val shortName = request.shortName.trim()
        require(name.length in 2..250) { "Nomi 2-250 belgi bo'lishi kerak" }
        require(shortName.length in 1..80) { "Qisqacha nom 1-80 belgi bo'lishi kerak" }
        require(request.minScore >= 0) { "Minimal ball manfiy bo'lmaydi" }
        require(request.maxScore > request.minScore) { "Maksimal ball minimal balldan katta bo'lishi kerak" }
        require(request.passScore in request.minScore..request.maxScore) { "O'tish bali Min-Max oralig'ida bo'lishi kerak" }
        return request.copy(name = name, shortName = shortName)
    }

    private fun dto(value: RatingSystem) = RatingSystemDto(
        id = requireNotNull(value.id), name = value.name, shortName = value.shortName,
        minScore = value.minScore, maxScore = value.maxScore, passScore = value.passScore, active = value.active,
    )
}
