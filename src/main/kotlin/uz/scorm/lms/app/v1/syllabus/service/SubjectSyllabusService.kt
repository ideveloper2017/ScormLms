package uz.scorm.lms.app.v1.syllabus.service

import org.springframework.context.ApplicationEventPublisher
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.subject.service.SubjectService
import uz.scorm.lms.app.v1.syllabus.dto.SubjectSyllabusDto
import uz.scorm.lms.app.v1.syllabus.dto.SubjectSyllabusRequest
import uz.scorm.lms.app.v1.syllabus.dto.SyllabusModuleDto
import uz.scorm.lms.app.v1.syllabus.dto.SyllabusModuleRequest
import uz.scorm.lms.app.v1.syllabus.dto.SyllabusTopicDto
import uz.scorm.lms.app.v1.syllabus.dto.SyllabusTopicRequest
import uz.scorm.lms.app.v1.syllabus.model.SubjectModelProgram
import uz.scorm.lms.app.v1.syllabus.model.SubjectSyllabus
import uz.scorm.lms.app.v1.syllabus.model.SubjectSyllabusModule
import uz.scorm.lms.app.v1.syllabus.model.SubjectSyllabusTopic
import uz.scorm.lms.app.v1.syllabus.model.SyllabusTopicType
import uz.scorm.lms.app.v1.syllabus.repository.SubjectSyllabusRepository

/** Dastur tasdiqlandi — bog'langan kurslar shu tranzaksiyada dasturga moslanadi (kontenti talabaga ochiladi) */
data class SyllabusApprovedEvent(val syllabusId: Long)

@Service
class SubjectSyllabusService(
    private val syllabi: SubjectSyllabusRepository,
    private val subjects: SubjectService,
    private val revisions: uz.scorm.lms.app.v1.syllabus.repository.SubjectSyllabusRevisionRepository,
    private val mapper: tools.jackson.databind.ObjectMapper,
    private val audit: uz.scorm.lms.app.v1.audit.service.AuditService,
    private val materials: uz.scorm.lms.app.v1.courses.repository.SubjectMaterialRepository,
    private val lessonQuizzes: uz.scorm.lms.app.v1.syllabus.repository.SyllabusLessonQuizRepository,
    private val events: ApplicationEventPublisher,
) {
    /** Tanlangan dasturlar (talaba o'quv rejasidagi fanlar dasturlari uchun) */
    @Transactional(readOnly = true)
    fun findAll(ids: Collection<Long>): List<SubjectSyllabusDto> =
        if (ids.isEmpty()) emptyList() else syllabi.findAllById(ids).filter { !it.deleted }.map(::dto)

    @Transactional(readOnly = true)
    fun list(subjectId: Long?, modelProgramId: Long? = null): List<SubjectSyllabusDto> = when {
        modelProgramId != null -> syllabi.findAllByModelProgramIdAndDeletedFalseOrderByNameAsc(modelProgramId)
        subjectId != null -> syllabi.findAllBySubjectIdAndDeletedFalseOrderByNameAsc(subjectId) +
            syllabi.findAllBySubjectIsNullAndDeletedFalseOrderByNameAsc()
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
        val subject = request.subjectId?.let(subjects::getEntity)
        val normalized = normalize(request)
        val name = syllabusName(request, subject?.name)
        require(if (subject != null) !syllabi.existsBySubjectIdAndLanguageAndNameIgnoreCaseAndDeletedFalse(requireNotNull(subject.id), request.language, name)
            else !syllabi.existsBySubjectIsNullAndLanguageAndNameIgnoreCaseAndDeletedFalse(request.language, name)) {
            DUPLICATE_MESSAGE
        }
        val value = SubjectSyllabus(
            subject = subject, name = name, language = request.language,
            shortDescription = normalized.shortDescription, requirements = normalized.requirements,
            fullDescription = normalized.fullDescription, active = request.active,
        ).apply { learningOutcomes = normalized.learningOutcomes; introVideoUrl = normalized.introVideoUrl }
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
        // Fan yuborilmasa — mavjudi saqlanadi (fan o'quv reja taxtasida biriktiriladi)
        val subject = request.subjectId?.let(subjects::getEntity) ?: value.subject
        require(value.revisionNumber == 1 || (value.subject?.id == subject?.id && value.language == request.language)) {
            "Yangi versiyada fan va til o'zgartirilmaydi; boshqa fan uchun alohida dastur yarating"
        }
        val normalized = normalize(request)
        // Nom yuborilmasa va fan o'zgarmasa — mavjud nom saqlanadi (eski dasturlar nomi buzilmaydi)
        val name = if (request.name.isNullOrBlank() && value.subject?.id == subject?.id) value.name
            else syllabusName(request, subject?.name)
        require(if (subject != null) !syllabi.existsBySubjectIdAndLanguageAndNameIgnoreCaseAndDeletedFalseAndIdNot(requireNotNull(subject.id), request.language, name, id)
            else !syllabi.existsBySubjectIsNullAndLanguageAndNameIgnoreCaseAndDeletedFalseAndIdNot(request.language, name, id)) {
            DUPLICATE_MESSAGE
        }
        value.subject = subject
        value.name = name
        value.language = request.language
        value.shortDescription = normalized.shortDescription
        value.requirements = normalized.requirements
        value.learningOutcomes = normalized.learningOutcomes
        value.introVideoUrl = normalized.introVideoUrl
        value.fullDescription = normalized.fullDescription
        value.active = request.active
        request.topics?.let { replaceTopics(value, it) }
        return dto(syllabi.saveAndFlush(value))
    }

    /** Dastur yaratilgandan keyin mavzular alohida kiritiladi: ro'yxat to'liq almashtiriladi (faqat qoralamada). */
    /** Modullar va darslar (Everest "Dasturlar" tabi) — faqat qoralamada */
    @Transactional
    fun updateModules(id: Long, modules: List<SyllabusModuleRequest>): SubjectSyllabusDto {
        val value = lock(id)
        require(value.status == "DRAFT") { "Dastur tuzilmasi faqat qoralamada tahrirlanadi. Avval yangi versiya oching." }
        replaceModules(value, modules)
        return dto(syllabi.saveAndFlush(value))
    }

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
        // Bog'langan dastur o'chirilsa baza FK xatosi chiqardi — tushunarli xabar bilan to'xtatiladi
        require(!syllabi.isUsedByCurriculum(id)) { "Dastur o'quv reja faniga biriktirilgan: avval rejadagi fandan uzing" }
        require(!syllabi.isUsedByCourse(id)) { "Dastur kursga bog'langan, o'chirib bo'lmaydi" }
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
                require(subjectUsable(value) && value.active) { "Fan va dastur faol bo'lishi kerak" }
                value.status = "IN_REVIEW"
            }
            "RETURN" -> {
                require(value.status == "IN_REVIEW") { "Faqat tekshiruvdagi versiya qaytariladi" }
                value.status = "DRAFT"
            }
            "APPROVE" -> {
                require(value.status == "IN_REVIEW") { "Avval tekshiruvga yuboring" }
                require(subjectUsable(value) && value.active) { "Fan va dastur faol bo'lishi kerak" }
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
        val saved = syllabi.save(value)
        if (action == "APPROVE") events.publishEvent(SyllabusApprovedEvent(id))
        return dto(saved)
    }

    /**
     * Mavzular ro'yxatini to'liq almashtiradi; qaytgan ro'yxat so'rov tartibida. sortOrder — har mashg'ulot turi
     * ichidagi tartib (kurs bo'limlari shu bo'yicha), modul va undagi tartib o'zgarmaydi (replaceModules belgilaydi).
     */
    private fun replaceTopics(value: SubjectSyllabus, requests: List<SyllabusTopicRequest>): List<SubjectSyllabusTopic> {
        require(requests.size <= MAX_TOPICS) { "Mavzular soni $MAX_TOPICS tadan oshmasligi kerak" }
        val ids = requests.mapNotNull { it.id }
        require(ids.size == ids.toSet().size) { "Bir mavzu ro'yxatda ikki marta berilgan" }
        // id berilgan mavzu joyida yangilanadi (kurs bo'limlari unga bog'langan), qolganlari yangi yaratiladi
        val existing = value.topics.filter { it.id != null }.associateBy { requireNotNull(it.id) }
        val counters = mutableMapOf<SyllabusTopicType, Int>()
        val topics = requests.map { item ->
            val order = counters.merge(item.type, 1, Int::plus)!!
            val title = item.title.trim()
            require(title.length in 2..500) { "Mavzu nomi 2-500 belgi bo'lishi kerak" }
            require(item.hours == null || item.hours in 1..MAX_TOPIC_HOURS) { "\"$title\" mavzusi soati 1-$MAX_TOPIC_HOURS oralig'ida bo'lishi kerak" }
            val description = item.description?.trim()?.takeIf(String::isNotEmpty)
            require(item.part == null || item.part in 1..12) { "\"$title\" mavzusining qismi 1-12 oralig'ida bo'lishi kerak" }
            item.id?.let { id ->
                val topic = existing[id] ?: throw IllegalArgumentException("Mavzu ushbu dasturga tegishli emas: $id")
                topic.type = item.type
                topic.sortOrder = order
                topic.title = title
                topic.description = description
                topic.hours = item.hours
                topic.part = item.part
                topic
            } ?: SubjectSyllabusTopic(
                syllabus = value, type = item.type, sortOrder = order, title = title,
                description = description, hours = item.hours,
            ).apply { part = item.part }
        }
        value.topics.removeIf { old -> topics.none { it === old } }
        topics.filter { new -> value.topics.none { it === new } }.forEach(value.topics::add)
        return topics
    }

    /** Dastur tuzilmasini (modullar va darslari) to'liq almashtiradi; dars id'si berilsa kursdagi bog'lanish saqlanadi */
    private fun replaceModules(value: SubjectSyllabus, requests: List<SyllabusModuleRequest>) {
        require(requests.size <= MAX_MODULES) { "Modullar soni $MAX_MODULES tadan oshmasligi kerak" }
        val moduleIds = requests.mapNotNull { it.id }
        require(moduleIds.size == moduleIds.toSet().size) { "Bir modul ro'yxatda ikki marta berilgan" }
        val existing = value.modules.filter { it.id != null }.associateBy { requireNotNull(it.id) }
        val modules = requests.mapIndexed { index, item ->
            val name = item.name.trim()
            require(name.length in 3..255) { "Modul nomi 3-255 belgi bo'lishi kerak" }
            val description = item.description?.trim()?.takeIf(String::isNotEmpty)
            require(description == null || description.length <= 500) { "\"$name\" modulining ma'lumoti 500 belgidan oshmasligi kerak" }
            val module = item.id?.let { id ->
                existing[id] ?: throw IllegalArgumentException("Modul ushbu dasturga tegishli emas: $id")
            } ?: SubjectSyllabusModule(syllabus = value, sortOrder = index + 1, name = name)
            module.sortOrder = index + 1
            module.name = name
            module.description = description
            module
        }
        val lessons = replaceTopics(value, requests.flatMap { it.lessons })
        var position = 0
        requests.forEachIndexed { index, item ->
            item.lessons.forEachIndexed { lessonIndex, _ ->
                lessons[position++].apply { module = modules[index]; lessonOrder = lessonIndex + 1 }
            }
        }
        value.modules.removeIf { old -> modules.none { it === old } }
        modules.filter { new -> value.modules.none { it === new } }.forEach(value.modules::add)
    }

    private fun lock(id: Long) = syllabi.lockById(id) ?: throw NoSuchElementException("O'quv dasturi topilmadi: $id")

    private fun requireEntity(id: Long) = syllabi.findByIdAndDeletedFalse(id)
        ?: throw NoSuchElementException("O'quv dasturi topilmadi: $id")

    /** Fansiz dastur ham tasdiqlanadi; fan bo'lsa u faol bo'lishi kerak */
    private fun subjectUsable(value: SubjectSyllabus) = value.subject?.let { it.active && !it.deleted } ?: true

    /** Nom berilmasa — fan nomi; fansiz dasturda nom majburiy. */
    private fun syllabusName(request: SubjectSyllabusRequest, subjectName: String?): String =
        (request.name?.trim()?.ifBlank { null } ?: subjectName?.trim().orEmpty()).take(500)
            .also { require(it.isNotBlank()) { "O'quv dasturi nomini kiriting" } }

    private fun normalize(value: SubjectSyllabusRequest) = value.copy(
        shortDescription = value.shortDescription.trim().also { require(it.length in 3..2000) { "Qisqa ta'rif 3-2000 belgi bo'lishi kerak" } },
        requirements = value.requirements?.trim()?.takeIf(String::isNotEmpty),
        learningOutcomes = value.learningOutcomes?.trim()?.takeIf(String::isNotEmpty),
        fullDescription = value.fullDescription.trim().also { require(hasText(it)) { "To'liq ta'rif majburiy" } },
        introVideoUrl = value.introVideoUrl?.trim()?.takeIf(String::isNotEmpty)?.also {
            require(it.length <= 1000 && Regex("^https?://\\S+$", RegexOption.IGNORE_CASE).matches(it)) { "Video havolasi http(s):// bilan boshlanishi kerak" }
        },
    )

    /** To'liq ta'rif muharrirdan HTML bo'lib keladi: teglarsiz kamida 3 belgi yoki rasm/formula */
    private fun hasText(html: String): Boolean =
        html.contains("<img", ignoreCase = true) || html.contains("math-tex") ||
            html.replace(Regex("<[^>]*>"), " ").replace("&nbsp;", " ").trim().length >= 3

    private fun dto(value: SubjectSyllabus): SubjectSyllabusDto {
        val topicIds = value.topics.mapNotNull { it.id }
        val materialCounts = if (topicIds.isEmpty()) emptyMap()
            else materials.countBySyllabusTopics(topicIds).associate { it.topicId to it.total.toInt() }
        val quizCounts = if (topicIds.isEmpty()) emptyMap()
            else lessonQuizzes.countByTopics(topicIds).associate { it.topicId to it.total.toInt() }
        val topics = value.topics.sortedWith(compareBy({ it.type }, { it.sortOrder })).map {
            SyllabusTopicDto(it.id, it.type, it.sortOrder, it.title, it.description, it.hours, it.part, it.module?.id, it.lessonOrder,
                materialCount = materialCounts[it.id] ?: 0, quizCount = quizCounts[it.id] ?: 0)
        }
        val modules = value.modules.sortedBy { it.sortOrder }.map { module ->
            SyllabusModuleDto(
                id = requireNotNull(module.id), sortOrder = module.sortOrder, name = module.name, description = module.description,
                lessons = topics.filter { it.moduleId == module.id }.sortedWith(compareBy({ it.lessonOrder ?: Int.MAX_VALUE }, { it.type }, { it.sortOrder })),
            )
        }
        return SubjectSyllabusDto(
            id = requireNotNull(value.id), subjectId = value.subject?.id, subjectCode = value.subject?.code,
            subjectName = value.subject?.name, name = value.name, language = value.language,
            shortDescription = value.shortDescription, requirements = value.requirements,
            learningOutcomes = value.learningOutcomes,
            coverImageAvailable = value.coverImage != null,
            introVideoName = value.introVideo?.let { value.introVideoName ?: "video" },
            introVideoUrl = value.introVideoUrl,
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
            modules = modules,
        )
    }

    private companion object {
        const val MAX_MODULES = 50
        const val MAX_TOPICS = 300
        const val MAX_TOPIC_HOURS = 200
        const val DUPLICATE_MESSAGE = "Ushbu fan va til uchun o'quv dasturi allaqachon mavjud — uni tahrirlang yoki yangi versiya oching"
    }
}
