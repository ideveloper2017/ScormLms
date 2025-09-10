package uz.scorm.lms.app.v1.auth.model

import jakarta.persistence.*
import java.time.Instant
import uz.scorm.lms.app.v1.user.model.User

@Entity
@Table(name = "refresh_tokens")
class RefreshToken(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null,

    @Column(nullable = false, unique = true, length = 200)
    var token: String = "",

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    var user: User? = null,

    @Column(nullable = false)
    var expiresAt: Instant = Instant.now(),

    @Column(nullable = false)
    var revoked: Boolean = false,

    @Column
    var replacedByToken: String? = null,

    @Column(nullable = false)
    var createdAt: Instant = Instant.now()
)
