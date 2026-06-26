package uz.scorm.lms.app.config

import org.springframework.messaging.Message
import org.springframework.messaging.MessageChannel
import org.springframework.messaging.simp.stomp.StompCommand
import org.springframework.messaging.simp.stomp.StompHeaderAccessor
import org.springframework.messaging.support.ChannelInterceptor
import org.springframework.messaging.support.MessageHeaderAccessor
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.userdetails.UserDetailsService
import org.springframework.stereotype.Component
import uz.scorm.lms.app.security.JwtService
import mu.KotlinLogging

private val logger = KotlinLogging.logger {}

@Component
class WebSocketAuthChannelInterceptor(
    private val jwtService: JwtService,
    private val userDetailsService: UserDetailsService,
) : ChannelInterceptor {

    override fun preSend(message: Message<*>, channel: MessageChannel): Message<*> {
        val accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor::class.java)
            ?: return message

        if (accessor.command == StompCommand.CONNECT) {
            val authHeader = accessor.getNativeHeader("Authorization")?.firstOrNull()
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                val token = authHeader.substring(7)
                try {
                    val username = jwtService.extractUsername(token)
                    if (username != null) {
                        val userDetails = userDetailsService.loadUserByUsername(username)
                        if (jwtService.isTokenValid(token, userDetails)) {
                            accessor.user = UsernamePasswordAuthenticationToken(
                                userDetails, null, userDetails.authorities
                            )
                            logger.debug { "WebSocket autentifikatsiya muvaffaqiyatli: $username" }
                        }
                    }
                } catch (e: Exception) {
                    logger.warn { "WebSocket JWT tekshirishda xatolik: ${e.message}" }
                }
            } else {
                logger.warn { "WebSocket ulanishi JWT tokensiz keldi" }
            }
        }
        return message
    }
}
