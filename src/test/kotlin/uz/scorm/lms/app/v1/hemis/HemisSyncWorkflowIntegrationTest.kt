package uz.scorm.lms.app.v1.hemis

import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.context.TestConfiguration
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Import
import org.springframework.context.annotation.Primary
import org.springframework.security.test.context.support.WithMockUser
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.post
import uz.scorm.lms.app.v1.department.model.Department
import uz.scorm.lms.app.v1.department.repository.DepartmentRepository
import uz.scorm.lms.app.v1.faculty.model.Faculty
import uz.scorm.lms.app.v1.faculty.repository.FacultyRepository
import uz.scorm.lms.app.v1.group.model.Group as LocalGroup
import uz.scorm.lms.app.v1.group.repository.GroupRepository
import uz.scorm.lms.app.v1.hemis.dto.HemisGroupItem
import uz.scorm.lms.app.v1.hemis.dto.HemisStudentListData
import uz.scorm.lms.app.v1.hemis.model.*
import uz.scorm.lms.app.v1.hemis.service.HemisDirectoryClient
import uz.scorm.lms.app.v1.hemis.sync.dto.HemisGroupMappingRequest
import uz.scorm.lms.app.v1.hemis.sync.model.HemisSyncRunStatus
import uz.scorm.lms.app.v1.hemis.sync.repository.HemisSyncRunRepository
import uz.scorm.lms.app.v1.hemis.sync.service.HemisSyncService
import uz.scorm.lms.app.v1.program.model.Program
import uz.scorm.lms.app.v1.program.repository.ProgramRepository
import uz.scorm.lms.app.v1.student.repository.StudentRepository
import uz.scorm.lms.app.v1.user.model.User
import uz.scorm.lms.app.v1.user.repository.UserRepository

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(HemisSyncWorkflowIntegrationTest.Config::class)
class HemisSyncWorkflowIntegrationTest {
    @Autowired private lateinit var service: HemisSyncService
    @Autowired private lateinit var runs: HemisSyncRunRepository
    @Autowired private lateinit var students: StudentRepository
    @Autowired private lateinit var users: UserRepository
    @Autowired private lateinit var faculties: FacultyRepository
    @Autowired private lateinit var departments: DepartmentRepository
    @Autowired private lateinit var programs: ProgramRepository
    @Autowired private lateinit var groups: GroupRepository
    @Autowired private lateinit var mockMvc: MockMvc

    @Test
    fun `unmapped source becomes masked conflict then mapped retry creates and stays idempotent`() {
        val actor = user("hemis-sync-actor")
        val first = service.startManual(requireNotNull(actor.id))
        val firstRun = runs.findById(first.id).orElseThrow()
        assertEquals(HemisSyncRunStatus.PARTIAL, firstRun.status)
        assertEquals(1, firstRun.conflictCount)
        assertTrue(service.conflicts(true).single { it.runId == first.id }.studentNumberMasked.contains("***"))

        val faculty = faculties.save(Faculty(name = "HEMIS test fakulteti", code = "HTF-${System.nanoTime()}"))
        val department = departments.save(Department(name = "HEMIS test kafedrasi", code = "HTD-${System.nanoTime()}", faculty = faculty))
        val program = programs.save(Program(name = "HEMIS test yo'nalishi", code = "HTP-${System.nanoTime()}", degreeLevel = "BACHELOR", department = department))
        val group = groups.save(LocalGroup(name = "HEMIS-101", program = program))
        service.updateMapping(501, HemisGroupMappingRequest(requireNotNull(group.id)), requireNotNull(actor.id))

        val second = service.startManual(requireNotNull(actor.id))
        assertEquals(HemisSyncRunStatus.COMPLETED, runs.findById(second.id).orElseThrow().status)
        val student = students.findByHemisId(9001) ?: fail("HEMIS talaba yaratilishi kerak")
        assertEquals("39010112345678", student.pinfl)
        assertEquals(group.id, student.groupId)
        assertNotNull(student.hemisSourceHash)

        val third = service.startManual(requireNotNull(actor.id))
        val thirdRun = runs.findById(third.id).orElseThrow()
        assertEquals(1, thirdRun.unchangedCount)
        assertEquals(0, thirdRun.createdCount)
    }

    @Test
    @WithMockUser(username = "hemis-reader", authorities = ["INTEGRATION_READ"])
    fun `reader sees overview but cannot start sync`() {
        user("hemis-reader")
        mockMvc.get("/api/v1/hemis/sync/overview").andExpect {
            status { isOk() }
            jsonPath("$.data.canManage") { value(false) }
        }
        mockMvc.post("/api/v1/hemis/sync/runs").andExpect { status { isForbidden() } }
    }

    private fun user(username: String): User = users.findByUsername(username)
        ?: users.save(User(username = username, password = "test-password-hash", fullName = username))

    @TestConfiguration
    class Config {
        @Bean
        @Primary
        fun fakeHemisDirectory(): HemisDirectoryClient = object : HemisDirectoryClient {
            override fun credentialsConfigured() = true
            override fun fetchGroupList() = listOf(HemisGroupItem(501, "HEMIS-101", 1))
            override fun fetchStudentsByGroup(groupId: Long, limit: Int, offset: Int): HemisStudentListData {
                val items = if (offset == 0) listOf(source()) else emptyList()
                return HemisStudentListData(items, 1, limit, offset)
            }

            private fun source() = HemisStudent(
                id = 9001, first_name = "Ali", second_name = "Valiyev", third_name = "Testovich",
                full_name = "Valiyev Ali Testovich", short_name = "Valiyev A.", university = "Test universiteti",
                student_id_number = "HEMIS-9001", pinfl = "39010112345678", gender = CodeName("11", "Erkak"),
                image = null, birth_date = 631152000L, email = null,
                group = Group(501, "HEMIS-101", CodeName("uz", "O'zbek")),
                faculty = uz.scorm.lms.app.v1.hemis.model.Faculty(1, "Test", "T", 0, true, CodeName("1", "Faculty"), CodeName("1", "Local")),
                educationLang = CodeName("uz", "O'zbek"),
                semester = Semester(1, "1", "1-semestr", true, EducationYear("2026", "2026-2027", true)),
                specialty = CodeName("606", "Test"), level = CodeName("11", "Bakalavr"),
                educationForm = CodeName("11", "Kunduzgi"), educationType = CodeName("11", "Oliy"),
                paymentForm = CodeName("12", "Kontrakt"), studentStatus = CodeName("11", "Faol"),
                country = CodeName("UZ", "O'zbekiston"), district = CodeName("1", "Test"), province = CodeName("1", "Test"),
                address = null, socialCategory = CodeName("0", "Yo'q"), accommodation = CodeName("0", "Yo'q"),
                validateUrl = null, hash = "remote-hash",
            )
        }
    }
}
