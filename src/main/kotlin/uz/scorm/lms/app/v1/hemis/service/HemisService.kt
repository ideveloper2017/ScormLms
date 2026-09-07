package uz.scorm.lms.app.v1.hemis.service

import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpHeaders
import org.springframework.http.MediaType
import org.springframework.stereotype.Service
import org.springframework.web.reactive.function.client.WebClient
import org.springframework.web.reactive.function.client.WebClientResponseException
import org.springframework.web.reactive.function.client.WebClientRequestException
import uz.scorm.lms.app.v1.hemis.dto.*
import uz.scorm.lms.app.v1.hemis.model.CodeName
import uz.scorm.lms.app.v1.hemis.model.HemisStudent
import uz.scorm.lms.app.v1.hemis.model.Semester
import uz.scorm.lms.app.v1.student.dto.StudentCreateRequest
import uz.scorm.lms.app.v1.student.model.*
import java.security.SecureRandom
import java.time.Instant
import java.time.Duration
import java.net.URI
import java.util.concurrent.TimeoutException
import java.time.ZoneId
import java.util.Base64

interface HemisDirectoryClient {
    fun fetchGroupList(): List<HemisGroupItem>
    fun fetchStudentsByGroup(groupId: Long, limit: Int = 200, offset: Int = 0): HemisStudentListData
    fun fetchStudentsByIdentity(identity: String, limit: Int = 20): List<HemisStudent> = emptyList()
    fun credentialsConfigured(): Boolean
}

@Service
class HemisService(
    private val webClient: WebClient,
    @param:Value("\${hemis.host:}") private val hemisHost: String,
    @param:Value("\${hemis.api-base-path:/rest/v1}") private val apiBasePath: String,
    @param:Value("\${hemis.admin-login:}") private val adminLogin: String,
    @param:Value("\${hemis.admin-password:}") private val adminPassword: String,
    @param:Value("\${hemis.request-timeout-seconds:15}") private val timeoutSeconds: Long = 15,
) : HemisDirectoryClient {
    private data class HemisPasswordLoginRequest(val login: String, val password: String)

    private val baseUrl get() = "${hemisHost.trim().trimEnd('/')}/${apiBasePath.trim().trim('/')}"
    private val timeout get() = Duration.ofSeconds(timeoutSeconds.coerceIn(1, 60))

    fun connectionStatus(): HemisConnectionStatus {
        val host = runCatching { URI(hemisHost.trim()) }.getOrNull()
        val validHost = host != null && host.scheme in listOf("https", "http") && !host.host.isNullOrBlank() &&
            host.userInfo == null && host.query == null && host.fragment == null && host.path.orEmpty().trim('/').isEmpty()
        val validPath = apiBasePath.startsWith('/') && !apiBasePath.startsWith("//") &&
            apiBasePath.matches(Regex("/[a-zA-Z0-9/_-]+"))
        val missing = buildList {
            if (!validHost) add("HEMIS_HOST")
            if (!validPath) add("HEMIS_API_BASE_PATH")
            if (adminLogin.isBlank()) add("HEMIS_ADMIN_LOGIN")
            if (adminPassword.isBlank()) add("HEMIS_ADMIN_PASSWORD")
        }
        return HemisConnectionStatus(
            status = if (missing.isEmpty()) "NOT_CHECKED" else "NOT_CONFIGURED",
            host = if (validHost) hemisHost.trim().trimEnd('/') else null,
            apiBasePath = if (validPath) apiBasePath else null,
            missingFields = missing,
            message = if (missing.isEmpty()) "Sozlamalar mavjud. API bilan ulanish hali tekshirilmagan."
                else "HEMIS ulanishi uchun server sozlamalari to‘ldirilishi kerak.",
        )
    }

    fun checkConnection(): HemisConnectionStatus {
        val configuration = connectionStatus()
        if (configuration.missingFields.isNotEmpty()) return configuration
        return try {
            val groups = fetchGroupPage(1)
            configuration.copy(status = "CONNECTED", message = "HEMIS guruhlar API’siga ulanish tekshirildi. Talabalar import qilinmadi.",
                checkedAt = Instant.now(), groupsTotal = groups.total)
        } catch (error: Exception) {
            val causes = generateSequence<Throwable>(error) { it.cause }.take(10).toList()
            val http = causes.filterIsInstance<WebClientResponseException>().firstOrNull()?.statusCode?.value()
            val (status, message) = when {
                http == 401 -> "AUTH_FAILED" to "HEMIS kirish ma’lumotlarini qabul qilmadi."
                http == 403 -> "ACCESS_DENIED" to "HEMIS guruhlarini o‘qish uchun ruxsat yetarli emas."
                http == 404 -> "API_NOT_FOUND" to "HEMIS API yo‘li topilmadi. API manzilini muassasa administratori bilan tekshiring."
                causes.any { it is TimeoutException } -> "TIMEOUT" to "HEMIS belgilangan vaqtda javob bermadi. Qayta tekshiring."
                causes.any { it is WebClientRequestException } -> "UNREACHABLE" to "HEMIS serveriga ulanib bo‘lmadi. Manzil va tarmoqni tekshiring."
                http != null -> "REMOTE_ERROR" to "HEMIS API so‘rovni bajara olmadi. Keyinroq qayta tekshiring."
                else -> "INVALID_RESPONSE" to "HEMIS javobi kutilgan API formatiga mos kelmadi. API turi va yo‘lini tekshirish kerak."
            }
            // Never return remote bodies, credentials or exception messages to the browser.
            configuration.copy(status = status, message = message, checkedAt = Instant.now())
        }
    }

    private fun signInHemis(login: String, password: String): String = webClient.post()
        .uri("$baseUrl/auth/login")
        .contentType(MediaType.APPLICATION_JSON)
        .accept(MediaType.APPLICATION_JSON)
        .bodyValue(HemisPasswordLoginRequest(login, password))
        .retrieve()
        .bodyToMono(HemisTokenResponse::class.java)
        .timeout(timeout)
        .block()
        ?.takeIf { it.success }?.data?.token?.takeIf { it.isNotBlank() }
        ?: error("HEMIS token olinmadi")

    fun fetchStudentByToken(token: String): HemisStudent = webClient.get()
        .uri("$baseUrl/account/me")
        .header(HttpHeaders.AUTHORIZATION, "Bearer $token")
        .retrieve()
        .bodyToMono(HemisStudentResponse::class.java)
        .timeout(timeout)
        .block()
        ?.data
        ?: error("HEMIS /account/me bo'sh qaytdi")

    private fun adminToken(): String {
        require(connectionStatus().missingFields.isEmpty()) {
            "HEMIS server manzili, API yo‘li yoki kirish ma’lumotlari sozlanmagan"
        }
        return signInHemis(adminLogin, adminPassword)
    }

    override fun fetchGroupList(): List<HemisGroupItem> {
        return fetchGroupPage(500).items
    }

    private fun fetchGroupPage(limit: Int): HemisGroupListData {
        val token = adminToken()
        return webClient.get()
            .uri("$baseUrl/data/group-list?limit=$limit&offset=0")
            .header(HttpHeaders.AUTHORIZATION, "Bearer $token")
            .retrieve()
            .bodyToMono(HemisGroupListResponse::class.java)
            .timeout(timeout)
            .block()
            ?.takeIf { it.success }?.data
            ?: error("HEMIS_GROUP_RESPONSE_INVALID")
    }

    override fun fetchStudentsByGroup(groupId: Long, limit: Int, offset: Int): HemisStudentListData {
        val token = adminToken()
        return webClient.get()
            .uri("$baseUrl/data/student-list?limit=$limit&offset=$offset&_group=$groupId")
            .header(HttpHeaders.AUTHORIZATION, "Bearer $token")
            .retrieve()
            .bodyToMono(HemisStudentListResponse::class.java)
            .timeout(timeout)
            .block()
            ?.takeIf { it.success }?.data
            ?: error("HEMIS_STUDENT_RESPONSE_INVALID")
    }

    override fun fetchStudentsByIdentity(identity: String, limit: Int): List<HemisStudent> {
        val token = adminToken()
        return webClient.get()
            .uri("$baseUrl/data/student-list?limit=${limit.coerceIn(1, 50)}&offset=0&search={identity}", identity)
            .header(HttpHeaders.AUTHORIZATION, "Bearer $token")
            .retrieve()
            .bodyToMono(HemisStudentListResponse::class.java)
            .timeout(timeout)
            .block()
            ?.takeIf { it.success }?.data?.items
            ?: error("HEMIS_STUDENT_RESPONSE_INVALID")
    }

    override fun credentialsConfigured(): Boolean = connectionStatus().missingFields.isEmpty()

    fun HemisStudent.toCreateRequest(): StudentCreateRequest {
        val validPinfl = pinfl?.filter(Char::isDigit)?.takeIf { it.length == 14 }
            ?: throw IllegalArgumentException("HEMIS_PINFL_MISSING")
        val birthMillis = normalizeEpochMillis(birth_date)
        val birthLocalDate = runCatching { Instant.ofEpochMilli(birthMillis).atZone(TASHKENT).toLocalDate() }
            .getOrElse { throw IllegalArgumentException("HEMIS_BIRTH_DATE_INVALID") }
        val mappedGender = mapGender(gender) ?: throw IllegalArgumentException("HEMIS_GENDER_MISSING")
        val language = educationLang.code.lowercase().let {
            when {
                it.startsWith("uz") -> "uz"
                it.startsWith("ru") -> "ru"
                it.startsWith("en") -> "en"
                else -> "und"
            }
        }

        return StudentCreateRequest(
            pinfl = validPinfl,
            lastName = second_name.trim(),
            firstName = first_name.trim(),
            middleName = third_name.trim().ifBlank { null },
            birthDate = birthLocalDate,
            gender = mappedGender,
            citizenship = if (country.name.contains("O'zbekiston", true) || country.name.contains("Uzbekistan", true)) Citizenship.UZBEKISTAN else Citizenship.OTHER,
            studentNumber = student_id_number.trim(),
            email = email?.trim()?.takeIf(String::isNotBlank),
            photoUrl = image,
            educationLanguage = language,
            degreeLevel = mapDegree(level),
            educationForm = mapEducationForm(educationForm),
            courseNumber = mapCourseNumber(semester),
            academicYear = semester.education_year.name.takeIf(String::isNotBlank),
            studentStatus = mapStudentStatus(studentStatus),
            paymentType = mapPayment(paymentForm),
            password = randomLocalPassword(),
        )
    }

    fun HemisStudent.toPreviewDto(alreadyExists: Boolean) = HemisStudentPreviewDto(
        hemisId = id,
        studentNumber = student_id_number,
        fullName = full_name,
        birthDate = runCatching {
            Instant.ofEpochMilli(normalizeEpochMillis(birth_date)).atZone(TASHKENT).toLocalDate().toString()
        }.getOrNull(),
        email = email,
        faculty = faculty.name,
        group = group.name,
        specialty = specialty.name,
        educationLang = educationLang.name,
        alreadyExists = alreadyExists,
    )

    private fun randomLocalPassword(): String = ByteArray(32).also(SecureRandom()::nextBytes)
        .let { Base64.getUrlEncoder().withoutPadding().encodeToString(it) }

    private fun normalizeEpochMillis(value: Long): Long = if (value in 1..99_999_999_999L) value * 1000 else value

    private fun mapGender(value: CodeName?): Gender? {
        val normalized = "${value?.code.orEmpty()} ${value?.name.orEmpty()}".lowercase()
        return when {
            normalized.contains("female") || normalized.contains("ayol") || normalized.contains("жен") || value?.code == "12" -> Gender.FEMALE
            normalized.contains("male") || normalized.contains("erkak") || normalized.contains("муж") || value?.code == "11" -> Gender.MALE
            else -> null
        }
    }

    private fun mapDegree(value: CodeName): DegreeLevel = when {
        value.name.contains("magistr", true) -> DegreeLevel.MASTER
        value.name.contains("doktor", true) || value.name.contains("phd", true) -> DegreeLevel.PHD
        value.name.contains("associate", true) -> DegreeLevel.ASSOCIATE
        else -> DegreeLevel.BACHELOR
    }

    private fun mapEducationForm(value: CodeName): EducationForm = when {
        value.name.contains("masof", true) || value.name.contains("distance", true) -> EducationForm.DISTANCE
        value.name.contains("sirt", true) || value.name.contains("part", true) -> EducationForm.PART_TIME
        value.name.contains("kech", true) || value.name.contains("evening", true) -> EducationForm.EVENING
        else -> EducationForm.FULL_TIME
    }

    private fun mapStudentStatus(value: CodeName): StudentStatus = when {
        value.name.contains("bitir", true) || value.name.contains("graduat", true) -> StudentStatus.GRADUATED
        value.name.contains("chet", true) || value.name.contains("expel", true) -> StudentStatus.EXPELLED
        value.name.contains("akadem", true) || value.name.contains("suspend", true) -> StudentStatus.SUSPENDED
        else -> StudentStatus.ACTIVE
    }

    private fun mapPayment(value: CodeName): PaymentType? = when {
        value.name.contains("grant", true) || value.name.contains("budget", true) -> PaymentType.GRANT
        value.name.contains("contract", true) || value.name.contains("kontrakt", true) -> PaymentType.CONTRACT
        else -> null
    }

    private fun mapCourseNumber(value: Semester): Int {
        val semesterNumber = Regex("\\d+").find(value.name)?.value?.toIntOrNull()
            ?: Regex("\\d+").find(value.code)?.value?.toIntOrNull()
            ?: 1
        return ((semesterNumber + 1) / 2).coerceIn(1, 10)
    }

    companion object {
        private val TASHKENT = ZoneId.of("Asia/Tashkent")
    }
}
