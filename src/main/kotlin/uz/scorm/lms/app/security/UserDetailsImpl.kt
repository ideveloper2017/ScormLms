package uz.scorm.lms.app.security

import org.springframework.security.core.GrantedAuthority
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.core.userdetails.UserDetails
import uz.scorm.lms.app.v1.user.model.User
import uz.scorm.lms.app.v1.user.model.UserStatus

class UserDetailsImpl(user: User) : UserDetails {

    private val id: Long? = user.id
    private val username: String = user.username
    private val password: String = user.password
    private val active: Boolean = user.status == UserStatus.ACTIVE
    private val authorities: MutableCollection<GrantedAuthority>

    init {
        val roleName = user.role?.name
        authorities = if (roleName != null) {
            mutableListOf(SimpleGrantedAuthority("ROLE_${roleName.uppercase()}"))
        } else {
            mutableListOf()
        }
    }

    override fun getAuthorities(): MutableCollection<out GrantedAuthority> = authorities
    override fun getPassword(): String = password
    override fun getUsername(): String = username
    override fun isEnabled(): Boolean = active
    override fun isCredentialsNonExpired(): Boolean = true
    override fun isAccountNonExpired(): Boolean = true
    override fun isAccountNonLocked(): Boolean = true

    fun getId(): Long? = id

    val userId: Long
        get() = requireNotNull(id) { "Autentifikatsiya foydalanuvchi IDsi mavjud emas" }

    val mayManageAll: Boolean
        get() = authorities.any {
            it.authority in setOf("ROLE_SUPER_ADMIN", "ROLE_ADMIN", "ROLE_METODIST", "USER_MANAGE", "ACADEMIC_WRITE")
        }
}
