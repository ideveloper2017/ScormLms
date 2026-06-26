package uz.scorm.lms.app.v1.hemis.service

import mu.KotlinLogging
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpHeaders
import org.springframework.http.MediaType
import org.springframework.stereotype.Service
import org.springframework.web.reactive.function.client.WebClient
import reactor.core.publisher.Mono
import uz.scorm.lms.app.v1.hemis.controller.HemisAuthController
import uz.scorm.lms.app.v1.hemis.dto.*
import uz.scorm.lms.app.v1.hemis.model.HemisStudent
import uz.scorm.lms.app.v1.student.dto.StudentCreateRequest
import uz.scorm.lms.app.v1.student.model.Gender
import uz.scorm.lms.app.v1.student.model.StudentStatus
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId

private val logger = KotlinLogging.logger {}

@Service
class HemisService(
    private val webClient: WebClient,
    @Value("\${hemis.host:https://student.namdtu.uz}") private val hemisHost: String,
    @Value("\${hemis.api-base-path:/rest/v1}") private val apiBasePath: String,
    @Value("\${hemis.admin-login:}") private val adminLogin: String,
    @Value("\${hemis.admin-password:}") private val adminPassword: String,
) {
    private val baseUrl get() = "$hemisHost$apiBasePath"

    // ── Umumiy token olish ────────────────────────────────────────────────────

    fun signInHemis(req: HemisAuthController.HemisLoginRequest): String {
        return webClient.post()
            .uri("$baseUrl/auth/login")
            .contentType(MediaType.APPLICATION_JSON)
            .accept(MediaType.APPLICATION_JSON)
            .bodyValue(req)
            .retrieve()
            .onStatus({ it.isError }) { resp ->
                resp.bodyToMono(String::class.java).defaultIfEmpty("").flatMap {
                    Mono.error(RuntimeException("HEMIS login xatosi: ${resp.statusCode()} — $it"))
                }
            }
            .bodyToMono(HemisTokenResponse::class.java)
            .block()
            ?.data?.token
            ?: error("HEMIS token olinmadi")
    }

    /** Talabaning o'z profili — `/account/me` */
    fun fetchStudentByToken(token: String): HemisStudent {
        return webClient.get()
            .uri("$baseUrl/account/me")
            .header(HttpHeaders.AUTHORIZATION, "Bearer $token")
            .retrieve()
            .bodyToMono(HemisStudentResponse::class.java)
            .block()
            ?.data
            ?: error("HEMIS /account/me bo'sh qaytdi")
    }

    // ── Admin kreditsiallari bilan token ──────────────────────────────────────

    private fun adminToken(): String {
        require(adminLogin.isNotBlank() && adminPassword.isNotBlank()) {
            "HEMIS admin kreditsiallari sozlanmagan (HEMIS_ADMIN_LOGIN / HEMIS_ADMIN_PASSWORD)"
        }
        return signInHemis(HemisAuthController.HemisLoginRequest(adminLogin, adminPassword))
    }

    // ── Guruhlar ro'yxati ─────────────────────────────────────────────────────

    fun fetchGroupList(): List<HemisGroupItem> {
        val token = adminToken()
        return webClient.get()
            .uri("$baseUrl/data/group-list?limit=500&offset=0")
            .header(HttpHeaders.AUTHORIZATION, "Bearer $token")
            .retrieve()
            .bodyToMono(HemisGroupListResponse::class.java)
            .block()
            ?.data?.items
            ?: emptyList()
    }

    // ── Guruh bo'yicha talabalar ro'yxati ─────────────────────────────────────

    fun fetchStudentsByGroup(groupId: Long, limit: Int = 200, offset: Int = 0): HemisStudentListData {
        val token = adminToken()
        return webClient.get()
            .uri("$baseUrl/data/student-list?limit=$limit&offset=$offset&_group=$groupId")
            .header(HttpHeaders.AUTHORIZATION, "Bearer $token")
            .retrieve()
            .bodyToMono(HemisStudentListResponse::class.java)
            .block()
            ?.data
            ?: HemisStudentListData(emptyList(), 0, limit, offset)
    }

    // ── HemisStudent → StudentCreateRequest mapping ───────────────────────────

    fun HemisStudent.toCreateRequest(): StudentCreateRequest {
        val birthLocalDate = runCatching {
            Instant.ofEpochMilli(birth_date).atZone(ZoneId.of("Asia/Tashkent")).toLocalDate()
        }.getOrElse { LocalDate.of(2000, 1, 1) }

        val lang = educationLang.code.lowercase().let {
            when { it.startsWith("uz") -> "uz"; it.startsWith("ru") -> "ru"; else -> "uz" }
        }

        return StudentCreateRequest(
            pinfl           = student_id_number,        // HEMIS PINFL bermaydi — vaqtincha ID
            lastName        = second_name.trim(),
            firstName       = first_name.trim(),
            middleName      = third_name.trim().ifBlank { null },
            birthDate       = birthLocalDate,
            gender          = Gender.MALE,              // HEMIS gender maydonini kengaytirish mumkin
            studentNumber   = student_id_number,
            email           = email,
            photoUrl        = image,
            educationLanguage = lang,
            studentStatus   = StudentStatus.ACTIVE,
            password        = "HEMIS@${student_id_number.takeLast(6)}",
        )
    }

    /** HemisStudent ni UI preview DTO ga aylantiradi */
    fun HemisStudent.toPreviewDto(alreadyExists: Boolean) = HemisStudentPreviewDto(
        hemisId        = id,
        studentNumber  = student_id_number,
        fullName       = full_name,
        birthDate      = runCatching {
            Instant.ofEpochMilli(birth_date).atZone(ZoneId.of("Asia/Tashkent"))
                .toLocalDate().toString()
        }.getOrNull(),
        email          = email,
        faculty        = faculty.name,
        group          = group.name,
        specialty      = specialty.name,
        educationLang  = educationLang.name,
        alreadyExists  = alreadyExists,
    )
}
