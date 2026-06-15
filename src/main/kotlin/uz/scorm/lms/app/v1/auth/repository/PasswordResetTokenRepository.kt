package uz.scorm.lms.app.v1.auth.repository

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import uz.scorm.lms.app.v1.auth.model.PasswordResetToken
import uz.scorm.lms.app.v1.user.model.User

interface PasswordResetTokenRepository : JpaRepository<PasswordResetToken, Long> {
    fun findByToken(token: String): PasswordResetToken?

    @Modifying
    @Query("DELETE FROM PasswordResetToken t WHERE t.user = :user")
    fun deleteAllByUser(user: User)
}
