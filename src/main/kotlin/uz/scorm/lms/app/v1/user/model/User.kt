package uz.scorm.lms.app.v1.user.model

import jakarta.persistence.*
import uz.scorm.lms.app.common.BaseEntity
import uz.scorm.lms.app.v1.role.model.Role
import java.io.Serializable
import java.time.Instant

@Entity
@Table(name = "users")
class User(

    @Column(unique = true, nullable = false)
    var username: String = "",

    @Column(unique = true, nullable = true)  // Make sure this is nullable
    var phone: String = "",

    @Column(nullable = false)
    var password: String = "",

    @Column(name = "first_name")
    var firstName: String? = null,

    @Column(name = "last_name")
    var lastName: String? = null,

    @Column(nullable = false)
    var enabled: Boolean = true,

    // HEMIS integration fields
    @Column(unique = true)
    var hemisId: String? = null,

    @Column(unique = true)
    var email: String? = null,

    @Column(name = "photo")
    var photo: String? = null,

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
): BaseEntity(), Serializable {

    fun getFullName(): String {
        return listOfNotNull(firstName, lastName).joinToString(" ").ifEmpty { username }
    }
}
