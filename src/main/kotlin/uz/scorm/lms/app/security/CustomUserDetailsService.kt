package uz.scorm.lms.app.security

import org.springframework.security.core.GrantedAuthority
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.core.userdetails.User
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.security.core.userdetails.UserDetailsService
import org.springframework.security.core.userdetails.UsernameNotFoundException
import org.springframework.stereotype.Service
import uz.scorm.lms.app.v1.user.repository.UserRepository

@Service
class CustomUserDetailsService(
    private val userRepository: UserRepository
) : UserDetailsService {
    override fun loadUserByUsername(username: String): UserDetails {
        val u = userRepository.findByUsername(username)
            ?: throw UsernameNotFoundException("User not found: $username")

        val roleAuthorities: List<GrantedAuthority> = u.roles
            .map { it.code }
            .map { code -> if (code.startsWith("ROLE_")) code else "ROLE_" + code }
            .map { SimpleGrantedAuthority(it) }

        val permAuthorities: List<GrantedAuthority> = u.roles
            .flatMap { it.permissions }
            .map { it.code }
            .distinct()
            .map { SimpleGrantedAuthority(it) }

        val authorities = (roleAuthorities + permAuthorities)
        return User(u.username, u.password, u.enabled, true, true, true, authorities)
    }
}
