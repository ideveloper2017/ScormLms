package uz.scorm.lms.app.v1.auth.repository

import org.springframework.data.jpa.repository.JpaRepository
import uz.scorm.lms.app.v1.auth.model.RefreshToken
import uz.scorm.lms.app.v1.user.model.User

interface RefreshTokenRepository : JpaRepository<RefreshToken, Long> {
    fun findByToken(token: String): RefreshToken?
    fun deleteByUser(user: User): Long
}
