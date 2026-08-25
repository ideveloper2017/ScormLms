package uz.scorm.lms.app.v1.hemis.service

import org.springframework.beans.factory.annotation.Value
import org.springframework.security.oauth2.core.user.OAuth2User
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.student.model.StudentStatus
import uz.scorm.lms.app.v1.student.repository.StudentRepository
import uz.scorm.lms.app.v1.user.model.User
import uz.scorm.lms.app.v1.user.model.UserStatus

@Service
class HemisOAuthAccountService(
    private val studentRepository: StudentRepository,
    @Value("\${app.hemis.oauth.id-attribute:id}") private val idAttribute: String,
    @Value("\${app.hemis.oauth.username-attribute:login}") private val usernameAttribute: String,
) {
    @Transactional(readOnly = true)
    fun resolveActiveUser(principal: OAuth2User): User {
        val hemisId = principal.attributes[idAttribute]?.toString()?.trim()?.toLongOrNull()
        val studentNumber = principal.attributes[usernameAttribute]?.toString()?.trim()
            ?.takeIf(String::isNotBlank)

        val byHemisId = hemisId?.let(studentRepository::findByHemisId)
        val byStudentNumber = studentNumber?.let(studentRepository::findByStudentNumber)

        if (byHemisId != null && byStudentNumber != null && byHemisId.id != byStudentNumber.id) {
            throw IllegalStateException("HEMIS_ACCOUNT_CONFLICT")
        }
        if (hemisId != null && byStudentNumber?.hemisId != null && byStudentNumber.hemisId != hemisId) {
            throw IllegalStateException("HEMIS_ACCOUNT_CONFLICT")
        }

        val student = byHemisId ?: byStudentNumber
            ?: throw NoSuchElementException("HEMIS_ACCOUNT_NOT_LINKED")
        if (student.studentStatus != StudentStatus.ACTIVE || student.user.status != UserStatus.ACTIVE) {
            throw IllegalStateException("HEMIS_ACCOUNT_INACTIVE")
        }
        return student.user
    }
}
