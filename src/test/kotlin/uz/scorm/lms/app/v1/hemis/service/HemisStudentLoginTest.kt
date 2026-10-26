package uz.scorm.lms.app.v1.hemis.service

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import org.springframework.http.HttpMethod
import org.springframework.http.HttpStatus
import org.springframework.web.reactive.function.client.ClientRequest
import org.springframework.web.reactive.function.client.ClientResponse
import org.springframework.web.reactive.function.client.WebClient
import reactor.core.publisher.Mono

class HemisStudentLoginTest {
    private fun service(handler: (ClientRequest) -> Pair<HttpStatus, String>) = HemisService(WebClient.builder()
        .exchangeFunction { request ->
            val (status, body) = handler(request)
            Mono.just(ClientResponse.create(status).header("Content-Type", "application/json").body(body).build())
        }.build(),
        "https://student.hemis.example", "/rest/v1", "")

    @Test
    fun `talaba logini HEMIS tokenini qaytaradi va account me identifikatorini oqiydi`() {
        val calls = mutableListOf<String>()
        val client = service { request ->
            calls.add("${request.method()} ${request.url().path}")
            when (request.url().path) {
                "/rest/v1/auth/login" -> HttpStatus.OK to """{"success":true,"error":null,"data":{"token":"hemis-token"},"code":200}"""
                else -> {
                    assertEquals("Bearer hemis-token", request.headers().getFirst("Authorization"))
                    HttpStatus.OK to """{"success":true,"data":{"id":321,"student_id_number":"390211100123","full_name":"Test"}}"""
                }
            }
        }

        val token = client.studentLogin("390211100123", "secret")
        val identity = client.fetchStudentIdentity(token!!)

        assertEquals("hemis-token", token)
        assertEquals(HemisStudentIdentity(321L, "390211100123"), identity)
        assertEquals(listOf("${HttpMethod.POST} /rest/v1/auth/login", "${HttpMethod.GET} /rest/v1/account/me"), calls)
        assertTrue(client.studentLoginConfigured())
    }

    @Test
    fun `notogri parol null qaytaradi`() {
        assertNull(service { HttpStatus.UNAUTHORIZED to """{"success":false,"error":"Invalid"}""" }.studentLogin("x", "y"))
        assertNull(service { HttpStatus.OK to """{"success":false,"error":"Login yoki parol xato","data":null}""" }.studentLogin("x", "y"))
    }
}
