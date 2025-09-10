package uz.scorm.lms.app.v1.permission.model

import jakarta.persistence.*

@Entity
@Table(name = "permissions")
class Permission(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null,

    @Column(nullable = false, unique = true)
    var code: String = "", // e.g. USER_READ, USER_WRITE

    @Column(nullable = false)
    var name: String = ""
)
