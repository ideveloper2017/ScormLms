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
    private val login = """{"success":true,"code":200,"error":null,"data":{"token":"$token"}}"""

    private fun client(handler: (ClientRequest) -> Mono<ClientResponse>) = WebClient.builder()
        .exchangeFunction { request -> requests.add(request); handler(request) }.build()
    private fun response(body: String, status: HttpStatus = HttpStatus.OK) = Mono.just(
        ClientResponse.create(status).header("Content-Type", "application/json").body(body).build())
    private fun service(handler: (ClientRequest) -> Mono<ClientResponse>) =
        HemisService(client(handler), "https://hemis.example/", "/rest/v1", "service-login", "secret-password")

    @Test
    fun `missing configuration does not make remote requests or reveal partial credentials`() {
        val service = HemisService(client { error("No requests expected") }, "", "/rest/v1", "private-login", "")
        val result = service.checkConnection()
        assertEquals("NOT_CONFIGURED", result.status)
        assertEquals(listOf("HEMIS_HOST", "HEMIS_ADMIN_PASSWORD"), result.missingFields)
        assertFalse(result.toString().contains("private-login"))
        assertTrue(requests.isEmpty())
    }

    @Test
    fun `invalid URL with embedded secrets is rejected without echoing it`() {
        val service = HemisService(client { error("No requests expected") }, "https://user:secret@hemis.example/?token=hidden", "/rest/v1", "login", "password")
        val result = service.checkConnection()
        assertEquals("NOT_CONFIGURED", result.status)
        assertNull(result.host)
        assertFalse(result.toString().contains("hidden"))
        assertFalse(service.credentialsConfigured())
    }

    @Test
    fun `checking connection authenticates and reads only a single group without student requests`() {
        val service = service { request -> if (request.url().path.endsWith("/auth/login")) response(login)
            else response("""{"success":true,"code":200,"error":null,"data":{"items":[],"total":12}}""") }
        assertEquals("NOT_CHECKED", service.connectionStatus().status)
        assertTrue(requests.isEmpty())
        val result = service.checkConnection()
        assertEquals("CONNECTED", result.status)
        assertEquals(12L, result.groupsTotal)
        assertNotNull(result.checkedAt)
        assertEquals(listOf("/rest/v1/auth/login", "/rest/v1/data/group-list"), requests.map { it.url().path })
        assertEquals("limit=1&offset=0", requests.last().url().query)
        assertEquals("Bearer $token", requests.last().headers().getFirst("Authorization"))
        assertFalse(result.toString().contains(token))
    }

    @Test
    fun `authentication and permission failures are distinct and redact remote response bodies`() {
        val auth = service { response("secret-password $token", HttpStatus.UNAUTHORIZED) }.checkConnection()
        assertEquals("AUTH_FAILED", auth.status)
        assertFalse(auth.toString().contains(token))
        val denied = service { request -> if (request.url().path.endsWith("/auth/login")) response(login)
            else response("secret-password", HttpStatus.FORBIDDEN) }.checkConnection()
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
        val service = service { request -> if (request.url().path.endsWith("/auth/login")) response(login)
            else response("""{"success":false,"code":403,"error":"denied","data":null}""") }
        assertEquals("INVALID_RESPONSE", service.checkConnection().status)
        assertThrows(IllegalStateException::class.java) { service.fetchGroupList() }
        assertThrows(IllegalStateException::class.java) { service.fetchStudentsByGroup(1) }
        assertThrows(IllegalStateException::class.java) { service.fetchStudentsByIdentity("123") }
    }

    @Test
    fun `login success false cannot pass an embedded token to group API`() {
        val result = service { response("""{"success":false,"code":401,"error":null,"data":{"token":"$token"}}""") }.checkConnection()
        assertEquals("INVALID_RESPONSE", result.status)
        assertEquals(1, requests.size)
    }

    @Test
    fun `slow requests have a bounded wait`() {
        val service = HemisService(client { Mono.never() }, "https://hemis.example", "/rest/v1", "login", "password", 1)
        assertEquals("TIMEOUT", service.checkConnection().status)
    }
}
