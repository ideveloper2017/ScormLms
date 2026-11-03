package uz.scorm.lms.app.v1.program

import io.mockk.every
import io.mockk.mockk
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Test
import uz.scorm.lms.app.v1.department.model.Department
import uz.scorm.lms.app.v1.department.service.DepartmentService
import uz.scorm.lms.app.v1.faculty.model.Faculty
import uz.scorm.lms.app.v1.faculty.service.FacultyService
import uz.scorm.lms.app.v1.program.dto.ProgramCreateRequest
import uz.scorm.lms.app.v1.program.dto.ProgramUpdateRequest
import uz.scorm.lms.app.v1.program.mapper.ProgramMapper
import uz.scorm.lms.app.v1.program.model.Program
import uz.scorm.lms.app.v1.program.repository.ProgramRepository
import uz.scorm.lms.app.v1.program.service.ProgramService
import java.util.Optional

class ProgramFacultyTest {
    private val repository = mockk<ProgramRepository>()
    private val departments = mockk<DepartmentService>()
    private val faculties = mockk<FacultyService>()
    private val service = ProgramService(repository, ProgramMapper(), departments, faculties, mockk(relaxed = true))
    private val informatika = Faculty(name = "Informatika").apply { id = 1 }
    private val energetika = Faculty(name = "Energetika").apply { id = 2 }

    init {
        every { repository.existsByCode(any()) } returns false
        every { repository.save(any()) } answers { firstArg<Program>().also { if (it.id == null) it.id = 50 } }
        every { faculties.getEntity(1) } returns informatika
        every { faculties.getEntity(2) } returns energetika
    }

    @Test
    fun `mutaxassislik fakultetga togridan-togri boglanadi`() {
        val dto = service.create(ProgramCreateRequest(name = "Kompyuter injiniringi", code = "60610300", facultyId = 2))

        assertEquals(2L, dto.facultyId)
        assertEquals("Energetika", dto.facultyName)
        assertNull(dto.departmentId)
    }

    @Test
    fun `eski yozuvda fakultet kafedradan olinadi, boshqa fakultet tanlansa kafedra ajratiladi`() {
        val department = Department(name = "Dasturiy injiniring").apply { id = 7; faculty = informatika }
        val program = Program(name = "Dasturiy injiniring", department = department).apply { id = 9 }
        every { repository.findById(9) } returns Optional.of(program)
        assertEquals(1L, ProgramMapper().toDto(program).facultyId)

        val dto = service.update(9, ProgramUpdateRequest(departmentId = null, facultyId = 2))

        assertEquals(2L, dto.facultyId)
        assertNull(dto.departmentId)
    }
}
