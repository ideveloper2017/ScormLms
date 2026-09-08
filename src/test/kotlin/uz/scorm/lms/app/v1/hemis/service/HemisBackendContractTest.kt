package uz.scorm.lms.app.v1.hemis.service

import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test
import org.springframework.http.HttpStatus
import org.springframework.web.reactive.function.client.ClientRequest
import org.springframework.web.reactive.function.client.ClientResponse
import org.springframework.web.reactive.function.client.WebClient
import reactor.core.publisher.Mono
import tools.jackson.module.kotlin.jacksonObjectMapper

class HemisBackendContractTest {
    private val mapper = jacksonObjectMapper()
    private val student = """{
      "id":1,"first_name":"Test","second_name":"Student","third_name":"Example",
      "full_name":"Student Test Example","short_name":"Student T.",
      "university":{"code":"1","name":"Test University"},"student_id_number":"TEST-001",
      "birth_date":946684800,"gender":{"code":"11","name":"Erkak"},
      "department":{"id":1,"name":"Test Faculty","code":"1","parent":0,"active":true,
        "structureType":{"code":"1","name":"Faculty"},"localityType":{"code":"1","name":"Local"}},
      "group":{"id":1,"name":"Test Group","educationLang":{"code":"uz","name":"Uzbek"}},
      "educationYear":{"code":"2026","name":"2026-2027"},
      "semester":{"id":1,"code":"1","name":"1-semestr"},
      "specialty":{"id":1,"code":"1","name":"Physics"},"level":{"code":"11","name":"1-kurs"},
      "educationForm":{"code":"11","name":"Kunduzgi"},"educationType":{"code":"11","name":"Bakalavr"},
      "paymentForm":{"code":"11","name":"Grant"},"studentStatus":{"code":"11","name":"O'qimoqda"},
      "country":{"code":"UZ","name":"Uzbekistan"},"district":{"code":"1","name":"Test"},
      "province":{"code":"1","name":"Test"},"socialCategory":{"code":"1","name":"Test"},
      "accommodation":{"code":"1","name":"Test"},"hash":"test","meta_id":1
    }"""

    private fun service(handler: (ClientRequest) -> String) = HemisService(WebClient.builder()
        .exchangeFunction { request -> Mono.just(ClientResponse.create(HttpStatus.OK)
            .header("Content-Type", "application/json").body(handler(request)).build()) }.build(),
        "https://hemis.example", "/rest/v1", "test-token")

    @Test
    fun `documented singleton arrays and backend student fields decode without inventing PINFL`() {
        val root = mapper.readTree("""{"success":true,"data":[{"items":[$student],
            "pagination":[{"totalCount":1,"pageSize":200,"pageCount":1,"page":1}]}]}""")
        val page = HemisBackendResponseParser.page(root, 200)
        val result = HemisBackendResponseParser.student(page.items.single())
        assertEquals(1L, page.total)
        assertEquals("Test Faculty", result.faculty.name)
        assertEquals("uz", result.educationLang.code)
        assertEquals("2026-2027", result.semester.education_year.name)
        assertEquals("Test University", result.university)
        assertNull(result.pinfl)
        val client = service { error("No HTTP expected") }
        assertThrows(IllegalArgumentException::class.java) { with(client) { result.toCreateRequest() } }
    }

    @Test
    fun `all group pages are loaded with maximum 200 and page rather than offset`() {
        val queries = mutableListOf<String>()
        val client = service { request ->
            queries.add(request.url().query)
            val ids = if (queries.size == 1) 1..200 else 201..201
            val items = ids.joinToString(",") { """{"id":$it,"name":"Group $it"}""" }
            """{"success":true,"data":{"items":[$items],"pagination":{"totalCount":201,"pageSize":200}}}"""
        }
        assertEquals(201, client.fetchGroupList().size)
        assertEquals(listOf("limit=200&page=1", "limit=200&page=2"), queries)
    }

    @Test
    fun `student checkpoint offset is translated to documented page and includes inactive statuses`() {
        val client = service { request ->
            assertEquals("limit=200&page=2&_group=7&_student_status=-1", request.url().query)
            """{"success":true,"data":{"items":[$student],"pagination":{"totalCount":201,"pageSize":200}}}"""
        }
        val result = client.fetchStudentsByGroup(7, 500, 200)
        assertEquals(201L, result.total)
        assertEquals(200, result.limit)
        assertEquals(200, result.offset)
        assertEquals("TEST-001", result.items.single().student_id_number)
    }

    @Test
    fun `repeated group page fails instead of looping forever`() {
        val client = service { """{"success":true,"data":{"items":[{"id":1,"name":"Group"}],
            "pagination":{"totalCount":2,"pageSize":200}}}""" }
        assertThrows(IllegalStateException::class.java) { client.fetchGroupList() }
    }
}
