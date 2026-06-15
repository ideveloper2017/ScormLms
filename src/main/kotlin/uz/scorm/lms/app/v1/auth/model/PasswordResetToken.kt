package uz.scorm.lms.app.v1.auth.model

import jakarta.persistence.*
import uz.scorm.lms.app.v1.user.model.User
import java.time.Instant

@Entity
@Table(name = "password_reset_tokens")
class PasswordResetToken(

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    var user: User,

    @Column(nullable = false, unique = true)
    var token: String,

    @Column(nullable = false)
    var expiresAt: Instant,

    @Column(nullable = false)
    var used: Boolean = false,

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null
)