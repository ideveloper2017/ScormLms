package uz.scorm.lms.app

import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.beans.factory.annotation.Qualifier
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.http.HttpMethod
import org.springframework.security.test.context.support.WithMockUser
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.get
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.user.model.User
import uz.scorm.lms.app.v1.user.repository.UserRepository

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class BackendApiRouteContractTest {
    @Autowired
    @Qualifier("requestMappingHandlerMapping")
    private lateinit var mappings: RequestMappingHandlerMapping
    @Autowired
    private lateinit var mockMvc: MockMvc
    @Autowired
    private lateinit var userRepository: UserRepository

    @Test
    fun `frontend ishlatadigan dashboard va profil routelari mavjud`() {
        val expected = setOf(
            HttpMethod.GET to "/api/v1/admin/stats",
            HttpMethod.GET to "/api/v1/admin/activities/recent",
            HttpMethod.GET to "/api/v1/admin/stats/monthly",
            HttpMethod.GET to "/api/v1/admin/instructors/top",
            HttpMethod.GET to "/api/v1/instructors/me/stats",
            HttpMethod.GET to "/api/v1/instructors/me/courses",
            HttpMethod.GET to "/api/v1/instructors/me/submissions/recent",
            HttpMethod.GET to "/api/v1/instructors/me/schedule/today",
            HttpMethod.GET to "/api/v1/instructors/me/activity/weekly",
            HttpMethod.GET to "/api/v1/teachers/me",
            HttpMethod.GET to "/api/v1/teachers/me/stats",
            HttpMethod.GET to "/api/v1/teachers/me/students",
            HttpMethod.GET to "/api/v1/teachers/me/courses/{courseId}/gradebook",
            HttpMethod.GET to "/api/v1/teachers/me/schedule/today",
            HttpMethod.GET to "/api/v1/monitoring/stats",
            HttpMethod.GET to "/api/v1/monitoring/alerts",
            HttpMethod.GET to "/api/v1/students/me",
            HttpMethod.PUT to "/api/v1/students/me",
        )

        val actual = mappings.handlerMethods.keys.flatMap { mapping ->
            mapping.patternValues.flatMap { path ->
                mapping.methodsCondition.methods.map { method -> HttpMethod.valueOf(method.name) to path }
            }
        }.toSet()

        val missing = expected - actual
        assertTrue(missing.isEmpty(), "Backend route contractida yetishmayotgan routelar: $missing")
    }

    @Test
    @WithMockUser(authorities = ["STAT_READ"])
    fun `admin va monitoring endpointlari frontend kutgan JSON contractni qaytaradi`() {
        mockMvc.get("/api/v1/admin/stats")
            .andExpect {
                status { isOk() }
                jsonPath("$.totalUsers") { isNumber() }
                jsonPath("$.activeCourses") { isNumber() }
                jsonPath("$.systemUptime") { isNumber() }
            }

        mockMvc.get("/api/v1/admin/activities/recent").andExpect { status { isOk() } }
        mockMvc.get("/api/v1/admin/stats/monthly").andExpect {
            status { isOk() }
            jsonPath("$.length()") { value(6) }
        }
        mockMvc.get("/api/v1/admin/instructors/top").andExpect { status { isOk() } }
        mockMvc.get("/api/v1/monitoring/stats")
            .andExpect {
                status { isOk() }
                jsonPath("$.cpuUsage") { isNumber() }
                jsonPath("$.errorRate") { isNumber() }
            }
        mockMvc.get("/api/v1/monitoring/alerts").andExpect { status { isOk() } }
    }

    @Test
    @WithMockUser(username = "route-contract-teacher", authorities = ["COURSE_READ"])
    fun `oqituvchi dashboard endpointlari autentifikatsiyalangan user bilan ishlaydi`() {
        userRepository.save(User(username = "route-contract-teacher", password = "test-password-hash"))

        mockMvc.get("/api/v1/instructors/me/stats").andExpect {
            status { isOk() }
            jsonPath("$.totalStudents") { value(0) }
        }
        mockMvc.get("/api/v1/instructors/me/courses").andExpect { status { isOk() } }
        mockMvc.get("/api/v1/instructors/me/submissions/recent").andExpect { status { isOk() } }
        mockMvc.get("/api/v1/instructors/me/schedule/today").andExpect { status { isOk() } }
        mockMvc.get("/api/v1/instructors/me/activity/weekly").andExpect {
            status { isOk() }
            jsonPath("$.length()") { value(7) }
        }

        mockMvc.get("/api/v1/teachers/me").andExpect {
            status { isOk() }
            jsonPath("$.username") { value("route-contract-teacher") }
        }
        mockMvc.get("/api/v1/teachers/me/stats").andExpect {
            status { isOk() }
            jsonPath("$.pendingSubmissions") { value(0) }
        }
        mockMvc.get("/api/v1/teachers/me/students").andExpect { status { isOk() } }
        mockMvc.get("/api/v1/teachers/me/schedule/today").andExpect { status { isOk() } }
    }
}
