package uz.scorm.lms.app.v1.audit.model

import jakarta.persistence.*
import java.time.Instant

@Entity
@Table(name = "audit_logs")
class AuditLog(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null,

    @Column(nullable = false)
    var timestamp: Instant = Instant.now(),

    @Column(nullable = true)
    var username: String? = null,

    @Column(nullable = false)
    var action: String = "", // e.g., LOGIN_SUCCESS, USER_REGISTER, ROLE_ASSIGNED, API_REQUEST

    @Column(length = 2048)
    var details: String? = null,

    var method: String? = null,
    var path: String? = null,
    var status: Int? = null,
    var ip: String? = null,
    var userAgent: String? = null
)
