package uz.scorm.lms.app.v1.user.repository

import org.springframework.data.jpa.repository.JpaRepository
import uz.scorm.lms.app.v1.user.dto.UserDto
import uz.scorm.lms.app.v1.user.model.User

interface UserRepository : JpaRepository<User, Long> {
    fun findByUsername(username: String): User?
    fun existsByUsername(username: String): Boolean
}
