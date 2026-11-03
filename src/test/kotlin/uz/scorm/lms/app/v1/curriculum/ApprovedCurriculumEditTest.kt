package uz.scorm.lms.app.v1.curriculum

import io.mockk.every
import io.mockk.mockk
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import uz.scorm.lms.app.v1.curriculum.dto.SaveCurriculumVersionRequest
import uz.scorm.lms.app.v1.curriculum.model.CurriculumStatus
import uz.scorm.lms.app.v1.curriculum.model.ProgramCurriculumVersion
import uz.scorm.lms.app.v1.curriculum.repository.ProgramCurriculumVersionRepository
import uz.scorm.lms.app.v1.curriculum.service.ProgramCurriculumService
import uz.scorm.lms.app.v1.program.model.Program

class ApprovedCurriculumEditTest {
    private val versions = mockk<ProgramCurriculumVersionRepository>()
    private val service = ProgramCurriculumService(versions, mockk(), mockk(), mockk(), mockk(), mockk(), mockk(), mockk(),
        mockk(), mockk(relaxed = true), mockk(), mockk(), mockk())
    private val program = Program(name = "Dasturiy injiniring").apply { id = 1 }

    private fun version(status: CurriculumStatus) = mockk<ProgramCurriculumVersion>(relaxed = true) {
        every { this@mockk.status } returns status
        every { this@mockk.program } returns this@ApprovedCurriculumEditTest.program
        every { academicYear } returns "2026-2027"
    }

    @Test
    fun `tasdiqlangan rejada mutaxassislik va oquv yili ozgarmaydi`() {
        every { versions.findByIdAndDeletedFalse(2) } returns version(CurriculumStatus.APPROVED)
        val request = mockk<SaveCurriculumVersionRequest> {
            every { programId } returns 1
            every { academicYear } returns "2027-2028"
        }

        val error = assertThrows<IllegalArgumentException> { service.update(2, request, actorId = 5) }

        assertEquals("Tasdiqlangan o'quv rejaning mutaxassisligi va o'quv yili o'zgartirilmaydi", error.message)
    }

    @Test
    fun `arxivlangan reja tahrirlanmaydi`() {
        every { versions.findByIdAndDeletedFalse(3) } returns version(CurriculumStatus.ARCHIVED)

        val error = assertThrows<IllegalArgumentException> { service.removeSubject(3, 10, actorId = 5) }

        assertEquals("Arxivlangan o'quv reja tahrirlanmaydi", error.message)
    }
}
