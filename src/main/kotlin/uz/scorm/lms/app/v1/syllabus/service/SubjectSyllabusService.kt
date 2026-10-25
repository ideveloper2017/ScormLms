package uz.scorm.lms.app.v1.syllabus.service

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.subject.service.SubjectService
import uz.scorm.lms.app.v1.syllabus.dto.SubjectSyllabusDto
import uz.scorm.lms.app.v1.syllabus.dto.SubjectSyllabusRequest
import uz.scorm.lms.app.v1.syllabus.dto.SyllabusTopicDto
import uz.scorm.lms.app.v1.syllabus.dto.SyllabusTopicRequest
import uz.scorm.lms.app.v1.syllabus.model.SubjectSyllabus
import uz.scorm.lms.app.v1.syllabus.model.SubjectSyllabusTopic
import uz.scorm.lms.app.v1.syllabus.model.SyllabusTopicType
import uz.scorm.lms.app.v1.syllabus.repository.SubjectSyllabusRepository

@Service
class SubjectSyllabusService(
    private val syllabi: SubjectSyllabusRepository,
    private val subjects: SubjectService,
    private val revisions: uz.scorm.lms.app.v1.syllabus.repository.SubjectSyllabusRevisionRepository,
    private val mapper: tools.jackson.databind.ObjectMapper,
    private val audit: uz.scorm.lms.app.v1.audit.service.AuditService,
) {
    @Transactional(readOnly = true)
    fun list(subjectId: Long?): List<SubjectSyllabusDto> = (subjectId?.let {
        syllabi.findAllBySubjectIdAndDeletedFalseOrderByNameAsc(it)
    } ?: syllabi.findAllByDeletedFalseOrderByNameAsc()).map(::dto)

    @Transactional
    fun create(request: SubjectSyllabusRequest): SubjectSyllabusDto {
        val normalized = normalize(request)
        require(!syllabi.existsBySubjectIdAndLanguageAndNameIgnoreCaseAndDeletedFalse(request.subjectId, request.language, normalized.name)) {
            "Ushbu fan, til va nom uchun o'quv dasturi mavjud"
        }
        val value = SubjectSyllabus(
            subject = subjects.getEntity(request.subjectId), name = normalized.name, language = request.language,
            shortDescription = normalized.shortDescription, requirements = normalized.requirements,
            fullDescription = normalized.fullDescription, active = request.active,
        )
        request.topics?.let { replaceTopics(value, it) }
        return dto(syllabi.save(value))
    }

    @Transactional
    fun update(id: Long, request: SubjectSyllabusRequest): SubjectSyllabusDto {
        val value = lock(id)
        require(value.status == "DRAFT") { "Faqat qoralama tahrirlanadi. Avval yangi versiya oching." }
        require(value.revisionNumber == 1 || (value.subject.id == request.subjectId && value.language == request.language)) {
            "Yangi versiyada fan va til o'zgartirilmaydi; boshqa fan uchun alohida dastur yarating"
        }
        val normalized = normalize(request)
        require(!syllabi.existsBySubjectIdAndLanguageAndNameIgnoreCaseAndDeletedFalseAndIdNot(request.subjectId, request.language, normalized.name, id)) {
            "Ushbu fan, til va nom uchun o'quv dasturi mavjud"
        }
        value.subject = subjects.getEntity(request.subjectId)
        value.name = normalized.name
        value.language = request.language
        value.shortDescription = normalized.shortDescription
        value.requirements = normalized.requirements
        value.fullDescription = normalized.fullDescription
        value.active = request.active
        request.topics?.let { replaceTopics(value, it) }
        return dto(syllabi.saveAndFlush(value))
    }

    @Transactional
    fun delete(id: Long) {
        val value = lock(id)
        require(value.status == "DRAFT" && value.revisionNumber == 1) { "Tasdiqlash tarixi mavjud dastur o'chirilmaydi" }
        syllabi.delete(value)
    }

    @Transactional(readOnly = true)
    fun history(id: Long): List<uz.scorm.lms.app.v1.syllabus.dto.SyllabusRevisionDto> {
        requireEntity(id)
        return revisions.findAllBySyllabusIdOrderByRevisionNumberDesc(id).map {
            uz.scorm.lms.app.v1.syllabus.dto.SyllabusRevisionDto(it.revisionNumber,
                mapper.readValue(it.content, SubjectSyllabusDto::class.java), it.approvedByName, it.approvedAt)
        }
    }

    @Transactional
    fun transition(id: Long, action: String, actor: uz.scorm.lms.app.v1.user.model.User): SubjectSyllabusDto {
        val value = lock(id)
        when (action) {
            "SUBMIT" -> {
                require(value.status == "DRAFT") { "Faqat qoralama tekshiruvga yuboriladi" }
                require(value.subject.active && !value.subject.deleted && value.active) { "Fan va dastur faol bo'lishi kerak" }
                value.status = "IN_REVIEW"
            }
            "RETURN" -> {
                require(value.status == "IN_REVIEW") { "Faqat tekshiruvdagi versiya qaytariladi" }
                value.status = "DRAFT"
            }
            "APPROVE" -> {
                require(value.status == "IN_REVIEW") { "Avval tekshiruvga yuboring" }
                require(value.subject.active && !value.subject.deleted && value.active) { "Fan va dastur faol bo'lishi kerak" }
                value.status = "APPROVED"
                revisions.save(uz.scorm.lms.app.v1.syllabus.model.SubjectSyllabusRevision(id, value.revisionNumber,
                    mapper.writeValueAsString(dto(value)), actor.fullName ?: actor.username, java.time.Instant.now()))
            }
            "NEW_VERSION" -> {
                require(value.status == "APPROVED") { "Yangi versiya faqat tasdiqlangan dasturdan ochiladi" }
                value.revisionNumber += 1
                value.status = "DRAFT"
            }
            else -> throw IllegalArgumentException("Noma'lum amal")
        }
        audit.logAction("SYLLABUS_$action", requireNotNull(actor.id), "syllabus=$id; revision=${value.revisionNumber}")
        return dto(syllabi.save(value))
    }

    private fun replaceTopics(value: SubjectSyllabus, requests: List<SyllabusTopicRequest>) {
        require(requests.size <= MAX_TOPICS) { "Mavzular soni $MAX_TOPICS tadan oshmasligi kerak" }
        val topics = requests.groupBy { it.type }.flatMap { (type, items) ->
            items.mapIndexed { index, item ->
                val title = item.title.trim()
                require(title.length in 2..500) { "Mavzu nomi 2-500 belgi bo'lishi kerak" }
                require(item.hours in 1..MAX_TOPIC_HOURS) { "\"$title\" mavzusi soati 1-$MAX_TOPIC_HOURS oralig'ida bo'lishi kerak" }
                SubjectSyllabusTopic(
                    syllabus = value, type = type, sortOrder = index + 1, title = title,
                    description = item.description?.trim()?.takeIf(String::isNotEmpty), hours = item.hours,
                )
            }
        }
        value.topics.clear()
        value.topics.addAll(topics)
    }

    private fun lock(id: Long) = syllabi.lockById(id) ?: throw NoSuchElementException("O'quv dasturi topilmadi: $id")

    private fun requireEntity(id: Long) = syllabi.findByIdAndDeletedFalse(id)
        ?: throw NoSuchElementException("O'quv dasturi topilmadi: $id")

    private fun normalize(value: SubjectSyllabusRequest) = value.copy(
        name = value.name.trim().also { require(it.length in 3..500) { "O'quv dasturi nomi 3-500 belgi bo'lishi kerak" } },
        shortDescription = value.shortDescription.trim().also { require(it.length in 3..2000) { "Qisqa ta'rif 3-2000 belgi bo'lishi kerak" } },
        requirements = value.requirements?.trim()?.takeIf(String::isNotEmpty),
        fullDescription = value.fullDescription.trim().also { require(it.length >= 3) { "To'liq ta'rif majburiy" } },
    )

    private fun dto(value: SubjectSyllabus): SubjectSyllabusDto {
        val topics = value.topics.sortedWith(compareBy({ it.type }, { it.sortOrder })).map {
            SyllabusTopicDto(it.id, it.type, it.sortOrder, it.title, it.description, it.hours)
        }
        return SubjectSyllabusDto(
            id = requireNotNull(value.id), subjectId = requireNotNull(value.subject.id), subjectCode = value.subject.code,
            subjectName = value.subject.name, name = value.name, language = value.language,
            shortDescription = value.shortDescription, requirements = value.requirements,
            fullDescription = value.fullDescription, active = value.active,
            createdAt = value.createdAt, updatedAt = value.updatedAt,
            status = value.status, revisionNumber = value.revisionNumber,
            topics = topics,
            theoreticalHours = topics.filter { it.type == SyllabusTopicType.THEORETICAL }.sumOf { it.hours },
            practicalHours = topics.filter { it.type == SyllabusTopicType.PRACTICAL }.sumOf { it.hours },
        )
    }

    private companion object {
        const val MAX_TOPICS = 300
        const val MAX_TOPIC_HOURS = 200
    }
}
