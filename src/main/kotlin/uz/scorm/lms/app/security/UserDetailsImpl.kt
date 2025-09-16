package uz.scorm.lms.app.security

import org.springframework.security.core.GrantedAuthority
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.core.userdetails.UserDetails
import uz.scorm.lms.app.v1.role.model.Role
import uz.scorm.lms.app.v1.user.model.User


class UserDetailsImpl(user: User) : UserDetails {

    // Store only necessary properties instead of the whole User object
    private val id: Long? = user.id
    private val username: String = user.username
    private val password: String = user.password
    private val active: Boolean = user.enabled
    private val authorities: MutableCollection<GrantedAuthority>

    // Store serialized copy of user for when it's needed
    private val userProperties: Map<String, Any?>

    init {
        // Extract authorities at initialization time
        authorities = user.roles.flatMap { role ->
            val permissions = role.permissions.map { SimpleGrantedAuthority(it.name) }
            listOf(SimpleGrantedAuthority("ROLE_${role.name}")) + permissions
        }.toMutableList()

        // Store essential user properties for recreation
        userProperties = mapOf(
            "id" to user.id,
            "username" to user.username,
            "phone" to user.phone,
            "email" to user.email,
            "firstName" to user.firstName,
            "lastName" to user.lastName,
            "enabled" to user.enabled,
            "roles" to user.roles
        )
    }

    override fun getAuthorities(): MutableCollection<out GrantedAuthority> = authorities

    override fun getPassword(): String = password

    override fun getUsername(): String = username

    override fun isEnabled(): Boolean = active

    override fun isCredentialsNonExpired(): Boolean = true

    override fun isAccountNonExpired(): Boolean = true

    override fun isAccountNonLocked(): Boolean = true

    fun getId(): Long? = id

    @Suppress("UNCHECKED_CAST")
    fun getUser(): User {
        val user = User()
        user.id = userProperties["id"] as? Long
        user.username = userProperties["username"] as String
        user.phone = userProperties["phone"] as String
        user.email = userProperties["email"] as String
        user.firstName = userProperties["firstName"] as? String
        user.lastName = userProperties["lastName"] as? String
        user.enabled = userProperties["enabled"] as Boolean
        user.roles = userProperties["roles"] as MutableSet<Role>
        return user
    }
}
