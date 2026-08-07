package uz.scorm.lms.app.v1.user.repository

import org.springframework.data.jpa.repository.JpaRepository
import uz.scorm.lms.app.v1.user.model.User
import uz.scorm.lms.app.v1.user.model.UserStatus
import java.time.Instant

interface UserRepository : JpaRepository<User, Long> {
    fun countByStatusAndDeletedFalse(status: UserStatus): Long
    fun findByUsername(username: String): User?
    fun findByEmail(email: String): User?
    fun existsByUsername(username: String): Boolean
    fun existsByEmail(email: String): Boolean
    fun existsByPhone(phone: String): Boolean
    fun findAllByStatus(status: UserStatus): List<User>
    fun findAllByRoleNameIgnoreCaseAndStatusAndDeletedFalseOrderByFullNameAsc(
        roleName: String,
        status: UserStatus,
    ): List<User>
    fun findAllByFaceExpiresAtBeforeAndFaceDescriptorIsNotNullAndDeletedFalse(expiresBefore: Instant): List<User>
}
