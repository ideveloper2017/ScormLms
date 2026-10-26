package uz.scorm.lms.app.v1.hemis.service

import org.springframework.beans.factory.annotation.Value
import org.springframework.security.oauth2.core.user.OAuth2User
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.teacher.model.Teacher
import uz.scorm.lms.app.v1.teacher.repository.TeacherRepository
import uz.scorm.lms.app.v1.user.model.User
import uz.scorm.lms.app.v1.user.model.UserStatus
import uz.scorm.lms.app.v1.user.repository.UserRepository
import uz.scorm.lms.app.v1.user.service.UserService
import java.security.SecureRandom
import java.util.Base64

/**
 * HEMIS xodim (o'qituvchi) OAuth akkauntini LMS o'qituvchisiga bog'laydi.
 * O'qituvchi kartasida HEMIS ID yoki HEMIS login ko'rsatilgan bo'lishi kerak; LMS login akkaunti
 * bo'lmasa, birinchi kirishda "teacher" roli bilan avtomatik yaratiladi.
 */
@Service
class HemisEmployeeAccountService(
    private val teacherRepository: TeacherRepository,
    private val userRepository: UserRepository,
    private val userService: UserService,
    @Value("\${app.hemis.employee-oauth.id-attribute:employee_id_number}") private val idAttribute: String,
    @Value("\${app.hemis.employee-oauth.login-attribute:login}") private val loginAttribute: String,
) {
    @Transactional
    fun resolveActiveUser(principal: OAuth2User): User = resolveTeacher(
        employeeId = principal.attributes[idAttribute]?.toString(),
        login = principal.attributes[loginAttribute]?.toString(),
    )

    @Transactional
    fun resolveTeacher(employeeId: String?, login: String?): User {
        val id = employeeId?.trim()?.takeIf(String::isNotBlank)
        val hemisLogin = login?.trim()?.takeIf(String::isNotBlank)

        val byId = id?.let(teacherRepository::findByHemisEmployeeId)
        val byLogin = hemisLogin?.let(teacherRepository::findByHemisLoginIgnoreCase)
        if (byId != null && byLogin != null && byId.id != byLogin.id) {
            throw IllegalStateException("HEMIS_ACCOUNT_CONFLICT")
        }
        if (id != null && byLogin?.hemisEmployeeId != null && byLogin.hemisEmployeeId != id) {
            throw IllegalStateException("HEMIS_ACCOUNT_CONFLICT")
        }

        val teacher = byId ?: byLogin ?: throw NoSuchElementException("HEMIS_ACCOUNT_NOT_LINKED")
        if (!teacher.active) throw IllegalStateException("HEMIS_ACCOUNT_INACTIVE")
        // Login bo'yicha topilganda barqaror identifikatorni ham eslab qolamiz
        if (teacher.hemisEmployeeId == null && id != null) teacher.hemisEmployeeId = id

        val user = teacher.user ?: provisionUser(teacher, hemisLogin ?: "hemis-$id")
        if (user.status != UserStatus.ACTIVE) throw IllegalStateException("HEMIS_ACCOUNT_INACTIVE")
        teacherRepository.save(teacher)
        return user
    }

    private fun provisionUser(teacher: Teacher, username: String): User {
        if (userRepository.existsByUsername(username)) throw IllegalStateException("HEMIS_ACCOUNT_CONFLICT")
        // Parol hech kimga berilmaydi: o'qituvchi HEMIS orqali kiradi, kerak bo'lsa admin parolni tiklaydi
        val user = userService.register(username, randomPassword(), "teacher")
        user.fullName = teacher.fullName
        teacher.email?.takeIf { email -> userRepository.findByEmail(email) == null }?.let { user.email = it }
        teacher.user = userRepository.save(user)
        return user
    }

    private fun randomPassword(): String = ByteArray(32).also(SecureRandom()::nextBytes)
        .let { Base64.getUrlEncoder().withoutPadding().encodeToString(it) }
}
