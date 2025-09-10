package uz.scorm.lms.app.v1.security.model

import jakarta.persistence.*
import java.time.Instant

@Entity
@Table(name = "login_attempts", indexes = [
    Index(name = "idx_login_attempts_username", columnList = "username"),
    Index(name = "idx_login_attempts_ip", columnList = "ip")
])
class LoginAttempt(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null,

    @Column(nullable = false)
    var username: String = "",

    @Column(nullable = true)
    var ip: String? = null,

    @Column(nullable = false)
    var failedCount: Int = 0,

    var firstFailedAt: Instant? = null,
    var lastFailedAt: Instant? = null,

    var lockedUntil: Instant? = null
)
