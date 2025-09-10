package uz.scorm.lms.app.v1.user.model

import jakarta.persistence.*
import uz.scorm.lms.app.v1.role.model.Role
import java.time.Instant

@Entity
@Table(name = "users")
class User(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null,

    @Column(nullable = false, unique = true)
    var username: String = "",

    @Column(nullable = false)
    var password: String = "",

    @Column(nullable = false)
    var enabled: Boolean = true,

    // HEMIS integration fields
    @Column(unique = true)
    var hemisId: String? = null,

    var fullName: String? = null,
    var email: String? = null,

    // Email verification
    @Column(nullable = false)
    var emailVerified: Boolean = false,
    var emailVerificationToken: String? = null,
    var emailVerificationExpiresAt: Instant? = null,

    // Face ID fields (simplified placeholders)
    @Lob
    var faceTemplate: String? = null, // e.g., base64 embedding or vendor-provided template

    @Column(nullable = false)
    var faceVerified: Boolean = false,

    var lastFaceVerifiedAt: Instant? = null,

    // Two-Factor Authentication (TOTP)
    @Column
    var twoFactorEnabled: Boolean = false,
    @Lob
    var twoFactorSecret: String? = null,

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "user_roles",
        joinColumns = [JoinColumn(name = "user_id")],
        inverseJoinColumns = [JoinColumn(name = "role_id")]
    )
    var roles: MutableSet<Role> = mutableSetOf()
)
