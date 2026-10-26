package uz.scorm.lms.app.v1.curriculum.service

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.audit.service.AuditService
import uz.scorm.lms.app.v1.curriculum.dto.CreateCurriculumSyllabusRequest
import uz.scorm.lms.app.v1.curriculum.dto.CurriculumVersionDto
import uz.scorm.lms.app.v1.curriculum.model.CurriculumStatus
import uz.scorm.lms.app.v1.curriculum.model.ProgramCurriculumSubject
import uz.scorm.lms.app.v1.curriculum.repository.ProgramCurriculumSubjectRepository
import uz.scorm.lms.app.v1.curriculum.repository.ProgramCurriculumVersionRepository
import uz.scorm.lms.app.v1.syllabus.model.SubjectModelProgram
import uz.scorm.lms.app.v1.syllabus.model.SubjectSyllabus
import uz.scorm.lms.app.v1.syllabus.model.SyllabusLanguage
import uz.scorm.lms.app.v1.syllabus.repository.SubjectModelProgramRepository
import uz.scorm.lms.app.v1.syllabus.repository.SubjectSyllabusRepository
import uz.scorm.lms.app.v1.syllabus.service.SubjectSyllabusService

/**
 * O'quv rejadagi fanga o'quv dasturini biriktirish: mavjudini tanlash yoki yangisini yaratish.
 * Ko'p semestrli fanning (bir fan, bir necha semestr qatori) barcha qatorlari bitta dasturga bog'lanadi.
 */
@Service
class CurriculumSyllabusService(
    private val versions: ProgramCurriculumVersionRepository,
    private val items: ProgramCurriculumSubjectRepository,
    private val syllabi: SubjectSyllabusRepository,
    private val modelPrograms: SubjectModelProgramRepository,
    private val syllabusService: SubjectSyllabusService,
    private val auditService: AuditService,
    private val curriculumService: ProgramCurriculumService,
) {
    @Transactional
    fun attach(id: Long, itemId: Long, syllabusId: Long, actorId: Long): CurriculumVersionDto {
        val rows = subjectRows(id, itemId)
        val syllabus = syllabi.findByIdAndDeletedFalse(syllabusId) ?: throw NoSuchElementException("O'quv dasturi topilmadi: $syllabusId")
        require(syllabus.subject.id == rows.first().subject?.id) { "O'quv dasturi boshqa fanga tegishli" }
        link(rows, syllabus)
        auditService.logAction("CURRICULUM_SYLLABUS_ATTACHED", actorId, "curriculum=$id; item=$itemId; syllabus=$syllabusId")
        return curriculumService.get(id)
    }

    @Transactional
    fun detach(id: Long, itemId: Long, actorId: Long): CurriculumVersionDto {
        link(subjectRows(id, itemId), null)
        auditService.logAction("CURRICULUM_SYLLABUS_DETACHED", actorId, "curriculum=$id; item=$itemId")
        return curriculumService.get(id)
    }

    /** Fan nomi bilan yangi o'quv dasturi yaratiladi (fan va til bo'yicha namunaviy dasturga bog'lanadi) va biriktiriladi. */
    @Transactional
    fun createAndAttach(id: Long, itemId: Long, request: CreateCurriculumSyllabusRequest, actorId: Long): CurriculumVersionDto {
        val rows = subjectRows(id, itemId)
        val subject = requireNotNull(rows.first().subject)
        val model = modelPrograms.findFirstBySubjectIdAndLanguageAndDeletedFalse(requireNotNull(subject.id), request.language)
            ?: modelPrograms.save(SubjectModelProgram(
                subject = subject, language = request.language, name = subject.name.trim().take(500),
                shortDescription = request.shortDescription.trim(), requirements = request.requirements?.trim()?.ifBlank { null },
                fullDescription = request.fullDescription.trim(),
            ))
        val syllabus = syllabusService.createForSubject(model, request.shortDescription, request.requirements, request.fullDescription)
        link(rows, syllabus)
        auditService.logAction("CURRICULUM_SYLLABUS_CREATED", actorId, "curriculum=$id; item=$itemId; syllabus=${syllabus.id}")
        return curriculumService.get(id)
    }

    /**
     * Bitta tugma ("+ Mavzular"): fanga dastur biriktirilmagan bo'lsa, reja tilidagi mavjud dastur biriktiriladi
     * (tasdiqlangani afzal), bo'lmasa fan nomi bilan yangisi yaratiladi. Biriktirilgan dastur id'si qaytadi.
     */
    @Transactional
    fun ensure(id: Long, itemId: Long, actorId: Long): Long {
        val rows = subjectRows(id, itemId)
        rows.firstNotNullOfOrNull { it.syllabus }?.let { return requireNotNull(it.id) }
        val subject = requireNotNull(rows.first().subject)
        val language = LANGUAGES[rows.first().curriculumVersion.educationLanguage] ?: SyllabusLanguage.UZ
        val existing = syllabi.findAllBySubjectIdAndDeletedFalseOrderByNameAsc(requireNotNull(subject.id))
            .filter { it.language == language }
            .maxByOrNull { if (it.status == "APPROVED") 2 else 1 }
        if (existing != null) {
            link(rows, existing)
            auditService.logAction("CURRICULUM_SYLLABUS_ATTACHED", actorId, "curriculum=$id; item=$itemId; syllabus=${existing.id}; auto=true")
            return requireNotNull(existing.id)
        }
        val text = "${subject.name.trim()} fanining o'quv dasturi"
        createAndAttach(id, itemId, CreateCurriculumSyllabusRequest(language, text, null, text), actorId)
        return requireNotNull(subjectRows(id, itemId).first().syllabus?.id)
    }

    private fun link(rows: List<ProgramCurriculumSubject>, syllabus: SubjectSyllabus?) {
        rows.forEach { it.syllabus = syllabus; items.save(it) }
    }

    /** Reja fani va shu fanning rejadagi barcha semestr qatorlari. */
    private fun subjectRows(id: Long, itemId: Long): List<ProgramCurriculumSubject> {
        val version = versions.findByIdAndDeletedFalse(id) ?: throw NoSuchElementException("Curriculum versiyasi topilmadi: $id")
        require(version.status != CurriculumStatus.ARCHIVED) { "Arxivlangan o'quv rejaga dastur biriktirilmaydi" }
        val item = items.findByIdAndDeletedFalse(itemId) ?: throw NoSuchElementException("Curriculum fan bandi topilmadi: $itemId")
        require(item.curriculumVersion.id == id) { "Fan bandi ushbu curriculumga tegishli emas" }
        val subjectId = requireNotNull(item.subject?.id) { "Reja fani katalogdagi fanga bog'lanmagan" }
        return items.findAllByCurriculumVersionIdAndDeletedFalseOrderBySemesterAscSubjectNameSnapshotAsc(id)
            .filter { it.subject?.id == subjectId }
    }

    private companion object {
        /** O'quv reja tili -> dastur tili */
        val LANGUAGES = mapOf(
            "uz" to SyllabusLanguage.UZ, "uz-Latn" to SyllabusLanguage.UZ, "uz-Cyrl" to SyllabusLanguage.UZ_CYRILLIC,
            "kaa" to SyllabusLanguage.KAA, "ru" to SyllabusLanguage.RU, "en" to SyllabusLanguage.EN,
        )
    }
}
