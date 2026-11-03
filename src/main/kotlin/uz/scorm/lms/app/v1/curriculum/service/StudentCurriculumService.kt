package uz.scorm.lms.app.v1.curriculum.service

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.curriculum.dto.CurriculumVersionDto
import uz.scorm.lms.app.v1.curriculum.model.CurriculumStatus
import uz.scorm.lms.app.v1.curriculum.repository.CurriculumStudentAssignmentRepository
import uz.scorm.lms.app.v1.curriculum.repository.ProgramCurriculumVersionRepository
import uz.scorm.lms.app.v1.student.repository.StudentRepository
import uz.scorm.lms.app.v1.syllabus.dto.SubjectSyllabusDto
import uz.scorm.lms.app.v1.syllabus.service.SubjectSyllabusService

/**
 * Talabaning o'quv rejasi: fanlar semestrlar bo'yicha (kredit, soatlar) va har fanning tasdiqlangan o'quv dasturi
 * (modul -> dars). [reason] — reja topilmasa sababi (talabaga ko'rsatiladi).
 */
data class StudentCurriculumDto(
    val curriculum: CurriculumVersionDto?,
    val currentSemester: Int?,
    val syllabi: List<SubjectSyllabusDto>,
    val reason: String? = null,
)

@Service
class StudentCurriculumService(
    private val students: StudentRepository,
    private val assignments: CurriculumStudentAssignmentRepository,
    private val versions: ProgramCurriculumVersionRepository,
    private val curricula: ProgramCurriculumService,
    private val syllabusService: SubjectSyllabusService,
) {
    /**
     * Reja tanlovi: avval talabaga biriktirilgani, bo'lmasa mutaxassisligi va o'quv yili bo'yicha tasdiqlangani,
     * u ham bo'lmasa mutaxassislikning eng so'nggi tasdiqlangan rejasi. Faqat tasdiqlangan dasturlar ko'rsatiladi.
     */
    @Transactional(readOnly = true)
    fun mine(userId: Long): StudentCurriculumDto {
        val student = students.findByUserId(userId)
            ?: return StudentCurriculumDto(null, null, emptyList(), "Talaba kartasi topilmadi")
        val version = assignments.findFirstByStudentIdAndActiveTrueAndDeletedFalseOrderBySemesterNumberDesc(requireNotNull(student.id))
            ?.curriculumVersion?.takeIf { !it.deleted }
            ?: student.programId?.let { programId ->
                student.academicYear?.let { versions.findFirstByProgramIdAndAcademicYearAndStatusAndDeletedFalse(programId, it, CurriculumStatus.APPROVED) }
                    ?: versions.findFirstByProgramIdAndStatusAndDeletedFalseOrderByAcademicYearDesc(programId, CurriculumStatus.APPROVED)
            }
            ?: return StudentCurriculumDto(null, student.semesterNumber, emptyList(),
                if (student.programId == null) "Siz hali mutaxassislikka biriktirilmagansiz"
                else "Mutaxassisligingiz bo'yicha tasdiqlangan o'quv reja hali yo'q")
        val curriculum = curricula.get(requireNotNull(version.id))
        val syllabusIds = curriculum.subjects.mapNotNull { it.syllabusId }.toSet()
        val syllabi = syllabusService.findAll(syllabusIds).filter { it.status == "APPROVED" }
        return StudentCurriculumDto(curriculum, student.semesterNumber, syllabi)
    }
}
