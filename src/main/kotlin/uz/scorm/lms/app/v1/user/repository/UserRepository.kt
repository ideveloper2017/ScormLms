package uz.scorm.lms.app.v1.user.repository

import org.springframework.data.jpa.repository.JpaRepository
import uz.scorm.lms.app.v1.user.model.User
import uz.scorm.lms.app.v1.user.model.UserStatus

interface UserRepository : JpaRepository<User, Long> {
    fun findByUsername(username: String): User?
    fun existsByUsername(username: String): Boolean
    fun existsByEmail(email: String): Boolean
    fun existsByPhone(phone: String): Boolean
    fun findAllByStatus(status: UserStatus): List<User>
}
