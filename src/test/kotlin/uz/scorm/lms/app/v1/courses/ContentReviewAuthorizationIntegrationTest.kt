package uz.scorm.lms.app.v1.courses

import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.security.test.context.support.WithMockUser
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.get

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ContentReviewAuthorizationIntegrationTest {
    @Autowired private lateinit var mockMvc: MockMvc

    @Test
    @WithMockUser(authorities = ["COURSE_WRITE"])
    fun `oqituvchi ekspertiza navbatini ocholmaydi`() {
        mockMvc.get("/api/v1/content-reviews/pending").andExpect { status { isForbidden() } }
    }

    @Test
    @WithMockUser(authorities = ["ACADEMIC_WRITE"])
    fun `akademik vakolat ekspertiza navbatini oqiydi`() {
        mockMvc.get("/api/v1/content-reviews/pending").andExpect { status { isOk() } }
    }
}
