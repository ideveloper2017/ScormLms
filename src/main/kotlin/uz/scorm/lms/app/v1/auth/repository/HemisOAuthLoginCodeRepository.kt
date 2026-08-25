package uz.scorm.lms.app.v1.auth.repository

import jakarta.persistence.LockModeType
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Lock
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import uz.scorm.lms.app.v1.auth.model.HemisOAuthLoginCode
import java.time.Instant

interface HemisOAuthLoginCodeRepository : JpaRepository<HemisOAuthLoginCode, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select code from HemisOAuthLoginCode code join fetch code.user where code.codeHash = :codeHash")
    fun findByCodeHashForUpdate(@Param("codeHash") codeHash: String): HemisOAuthLoginCode?

    fun deleteByExpiresAtBefore(cutoff: Instant): Long
}
