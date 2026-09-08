package uz.scorm.lms.app.v1.hemis.service

import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test
import org.springframework.http.HttpStatus
import org.springframework.web.reactive.function.client.ClientRequest
import org.springframework.web.reactive.function.client.ClientResponse
import org.springframework.web.reactive.function.client.WebClient
import reactor.core.publisher.Mono
import java.util.concurrent.TimeoutException

class HemisConnectionTest {
    private val requests = mutableListOf<ClientRequest>()
    private val token = "test-secret-token"

    private fun client(handler: (ClientRequest) -> Mono<ClientResponse>) = WebClient.builder()
        .exchangeFunction { request -> requests.add(request); handler(request) }.build()
    private fun response(body: String, status: HttpStatus = HttpStatus.OK) = Mono.just(
        ClientResponse.create(status).header("Content-Type", "application/json").body(body).build())
    private fun service(handler: (ClientRequest) -> Mono<ClientResponse>) =
        HemisService(client(handler), "https://hemis.example/", "/rest/v1", token)

    @Test
    fun `missing configuration does not make remote requests or reveal partial credentials`() {
        val service = HemisService(client { error("No requests expected") }, "", "/rest/v1", "")
        val result = service.checkConnection()
        assertEquals("NOT_CONFIGURED", result.status)
        assertEquals(listOf("HEMIS_HOST", "HEMIS_API_TOKEN"), result.missingFields)
        assertFalse(result.toString().contains(token))
        assertTrue(requests.isEmpty())
    }

    @Test
    fun `invalid URL with embedded secrets is rejected without echoing it`() {
        val service = HemisService(client { error("No requests expected") }, "https://user:secret@hemis.example/?token=hidden", "/rest/v1", token)
        val result = service.checkConnection()
        assertEquals("NOT_CONFIGURED", result.status)
        assertNull(result.host)
        assertFalse(result.toString().contains("hidden"))
        assertFalse(service.credentialsConfigured())
    }

    @Test
    fun `checking connection uses configured bearer and reads only a single group without a login request`() {
        val service = service { response("""{"success":true,"code":200,"error":null,"data":{"items":[],"total":12}}""") }
        assertEquals("NOT_CHECKED", service.connectionStatus().status)
        assertTrue(requests.isEmpty())
        val result = service.checkConnection()
        assertEquals("CONNECTED", result.status)
        assertEquals(12L, result.groupsTotal)
        assertNotNull(result.checkedAt)
        assertEquals(listOf("/rest/v1/data/group-list"), requests.map { it.url().path })
        assertEquals("limit=1&page=1", requests.last().url().query)
        assertEquals("Bearer $token", requests.last().headers().getFirst("Authorization"))
        assertFalse(result.toString().contains(token))
    }

    @Test
    fun `authentication and permission failures are distinct and redact remote response bodies`() {
        val auth = service { response("secret-password $token", HttpStatus.UNAUTHORIZED) }.checkConnection()
        assertEquals("AUTH_FAILED", auth.status)
        assertFalse(auth.toString().contains(token))
        val denied = service { response("secret-password", HttpStatus.FORBIDDEN) }.checkConnection()
        assertEquals("ACCESS_DENIED", denied.status)
        assertFalse(denied.toString().contains("secret-password"))
    }

    @Test
    fun `missing API and timeout produce actionable states`() {
        assertEquals("API_NOT_FOUND", service { response("{}", HttpStatus.NOT_FOUND) }.checkConnection().status)
        assertEquals("TIMEOUT", service { Mono.error(TimeoutException("secret-token")) }.checkConnection().status)
    }

    @Test
    fun `HTML login page and business error are never reported as successful empty lists`() {
        assertEquals("INVALID_RESPONSE", service { response("<html>Login</html>") }.checkConnection().status)
        val service = service { response("""{"success":false,"code":403,"error":"denied","data":null}""") }
        assertEquals("INVALID_RESPONSE", service.checkConnection().status)
        assertThrows(IllegalStateException::class.java) { service.fetchGroupList() }
        assertThrows(IllegalStateException::class.java) { service.fetchStudentsByGroup(1) }
        assertThrows(IllegalStateException::class.java) { service.fetchStudentsByIdentity("123") }
    }

    @Test
    fun `all directory requests use the configured token without authentication POST`() {
        val service = HemisService(client { response("""{"success":true,"code":200,"error":null,"data":{"items":[],"total":0,"limit":200,"offset":0}}""") },
            "https://hemis.example", "/rest/v1", " Bearer $token ")
        service.fetchGroupList()
        service.fetchStudentsByGroup(1)
        service.fetchStudentsByIdentity("123")
        assertEquals(3, requests.size)
        assertTrue(requests.all { it.method().name() == "GET" })
        assertTrue(requests.all { it.headers().getFirst("Authorization") == "Bearer $token" })
        assertFalse(service.connectionStatus().toString().contains(token))
    }

    @Test
    fun `invalid token whitespace never reaches remote server`() {
        val service = HemisService(client { error("No requests expected") }, "https://hemis.example", "/rest/v1", "token with spaces")
        assertEquals(listOf("HEMIS_API_TOKEN"), service.checkConnection().missingFields)
        assertTrue(requests.isEmpty())
    }

    @Test
    fun `slow requests have a bounded wait`() {
        val service = HemisService(client { Mono.never() }, "https://hemis.example", "/rest/v1", token, 1)
        assertEquals("TIMEOUT", service.checkConnection().status)
    }
}
