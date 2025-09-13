package uz.scorm.lms.app.v1.hemis.service

import mu.KotlinLogging
import org.springframework.http.HttpHeaders
import org.springframework.http.MediaType
import org.springframework.stereotype.Service
import org.springframework.web.reactive.function.client.WebClient
import reactor.core.publisher.Mono
import uz.scorm.lms.app.v1.auth.controller.AuthController
import uz.scorm.lms.app.v1.auth.dto.LoginRequest
import uz.scorm.lms.app.v1.auth.dto.TokenResponse
import uz.scorm.lms.app.v1.hemis.controller.HemisAuthController
import uz.scorm.lms.app.v1.hemis.dto.HemisStudentResponse
import uz.scorm.lms.app.v1.hemis.model.HemisStudent

@Service
class HemisService(private val webClient: WebClient) {

    private val logger = KotlinLogging.logger {}
    private var token: String? = null;
    private var host: String = "https://student.namdtu.uz";
    private var url: String = "/rest/v1/";
    private var baseUrl: String = "$host$url";

    fun singInHemis(loginRequest: HemisAuthController.HemisLoginRequest): String {

        try {
            this.token = webClient.post()
                .uri("$baseUrl/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON)
                .bodyValue(loginRequest)
                .retrieve()
                .onStatus({ status -> status.isError }) { response ->
                    response.bodyToMono(String::class.java)
                        .defaultIfEmpty("No error details")
                        .flatMap { body ->
                            logger.error("Login failed with status ${response.statusCode()}: $body")
                            Mono.error(RuntimeException("Login failed: ${response.statusCode()} - $body"))
                        }
                }
                .bodyToMono(TokenResponse::class.java)
                .block()
                ?.data?.token
                ?: throw RuntimeException("No token in response")
        } catch (e: Exception) {
            logger.error("Error during HEMIS login", e)
            throw RuntimeException("Failed to authenticate with HEMIS: ${e.message}", e)
        }
        return this.token ?: "";
    }

    fun fetchStudentByToken(hemisToken: String): HemisStudent {

        val student: HemisStudent;
        try {
           student= webClient.get()
                .uri("$baseUrl/account/me")
                .header(HttpHeaders.AUTHORIZATION, "Bearer $token")
                .retrieve()
                .bodyToMono(HemisStudentResponse::class.java)
                .block()?.data!!
        } catch (e: Exception) {
            throw RuntimeException("Failed to fetch student profile")
        }

        return student;
    }

//    fun fetchStudentById(hemisId: String): HemisStudent {
//        // Demo stub
//        val username = "s_${'$'}{hemisId.takeLast(6)}"
//        return HemisStudent(
//            hemisId = hemisId,
//            username = username,
//            fullName = "Hemis Student",
//            email = "${'$'}username@example.edu"
//        )
//    }
}
