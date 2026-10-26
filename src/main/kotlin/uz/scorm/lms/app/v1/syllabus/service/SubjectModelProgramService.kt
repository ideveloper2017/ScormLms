package uz.scorm.lms.app.v1.syllabus.service

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.subject.service.SubjectService
import uz.scorm.lms.app.v1.syllabus.dto.SubjectModelProgramDto
import uz.scorm.lms.app.v1.syllabus.dto.SubjectModelProgramRequest
import uz.scorm.lms.app.v1.syllabus.model.SubjectModelProgram
import uz.scorm.lms.app.v1.syllabus.repository.SubjectModelProgramRepository
import uz.scorm.lms.app.v1.syllabus.repository.SubjectSyllabusRepository

/** O'quv dasturi (namunaviy): fan, til va ta'riflar. Fan dasturlari (ishchi) shundan yaratiladi. */
@Service
class SubjectModelProgramService(
    private val programs: SubjectModelProgramRepository,
    private val syllabi: SubjectSyllabusRepository,
    private val subjects: SubjectService,
) {
    @Transactional(readOnly = true)
    fun list(): List<SubjectModelProgramDto> {
        val counts = syllabi.findAllByDeletedFalseOrderByNameAsc().mapNotNull { it.modelProgram?.id }.groupingBy { it }.eachCount()
        return programs.findAllByDeletedFalseOrderByNameAsc().map { dto(it, counts[it.id] ?: 0) }
    }

    @Transactional(readOnly = true)
    fun getEntity(id: Long): SubjectModelProgram = programs.findByIdAndDeletedFalse(id)
        ?: throw NoSuchElementException("O'quv dasturi topilmadi: $id")

    @Transactional
    fun create(request: SubjectModelProgramRequest): SubjectModelProgramDto {
        val subject = subjects.getEntity(request.subjectId)
        require(!programs.existsBySubjectIdAndLanguageAndDeletedFalse(request.subjectId, request.language)) { DUPLICATE_MESSAGE }
        val value = SubjectModelProgram(
            subject = subject, language = request.language, name = subject.name.trim().take(500),
            shortDescription = shortDescription(request), requirements = request.requirements?.trim()?.takeIf(String::isNotEmpty),
            fullDescription = fullDescription(request), active = request.active,
        )
        return dto(programs.save(value), 0)
    }

    @Transactional
    fun update(id: Long, request: SubjectModelProgramRequest): SubjectModelProgramDto {
        val value = getEntity(id)
        val count = syllabi.countByModelProgramIdAndDeletedFalse(id).toInt()
        require(count == 0 || (value.subject.id == request.subjectId && value.language == request.language)) {
            "Fan dasturlari mavjud — o'quv dasturining fani va tili o'zgartirilmaydi"
        }
        require(!programs.existsBySubjectIdAndLanguageAndDeletedFalseAndIdNot(request.subjectId, request.language, id)) { DUPLICATE_MESSAGE }
        val subject = subjects.getEntity(request.subjectId)
        value.subject = subject
        value.name = subject.name.trim().take(500)
        value.language = request.language
        value.shortDescription = shortDescription(request)
        value.requirements = request.requirements?.trim()?.takeIf(String::isNotEmpty)
        value.fullDescription = fullDescription(request)
        value.active = request.active
        return dto(programs.save(value), count)
    }

    @Transactional
    fun delete(id: Long) {
        val value = getEntity(id)
        require(syllabi.countByModelProgramIdAndDeletedFalse(id) == 0L) {
            "Bu o'quv dasturidan fan dasturlari yaratilgan — avval ularni o'chiring"
        }
        programs.delete(value)
    }

    private fun shortDescription(request: SubjectModelProgramRequest) = request.shortDescription.trim()
        .also { require(it.length in 3..2000) { "Qisqa ta'rif 3-2000 belgi bo'lishi kerak" } }

    private fun fullDescription(request: SubjectModelProgramRequest) = request.fullDescription.trim()
        .also { require(it.length >= 3) { "To'liq ta'rif majburiy" } }

    private fun dto(value: SubjectModelProgram, workProgramCount: Int) = SubjectModelProgramDto(
        id = requireNotNull(value.id), subjectId = requireNotNull(value.subject.id), subjectCode = value.subject.code,
        subjectName = value.subject.name, subjectCredits = value.subject.credits, language = value.language, name = value.name,
        shortDescription = value.shortDescription, requirements = value.requirements, fullDescription = value.fullDescription,
        active = value.active, workProgramCount = workProgramCount, createdAt = value.createdAt, updatedAt = value.updatedAt,
    )

    private companion object {
        const val DUPLICATE_MESSAGE = "Ushbu fan va til uchun o'quv dasturi allaqachon mavjud"
    }
}
