package uz.scorm.lms.app.v1.security.repository

import org.springframework.data.jpa.repository.JpaRepository
import uz.scorm.lms.app.v1.security.model.LoginAttempt

interface LoginAttemptRepository : JpaRepository<LoginAttempt, Long> {
    fun findByUsername(username: String): LoginAttempt?
}
