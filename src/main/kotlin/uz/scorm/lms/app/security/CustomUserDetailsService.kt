package uz.scorm.lms.app.security

import org.springframework.security.core.GrantedAuthority
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.core.userdetails.User
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.security.core.userdetails.UserDetailsService
import org.springframework.security.core.userdetails.UsernameNotFoundException
import org.springframework.stereotype.Service
import uz.scorm.lms.app.v1.user.model.UserStatus
import uz.scorm.lms.app.v1.user.repository.UserRepository

@Service
class CustomUserDetailsService(
    private val userRepository: UserRepository
) : UserDetailsService {

    override fun loadUserByUsername(username: String): UserDetails {
        val u = userRepository.findByUsername(username)
            ?: throw UsernameNotFoundException("User not found: $username")

        val role = u.role
        val roleAuthorities: List<GrantedAuthority> = listOfNotNull(role)
            .map { if (it.code.startsWith("ROLE_")) it.code else "ROLE_${it.code}" }
            .map { SimpleGrantedAuthority(it) }

        val permAuthorities: List<GrantedAuthority> = listOfNotNull(role)
            .flatMap { it.permissions }
            .map { it.code }
            .distinct()
            .map { SimpleGrantedAuthority(it) }

        val isEnabled = u.status == UserStatus.ACTIVE
        return User(u.username, u.password, isEnabled, true, true, true, roleAuthorities + permAuthorities)
    }
}
