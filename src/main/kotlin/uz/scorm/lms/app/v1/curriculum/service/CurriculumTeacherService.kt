package uz.scorm.lms.app.v1.curriculum.service

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.audit.service.AuditService
import uz.scorm.lms.app.v1.curriculum.dto.CurriculumVersionDto
import uz.scorm.lms.app.v1.curriculum.model.CurriculumStatus
import uz.scorm.lms.app.v1.curriculum.repository.ProgramCurriculumSubjectRepository
import uz.scorm.lms.app.v1.curriculum.repository.ProgramCurriculumVersionRepository
import uz.scorm.lms.app.v1.teacher.repository.TeacherRepository

/** O'quv rejadagi fanning semestr qatoriga mas'ul o'qituvchini biriktirish yoki olib tashlash. */
@Service
class CurriculumTeacherService(
    private val versions: ProgramCurriculumVersionRepository,
    private val items: ProgramCurriculumSubjectRepository,
    private val teachers: TeacherRepository,
    private val auditService: AuditService,
    private val curriculumService: ProgramCurriculumService,
) {
    @Transactional
    fun assign(id: Long, itemId: Long, teacherId: Long?, actorId: Long): CurriculumVersionDto {
        val version = versions.findByIdAndDeletedFalse(id) ?: throw NoSuchElementException("O'quv reja topilmadi: $id")
        require(version.status != CurriculumStatus.ARCHIVED) { "Arxivlangan o'quv rejaga o'qituvchi biriktirilmaydi" }
        val item = items.findByIdAndDeletedFalse(itemId) ?: throw NoSuchElementException("O'quv rejadagi fan topilmadi: $itemId")
        require(item.curriculumVersion.id == id) { "Fan bu o'quv rejaga tegishli emas" }
        item.teacher = teacherId?.let {
            teachers.findById(it).orElseThrow { NoSuchElementException("O'qituvchi topilmadi: $it") }
                .also { teacher -> require(teacher.active) { "Faol bo'lmagan o'qituvchi biriktirilmaydi" } }
        }
        items.save(item)
        auditService.logAction(if (teacherId == null) "CURRICULUM_TEACHER_REMOVED" else "CURRICULUM_TEACHER_ASSIGNED", actorId,
            "curriculum=$id; item=$itemId; teacher=${teacherId ?: "-"}")
        return curriculumService.get(id)
    }
}
