package uz.scorm.lms.app.v1.user.model

import jakarta.persistence.*
import uz.scorm.lms.app.common.BaseEntity
import uz.scorm.lms.app.v1.role.model.Role
import java.io.Serializable

@Entity
@Table(name = "users")
class User(

    @Column(name = "full_name")
    var fullName: String? = null,

    @Column(unique = true, nullable = false)
    var username: String = "",

    @Column(unique = true)
    var email: String? = null,

    @Column(unique = true)
    var phone: String? = null,

    @Column(name = "password_hash", nullable = false)
    var password: String = "",

    @Column(unique = true, name = "jshshir")
    var jshshir: String? = null,

    @Column(name = "faculty")
    var faculty: String? = null,

    @Column(name = "direction")
    var direction: String? = null,

    @Column(name = "group_name")
    var groupName: String? = null,

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "role_id")
    var role: Role? = null,

    @Enumerated(EnumType.STRING)
    // DEFAULT'ni columnDefinition'ga yozmaymiz: ddl-auto=update PostgreSQL'da
    // yaroqsiz "ALTER COLUMN ... SET DATA TYPE VARCHAR(20) DEFAULT 'ACTIVE'" SQL
    // yasaydi (PG bunday inline DEFAULT'ni qabul qilmaydi). Default qiymat baribir
    // shu yerda (= UserStatus.ACTIVE) Kotlin tomonida ta'minlanadi.
    @Column(nullable = false, length = 20)
    var status: UserStatus = UserStatus.ACTIVE,

) : BaseEntity(), Serializable
