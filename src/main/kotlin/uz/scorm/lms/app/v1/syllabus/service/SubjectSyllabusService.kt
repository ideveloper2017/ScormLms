package uz.scorm.lms.app.v1.syllabus.service

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.subject.service.SubjectService
import uz.scorm.lms.app.v1.syllabus.dto.SubjectSyllabusDto
import uz.scorm.lms.app.v1.syllabus.dto.SubjectSyllabusRequest
import uz.scorm.lms.app.v1.syllabus.dto.SyllabusTopicDto
import uz.scorm.lms.app.v1.syllabus.dto.SyllabusTopicRequest
import uz.scorm.lms.app.v1.syllabus.model.SubjectModelProgram
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
    fun list(subjectId: Long?, modelProgramId: Long? = null): List<SubjectSyllabusDto> = when {
        modelProgramId != null -> syllabi.findAllByModelProgramIdAndDeletedFalseOrderByNameAsc(modelProgramId)
        subjectId != null -> syllabi.findAllBySubjectIdAndDeletedFalseOrderByNameAsc(subjectId)
        else -> syllabi.findAllByDeletedFalseOrderByNameAsc()
    }.map(::dto)

    /**
     * O'quv dasturidan (namunaviy) o'quv yili va semestr uchun fan dasturi (ishchi dastur) yaratiladi:
     * fan, til va ta'riflar o'quv dasturidan olinadi, mavzular shu yerda beriladi.
     */
    @Transactional
    fun createWorkProgram(model: SubjectModelProgram, academicYear: String, semester: Int, topics: List<SyllabusTopicRequest>): SubjectSyllabusDto {
        val year = academicYear.trim()
        require(Regex("[0-9]{4}-[0-9]{4}").matches(year)) { "O'quv yili 2026-2027 ko'rinishida bo'lishi kerak" }
        require(semester in 1..12) { "Semestr 1-12 oralig'ida bo'lishi kerak" }
        require(model.active && model.subject.active && !model.subject.deleted) { "O'quv dasturi va fan faol bo'lishi kerak" }
        val modelId = requireNotNull(model.id)
        require(!syllabi.existsByModelProgramIdAndAcademicYearAndSemesterAndDeletedFalse(modelId, year, semester)) {
            "Bu o'quv dasturi uchun $year o'quv yili $semester-semestr fan dasturi allaqachon mavjud"
        }
        val name = "${model.subject.name.trim()} · $year · $semester-semestr".take(500)
        require(!syllabi.existsBySubjectIdAndLanguageAndNameIgnoreCaseAndDeletedFalse(requireNotNull(model.subject.id), model.language, name)) {
            DUPLICATE_MESSAGE
        }
        val value = SubjectSyllabus(
            subject = model.subject, name = name, language = model.language,
            shortDescription = model.shortDescription, requirements = model.requirements,
            fullDescription = model.fullDescription, active = true,
        ).apply {
            modelProgram = model
            this.academicYear = year
            this.semester = semester
        }
        replaceTopics(value, topics)
        return dto(syllabi.save(value))
    }

    @Transactional
    fun create(request: SubjectSyllabusRequest): SubjectSyllabusDto {
        val subject = subjects.getEntity(request.subjectId)
        val normalized = normalize(request)
        val name = syllabusName(request, subject.name)
        require(!syllabi.existsBySubjectIdAndLanguageAndNameIgnoreCaseAndDeletedFalse(request.subjectId, request.language, name)) {
            DUPLICATE_MESSAGE
        }
        val value = SubjectSyllabus(
            subject = subject, name = name, language = request.language,
            shortDescription = normalized.shortDescription, requirements = normalized.requirements,
            fullDescription = normalized.fullDescription, active = request.active,
        )
        request.topics?.let { replaceTopics(value, it) }
        return dto(syllabi.save(value))
    }

    /** O'quv rejadan: fan uchun (o'quv dasturi namunasiga bog'langan) yangi o'quv dasturi; nomi — fan nomi. */
    @Transactional
    fun createForSubject(model: SubjectModelProgram, shortDescription: String, requirements: String?, fullDescription: String): SubjectSyllabus {
        val subject = model.subject
        val name = subject.name.trim().take(500)
        require(!syllabi.existsBySubjectIdAndLanguageAndNameIgnoreCaseAndDeletedFalse(requireNotNull(subject.id), model.language, name)) {
            "«$name» fani uchun bu tilda o'quv dasturi allaqachon bor — uni ro'yxatdan tanlang"
        }
        val normalized = normalize(SubjectSyllabusRequest(requireNotNull(subject.id), name, model.language, shortDescription, requirements, fullDescription))
        return syllabi.save(SubjectSyllabus(
            subject = subject, name = name, language = model.language, shortDescription = normalized.shortDescription,
            requirements = normalized.requirements, fullDescription = normalized.fullDescription, active = true,
        ).apply { modelProgram = model })
    }

    @Transactional
    fun update(id: Long, request: SubjectSyllabusRequest): SubjectSyllabusDto {
        val value = lock(id)
        require(value.status == "DRAFT") { "Faqat qoralama tahrirlanadi. Avval yangi versiya oching." }
        require(value.revisionNumber == 1 || (value.subject.id == request.subjectId && value.language == request.language)) {
            "Yangi versiyada fan va til o'zgartirilmaydi; boshqa fan uchun alohida dastur yarating"
        }
        val subject = subjects.getEntity(request.subjectId)
        val normalized = normalize(request)
        // Nom yuborilmasa va fan o'zgarmasa — mavjud nom saqlanadi (eski dasturlar nomi buzilmaydi)
        val name = if (request.name.isNullOrBlank() && value.subject.id == subject.id) value.name
            else syllabusName(request, subject.name)
        require(!syllabi.existsBySubjectIdAndLanguageAndNameIgnoreCaseAndDeletedFalseAndIdNot(request.subjectId, request.language, name, id)) {
            DUPLICATE_MESSAGE
        }
        value.subject = subject
        value.name = name
        value.language = request.language
        value.shortDescription = normalized.shortDescription
        value.requirements = normalized.requirements
        value.fullDescription = normalized.fullDescription
        value.active = request.active
        request.topics?.let { replaceTopics(value, it) }
        return dto(syllabi.saveAndFlush(value))
    }

    /** Dastur yaratilgandan keyin mavzular alohida kiritiladi: ro'yxat to'liq almashtiriladi (faqat qoralamada). */
    @Transactional
    fun updateTopics(id: Long, topics: List<SyllabusTopicRequest>): SubjectSyllabusDto {
        val value = lock(id)
        require(value.status == "DRAFT") { "Mavzular faqat qoralamada tahrirlanadi. Avval yangi versiya oching." }
        replaceTopics(value, topics)
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
        val ids = requests.mapNotNull { it.id }
        require(ids.size == ids.toSet().size) { "Bir mavzu ro'yxatda ikki marta berilgan" }
        // id berilgan mavzu joyida yangilanadi (kurs bo'limlari unga bog'langan), qolganlari yangi yaratiladi
        val existing = value.topics.filter { it.id != null }.associateBy { requireNotNull(it.id) }
        val topics = requests.groupBy { it.type }.flatMap { (type, items) ->
            items.mapIndexed { index, item ->
                val title = item.title.trim()
                require(title.length in 2..500) { "Mavzu nomi 2-500 belgi bo'lishi kerak" }
                require(item.hours == null || item.hours in 1..MAX_TOPIC_HOURS) { "\"$title\" mavzusi soati 1-$MAX_TOPIC_HOURS oralig'ida bo'lishi kerak" }
                val description = item.description?.trim()?.takeIf(String::isNotEmpty)
                require(item.part == null || item.part in 1..12) { "\"$title\" mavzusining qismi 1-12 oralig'ida bo'lishi kerak" }
                item.id?.let { id ->
                    val topic = existing[id] ?: throw IllegalArgumentException("Mavzu ushbu dasturga tegishli emas: $id")
                    topic.type = type
                    topic.sortOrder = index + 1
                    topic.title = title
                    topic.description = description
                    topic.hours = item.hours
                    topic.part = item.part
                    topic
                } ?: SubjectSyllabusTopic(
                    syllabus = value, type = type, sortOrder = index + 1, title = title,
                    description = description, hours = item.hours,
                ).apply { part = item.part }
            }
        }
        value.topics.removeIf { old -> topics.none { it === old } }
        topics.filter { new -> value.topics.none { it === new } }.forEach(value.topics::add)
    }

    private fun lock(id: Long) = syllabi.lockById(id) ?: throw NoSuchElementException("O'quv dasturi topilmadi: $id")

    private fun requireEntity(id: Long) = syllabi.findByIdAndDeletedFalse(id)
        ?: throw NoSuchElementException("O'quv dasturi topilmadi: $id")

    /** Nom berilmasa (yangi forma) — fan nomi; shu sababli bir fan va til uchun bitta dastur bo'ladi. */
    private fun syllabusName(request: SubjectSyllabusRequest, subjectName: String): String =
        (request.name?.trim()?.ifBlank { null } ?: subjectName.trim()).take(500)
            .also { require(it.isNotBlank()) { "O'quv dasturi nomi aniqlanmadi" } }

    private fun normalize(value: SubjectSyllabusRequest) = value.copy(
        shortDescription = value.shortDescription.trim().also { require(it.length in 3..2000) { "Qisqa ta'rif 3-2000 belgi bo'lishi kerak" } },
        requirements = value.requirements?.trim()?.takeIf(String::isNotEmpty),
        fullDescription = value.fullDescription.trim().also { require(it.length >= 3) { "To'liq ta'rif majburiy" } },
    )

    private fun dto(value: SubjectSyllabus): SubjectSyllabusDto {
        val topics = value.topics.sortedWith(compareBy({ it.type }, { it.sortOrder })).map {
            SyllabusTopicDto(it.id, it.type, it.sortOrder, it.title, it.description, it.hours, it.part)
        }
        return SubjectSyllabusDto(
            id = requireNotNull(value.id), subjectId = requireNotNull(value.subject.id), subjectCode = value.subject.code,
            subjectName = value.subject.name, name = value.name, language = value.language,
            shortDescription = value.shortDescription, requirements = value.requirements,
            fullDescription = value.fullDescription, active = value.active,
            createdAt = value.createdAt, updatedAt = value.updatedAt,
            status = value.status, revisionNumber = value.revisionNumber,
            topics = topics,
            theoreticalHours = topics.filter { it.type == SyllabusTopicType.THEORETICAL }.sumOf { it.hours ?: 0 },
            practicalHours = topics.filter { it.type == SyllabusTopicType.PRACTICAL }.sumOf { it.hours ?: 0 },
            laboratoryHours = topics.filter { it.type == SyllabusTopicType.LABORATORY }.sumOf { it.hours ?: 0 },
            seminarHours = topics.filter { it.type == SyllabusTopicType.SEMINAR }.sumOf { it.hours ?: 0 },
            modelProgramId = value.modelProgram?.id,
            academicYear = value.academicYear,
            semester = value.semester,
        )
    }

    private companion object {
        const val MAX_TOPICS = 300
        const val MAX_TOPIC_HOURS = 200
        const val DUPLICATE_MESSAGE = "Ushbu fan va til uchun o'quv dasturi allaqachon mavjud — uni tahrirlang yoki yangi versiya oching"
    }
}
