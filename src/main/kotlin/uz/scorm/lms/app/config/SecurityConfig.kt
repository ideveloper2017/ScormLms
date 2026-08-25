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
import org.springframework.security.web.header.writers.DelegatingRequestMatcherHeaderWriter
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter
import org.springframework.security.web.header.writers.StaticHeadersWriter
import org.springframework.security.web.header.writers.frameoptions.XFrameOptionsHeaderWriter
import org.springframework.security.web.util.matcher.RequestMatcher
import org.springframework.web.cors.CorsConfiguration
import org.springframework.web.cors.CorsConfigurationSource
import org.springframework.web.cors.UrlBasedCorsConfigurationSource
import uz.scorm.lms.app.security.AuthRateLimitFilter
import uz.scorm.lms.app.security.JwtAuthFilter
import uz.scorm.lms.app.security.CustomUserDetailsService
import uz.scorm.lms.app.security.JwtAuthEntryPoint
import uz.scorm.lms.app.v1.audit.filter.AuditLoggingFilter
import uz.scorm.lms.app.v1.hemis.service.HemisOAuthFailureHandler
import uz.scorm.lms.app.v1.hemis.service.HemisOAuthSuccessHandler

private val logger = KotlinLogging.logger {}

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
class SecurityConfig(
    private val jwtAuthenticationEntryPoint: JwtAuthEntryPoint,
    private val jwtAuthFilter: JwtAuthFilter,
    private val customUserDetailsService: CustomUserDetailsService,
    private val auditLoggingFilter: AuditLoggingFilter,
    private val authRateLimitFilter: AuthRateLimitFilter,
    private val clientRegistrations: ObjectProvider<ClientRegistrationRepository>,
    private val hemisOAuthSuccessHandler: HemisOAuthSuccessHandler,
    private val hemisOAuthFailureHandler: HemisOAuthFailureHandler,
    @Value("\${app.cors.allowed-origins}") private val allowedOrigins: List<String>
) {

    @Bean
    fun passwordEncoder(): PasswordEncoder = BCryptPasswordEncoder()

    @Bean
    fun authenticationProvider(passwordEncoder: PasswordEncoder): DaoAuthenticationProvider {
        val provider = DaoAuthenticationProvider(customUserDetailsService)
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
            .headers { headers ->
                headers.frameOptions { it.disable() }
                headers.referrerPolicy { it.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.NO_REFERRER) }
                headers.addHeaderWriter(StaticHeadersWriter("Permissions-Policy", "camera=(self), microphone=(), geolocation=()"))
                headers.addHeaderWriter(DelegatingRequestMatcherHeaderWriter(
                    RequestMatcher { !it.requestURI.startsWith("/scorm-content/") },
                    XFrameOptionsHeaderWriter(),
                ))
            }
            .exceptionHandling { it.authenticationEntryPoint(jwtAuthenticationEntryPoint) }
            .sessionManagement { it.sessionCreationPolicy(SessionCreationPolicy.STATELESS) }
            .authorizeHttpRequests {
                it.requestMatchers(
                    "/",
                    "/error",
                    "/login",
                    "/oauth2/**",
                    "/login/oauth2/**",
                    "/actuator/health",
                    "/actuator/health/**",
                    "/actuator/info",
                    "/v3/api-docs",
                    "/v3/api-docs/**",
                    "/swagger-ui",
                    "/swagger-ui/**",
                    "/swagger-ui.html",
                    "/webjars/**",
                    "/public/**",
                    "/scorm-content/**",
                    "/api/v1/auth/login",
                    "/api/v1/auth/forgot-password",
                    "/api/v1/auth/reset-password",
                    "/api/v1/auth/refresh",
                    "/api/v1/auth/refresh-token",
                    "/api/v1/auth/logout",
                    "/api/v1/auth/hemis/exchange",
                    "/auth/email/**",
                    "/ws/**"       // WebSocket handshake — JWT STOMP da tekshiriladi
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
                    .successHandler(hemisOAuthSuccessHandler)
                    .failureHandler(hemisOAuthFailureHandler)
            }
        }

        http
            .authenticationProvider(authenticationProvider(passwordEncoder()))
            .addFilterBefore(authRateLimitFilter, UsernamePasswordAuthenticationFilter::class.java)
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
    fun corsConfigurationSource(): CorsConfigurationSource {
        val source = UrlBasedCorsConfigurationSource()
        val config = CorsConfiguration()
        val origins = allowedOrigins.map(String::trim).filter(String::isNotBlank)
        require(origins.isNotEmpty() && origins.none { it == "*" }) { "CORS originlar aniq ko'rsatilishi kerak" }
        require(origins.all { it.startsWith("http://") || it.startsWith("https://") }) { "CORS origin HTTP/HTTPS bo'lishi kerak" }
        config.allowCredentials = true
        config.allowedOrigins = origins
        config.allowedMethods = listOf("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
        config.allowedHeaders = listOf("Authorization", "Content-Type", "Accept", "Origin", "X-Requested-With", "X-Request-Id", "X-Correlation-Id")
        config.exposedHeaders = listOf("Authorization", "Content-Disposition", "Retry-After")
        config.maxAge = 3600
        source.registerCorsConfiguration("/**", config)
        return source
    }
}
