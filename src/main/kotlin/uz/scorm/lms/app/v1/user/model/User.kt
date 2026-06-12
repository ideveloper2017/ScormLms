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

    @Column(unique = true)
    var email: String? = null,

    @Column(unique = true)
    var phone: String? = null,

    @Column(name = "password", nullable = false)
    var password: String = "",

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "role_id")
    var role: Role? = null,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "VARCHAR(20) DEFAULT 'ACTIVE'")
    var status: UserStatus = UserStatus.ACTIVE,

    // Extra fields kept for existing integrations
    @Column(name = "first_name")
    var firstName: String? = null,

    @Column(name = "last_name")
    var lastName: String? = null,

    @Column(name = "photo")
    var photo: String? = null,

    @Column(unique = true)
    var hemisId: String? = null,

    @Column(nullable = false)
    var emailVerified: Boolean = false,

    var emailVerificationToken: String? = null,
    var emailVerificationExpiresAt: Instant? = null,

    @Lob
    var faceTemplate: String? = null,

    @Column(nullable = false)
    var faceVerified: Boolean = false,

    var lastFaceVerifiedAt: Instant? = null,

    @Column
    var twoFactorEnabled: Boolean = false,

    @Lob
    var twoFactorSecret: String? = null,

) : BaseEntity(), Serializable
