package uz.scorm.lms.app.v1.curriculum

import io.mockk.every
import io.mockk.mockk
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Test
import uz.scorm.lms.app.v1.curriculum.dto.CurriculumSubjectDto
import uz.scorm.lms.app.v1.curriculum.dto.CurriculumVersionDto
import uz.scorm.lms.app.v1.curriculum.model.CurriculumStatus
import uz.scorm.lms.app.v1.curriculum.model.ProgramCurriculumVersion
import uz.scorm.lms.app.v1.curriculum.repository.CurriculumStudentAssignmentRepository
import uz.scorm.lms.app.v1.curriculum.repository.ProgramCurriculumVersionRepository
import uz.scorm.lms.app.v1.curriculum.service.ProgramCurriculumService
import uz.scorm.lms.app.v1.curriculum.service.StudentCurriculumService
import uz.scorm.lms.app.v1.student.model.StudentProfile
import uz.scorm.lms.app.v1.student.repository.StudentRepository
import uz.scorm.lms.app.v1.syllabus.dto.SubjectSyllabusDto
import uz.scorm.lms.app.v1.syllabus.service.SubjectSyllabusService

class StudentCurriculumServiceTest {
    private val students = mockk<StudentRepository>()
    private val assignments = mockk<CurriculumStudentAssignmentRepository>()
    private val versions = mockk<ProgramCurriculumVersionRepository>()
    private val curricula = mockk<ProgramCurriculumService>()
    private val syllabi = mockk<SubjectSyllabusService>()
    private val service = StudentCurriculumService(students, assignments, versions, curricula, syllabi)
    private val student = mockk<StudentProfile> {
        every { id } returns 7
        every { programId } returns 1
        every { academicYear } returns "2026-2027"
        every { semesterNumber } returns 2
    }

    init {
        every { students.findByUserId(70) } returns student
        every { assignments.findFirstByStudentIdAndActiveTrueAndDeletedFalseOrderBySemesterNumberDesc(7) } returns null
    }

    @Test
    fun `biriktirish bolmasa mutaxassislik va oquv yili boyicha tasdiqlangan reja, faqat tasdiqlangan dasturlar`() {
        val version = mockk<ProgramCurriculumVersion> { every { id } returns 2 }
        every { versions.findFirstByProgramIdAndAcademicYearAndStatusAndDeletedFalse(1, "2026-2027", CurriculumStatus.APPROVED) } returns version
        val dto = mockk<CurriculumVersionDto> {
            every { subjects } returns listOf(subject(40), subject(41), subject(null))
        }
        every { curricula.get(2) } returns dto
        every { syllabi.findAll(setOf(40L, 41L)) } returns listOf(syllabus(40, "APPROVED"), syllabus(41, "DRAFT"))

        val result = service.mine(70)

        assertEquals(dto, result.curriculum)
        assertEquals(2, result.currentSemester)
        assertEquals(listOf(40L), result.syllabi.map { it.id })
        assertNull(result.reason)
    }

    @Test
    fun `tasdiqlangan reja bolmasa sababi aytiladi`() {
        every { versions.findFirstByProgramIdAndAcademicYearAndStatusAndDeletedFalse(any(), any(), any()) } returns null
        every { versions.findFirstByProgramIdAndStatusAndDeletedFalseOrderByAcademicYearDesc(1, CurriculumStatus.APPROVED) } returns null

        val result = service.mine(70)

        assertNull(result.curriculum)
        assertEquals("Mutaxassisligingiz bo'yicha tasdiqlangan o'quv reja hali yo'q", result.reason)
    }

    private fun subject(syllabusId: Long?) = mockk<CurriculumSubjectDto> { every { this@mockk.syllabusId } returns syllabusId }
    private fun syllabus(id: Long, status: String) = mockk<SubjectSyllabusDto> {
        every { this@mockk.id } returns id
        every { this@mockk.status } returns status
    }
}
