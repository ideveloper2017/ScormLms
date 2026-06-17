package uz.scorm.lms.app.config

import mu.KotlinLogging
import org.springframework.beans.factory.ObjectProvider
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.authentication.AuthenticationManager
import org.springframework.security.authentication.dao.DaoAuthenticationProvider
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity
import org.springframework.security.config.http.SessionCreationPolicy
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService
import org.springframework.security.oauth2.core.user.OAuth2User
import org.springframework.security.web.SecurityFilterChain
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter
import org.springframework.web.cors.CorsConfiguration
import org.springframework.web.cors.UrlBasedCorsConfigurationSource
import org.springframework.web.filter.CorsFilter
import uz.scorm.lms.app.security.JwtAuthFilter
import uz.scorm.lms.app.security.CustomUserDetailsService
import uz.scorm.lms.app.security.JwtAuthEntryPoint
import uz.scorm.lms.app.v1.audit.filter.AuditLoggingFilter

private val logger = KotlinLogging.logger {}

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
class SecurityConfig(
    private val jwtAuthenticationEntryPoint: JwtAuthEntryPoint,
    private val jwtAuthFilter: JwtAuthFilter,
    private val customUserDetailsService: CustomUserDetailsService,
    private val auditLoggingFilter: AuditLoggingFilter,
    private val clientRegistrations: ObjectProvider<ClientRegistrationRepository>,
    @Value("\${app.cors.allowed-origins}") private val allowedOrigins: List<String>
) {

    @Bean
    fun passwordEncoder(): PasswordEncoder = BCryptPasswordEncoder()

    @Bean
    fun authenticationProvider(passwordEncoder: PasswordEncoder): DaoAuthenticationProvider {
        val provider = DaoAuthenticationProvider()
        provider.setUserDetailsService(customUserDetailsService)
        provider.setPasswordEncoder(passwordEncoder)
        return provider
    }

    @Bean
    fun authenticationManager(configuration: AuthenticationConfiguration): AuthenticationManager =
        configuration.authenticationManager

    @Bean
    fun securityFilterChain(http: HttpSecurity): SecurityFilterChain {
        http
            .cors { }
            .csrf { it.disable() }
            .exceptionHandling { it.authenticationEntryPoint(jwtAuthenticationEntryPoint) }
            .sessionManagement { it.sessionCreationPolicy(SessionCreationPolicy.STATELESS) }
            .authorizeHttpRequests {
                it.requestMatchers(
                    "/",
                    "/error",
                    "/login",
                    "/login/oauth2/**",
                    "/actuator/health",
                    "/actuator/info",
                    "/v3/api-docs",
                    "/v3/api-docs/**",
                    "/swagger-ui",
                    "/swagger-ui/**",
                    "/swagger-ui.html",
                    "/webjars/**",
                    "/public/**",
                    "/api/v1/auth/login",
                    "/api/v1/auth/refresh",
                    "/api/v1/auth/refresh-token",
                    "/api/v1/auth/logout",
                    "/auth/hemis/**",
                    "/auth/email/**",
                    "/api/v1/users/register"
                ).permitAll()
                it.anyRequest().authenticated()
            }
        // OAuth2 login faqat client registration sozlangan bo'lsa yoqiladi
        // (application.yml dagi spring.security.oauth2.client.* bloki)
        if (clientRegistrations.ifAvailable != null) {
            http.oauth2Login { oauth2 ->
                oauth2
                    .loginPage("/login")
                    .userInfoEndpoint { userInfo ->
                        userInfo.userService(oAuth2UserService())
                    }
                    .defaultSuccessUrl("/hemis/success", true)
            }
        }

        http
            .authenticationProvider(authenticationProvider(passwordEncoder()))
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter::class.java)
            .addFilterAfter(auditLoggingFilter, UsernamePasswordAuthenticationFilter::class.java)

        return http.build()
    }


    @Bean
    fun oAuth2UserService(): OAuth2UserService<OAuth2UserRequest, OAuth2User> {
        return OAuth2UserService { userRequest ->
            val delegate = DefaultOAuth2UserService()
            val oAuth2User = delegate.loadUser(userRequest)

            // HEMISdan kelgan user data
            logger.debug { "HEMIS OAuth2 user attributes: ${oAuth2User.attributes.keys}" }

            oAuth2User
        }
    }

    @Bean
    fun corsFilter(): CorsFilter {
        val source = UrlBasedCorsConfigurationSource()
        val config = CorsConfiguration()
        config.allowCredentials = true
        config.allowedOrigins = allowedOrigins
        config.allowedMethods = listOf("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
        config.allowedHeaders = listOf("*")
        config.addExposedHeader("Authorization")
        source.registerCorsConfiguration("/**", config)
        return CorsFilter(source)
    }
}