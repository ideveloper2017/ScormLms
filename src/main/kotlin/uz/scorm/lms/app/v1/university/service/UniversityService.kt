package uz.scorm.lms.app.v1.university.service

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.audit.service.AuditService
import uz.scorm.lms.app.v1.university.dto.CreateUniversityRequest
import uz.scorm.lms.app.v1.university.dto.UniversityDto
import uz.scorm.lms.app.v1.university.dto.UpdateUniversityRequest
import uz.scorm.lms.app.v1.university.model.University
import uz.scorm.lms.app.v1.university.repository.UniversityRepository

@Service
class UniversityService(
    private val universities: UniversityRepository,
    private val auditService: AuditService,
) {
    @Transactional(readOnly = true)
    fun list(): List<UniversityDto> = universities.findAllByDeletedFalseOrderByNameAsc().map(::toDto)

    @Transactional(readOnly = true)
    fun get(id: Long): UniversityDto = toDto(requireUniversity(id))

    @Transactional
    fun create(request: CreateUniversityRequest, actorId: Long): UniversityDto {
        val name = text(request.name, "Universitet nomi", 3, 500)
        require(universities.findByNameIgnoreCaseAndDeletedFalse(name) == null) { "Universitet mavjud: $name" }
        val saved = universities.save(University(
            name = name,
            rector = text(request.rector, "Rektor", 3, 250),
            address = text(request.address, "Manzil", 3, 1000),
            defaultLanguage = request.defaultLanguage,
            phone = phone(request.phone),
            bankDetails = text(request.bankDetails, "Bank rekvizitlari", 3, 4000),
            chiefAccountant = text(request.chiefAccountant, "Bosh hisobchi", 3, 250),
            legalCounsel = text(request.legalCounsel, "Yuristkonsult", 3, 250),
            active = request.active,
        ))
        auditService.logAction("UNIVERSITY_CREATED", actorId, "id=${saved.id}; name=${saved.name}; active=${saved.active}")
        return toDto(saved)
    }

    @Transactional
    fun update(id: Long, request: UpdateUniversityRequest, actorId: Long): UniversityDto {
        val university = requireUniversity(id)
        request.name?.let { raw ->
            val name = text(raw, "Universitet nomi", 3, 500)
            val duplicate = universities.findByNameIgnoreCaseAndDeletedFalse(name)
            require(duplicate == null || duplicate.id == university.id) { "Universitet mavjud: $name" }
            university.name = name
        }
        request.rector?.let { university.rector = text(it, "Rektor", 3, 250) }
        request.address?.let { university.address = text(it, "Manzil", 3, 1000) }
        request.defaultLanguage?.let { university.defaultLanguage = it }
        request.phone?.let { university.phone = phone(it) }
        request.bankDetails?.let { university.bankDetails = text(it, "Bank rekvizitlari", 3, 4000) }
        request.chiefAccountant?.let { university.chiefAccountant = text(it, "Bosh hisobchi", 3, 250) }
        request.legalCounsel?.let { university.legalCounsel = text(it, "Yuristkonsult", 3, 250) }
        request.active?.let { university.active = it }
        val saved = universities.save(university)
        auditService.logAction("UNIVERSITY_UPDATED", actorId, "id=$id; name=${saved.name}; active=${saved.active}")
        return toDto(saved)
    }

    @Transactional
    fun delete(id: Long, actorId: Long) {
        val university = requireUniversity(id)
        university.deleted = true
        university.active = false
        universities.save(university)
        auditService.logAction("UNIVERSITY_DELETED", actorId, "id=$id; name=${university.name}")
    }

    private fun requireUniversity(id: Long): University = universities.findByIdAndDeletedFalse(id)
        ?: throw NoSuchElementException("Universitet topilmadi: $id")

    private fun text(value: String, label: String, min: Int, max: Int): String {
        val normalized = value.trim()
        require(normalized.length in min..max) { "$label $min-$max belgi bo'lishi kerak" }
        return normalized
    }

    private fun phone(value: String): String {
        val normalized = value.trim().replace(Regex("[\\s()-]"), "")
        require(normalized.matches(Regex("^\\+?[0-9]{9,15}$"))) { "Telefon raqami noto'g'ri" }
        return if (normalized.startsWith("+")) normalized else "+$normalized"
    }

    private fun toDto(value: University) = UniversityDto(
        id = requireNotNull(value.id),
        name = value.name,
        rector = value.rector,
        address = value.address,
        defaultLanguage = value.defaultLanguage,
        phone = value.phone,
        bankDetails = value.bankDetails,
        chiefAccountant = value.chiefAccountant,
        legalCounsel = value.legalCounsel,
        active = value.active,
        createdAt = value.createdAt,
        updatedAt = value.updatedAt,
    )
}
