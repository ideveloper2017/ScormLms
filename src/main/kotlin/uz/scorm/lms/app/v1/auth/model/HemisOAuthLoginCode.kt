package uz.scorm.lms.app.v1.auth.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import uz.scorm.lms.app.v1.user.model.User
import java.time.Instant

@Entity
@Table(name = "hemis_oauth_login_codes")
class HemisOAuthLoginCode(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null,

    @Column(name = "code_hash", nullable = false, unique = true, length = 64)
    var codeHash: String,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    var user: User,

    @Column(name = "expires_at", nullable = false)
    var expiresAt: Instant,

    @Column(name = "consumed_at")
    var consumedAt: Instant? = null,

    @Column(name = "created_at", nullable = false)
    var createdAt: Instant = Instant.now(),
)

