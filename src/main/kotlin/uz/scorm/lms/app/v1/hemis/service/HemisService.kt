package uz.scorm.lms.app.v1.hemis.service

import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpHeaders
import org.springframework.http.MediaType
import org.springframework.stereotype.Service
import org.springframework.web.reactive.function.client.WebClient
import reactor.core.publisher.Mono
import uz.scorm.lms.app.v1.hemis.controller.HemisAuthController
import uz.scorm.lms.app.v1.hemis.dto.*
import uz.scorm.lms.app.v1.hemis.model.CodeName
import uz.scorm.lms.app.v1.hemis.model.HemisStudent
import uz.scorm.lms.app.v1.hemis.model.Semester
import uz.scorm.lms.app.v1.student.dto.StudentCreateRequest
import uz.scorm.lms.app.v1.student.model.*
import java.security.SecureRandom
import java.time.Instant
import java.time.ZoneId
import java.util.Base64

interface HemisDirectoryClient {
    fun fetchGroupList(): List<HemisGroupItem>
    fun fetchStudentsByGroup(groupId: Long, limit: Int = 200, offset: Int = 0): HemisStudentListData
    fun credentialsConfigured(): Boolean
}

@Service
class HemisService(
    private val webClient: WebClient,
    @param:Value("\${hemis.host:https://student.namdtu.uz}") private val hemisHost: String,
    @param:Value("\${hemis.api-base-path:/rest/v1}") private val apiBasePath: String,
    @param:Value("\${hemis.admin-login:}") private val adminLogin: String,
    @param:Value("\${hemis.admin-password:}") private val adminPassword: String,
) : HemisDirectoryClient {
    private val baseUrl get() = "$hemisHost$apiBasePath"

    fun signInHemis(req: HemisAuthController.HemisLoginRequest): String = webClient.post()
        .uri("$baseUrl/auth/login")
        .contentType(MediaType.APPLICATION_JSON)
        .accept(MediaType.APPLICATION_JSON)
        .bodyValue(req)
        .retrieve()
        .onStatus({ it.isError }) { response ->
            response.bodyToMono(String::class.java).defaultIfEmpty("").flatMap {
                Mono.error(RuntimeException("HEMIS login xatosi: ${response.statusCode()}"))
            }
        }
        .bodyToMono(HemisTokenResponse::class.java)
        .block()
        ?.data?.token
        ?: error("HEMIS token olinmadi")

    fun fetchStudentByToken(token: String): HemisStudent = webClient.get()
        .uri("$baseUrl/account/me")
        .header(HttpHeaders.AUTHORIZATION, "Bearer $token")
        .retrieve()
        .bodyToMono(HemisStudentResponse::class.java)
        .block()
        ?.data
        ?: error("HEMIS /account/me bo'sh qaytdi")

    private fun adminToken(): String {
        require(credentialsConfigured()) {
            "HEMIS admin kreditsiallari sozlanmagan (HEMIS_ADMIN_LOGIN / HEMIS_ADMIN_PASSWORD)"
        }
        return signInHemis(HemisAuthController.HemisLoginRequest(adminLogin, adminPassword))
    }

    override fun fetchGroupList(): List<HemisGroupItem> {
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

    override fun fetchStudentsByGroup(groupId: Long, limit: Int, offset: Int): HemisStudentListData {
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

    override fun credentialsConfigured(): Boolean = adminLogin.isNotBlank() && adminPassword.isNotBlank()

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
