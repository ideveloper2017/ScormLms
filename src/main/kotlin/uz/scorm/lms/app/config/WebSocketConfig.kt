package uz.scorm.lms.app.config

import org.springframework.context.annotation.Configuration
import org.springframework.messaging.simp.config.ChannelRegistration
import org.springframework.messaging.simp.config.MessageBrokerRegistry
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker
import org.springframework.web.socket.config.annotation.StompEndpointRegistry
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer

@Configuration
@EnableWebSocketMessageBroker
class WebSocketConfig(
    private val authChannelInterceptor: WebSocketAuthChannelInterceptor,
) : WebSocketMessageBrokerConfigurer {

    override fun configureMessageBroker(config: MessageBrokerRegistry) {
        // Foydalanuvchiga xabar yuborish uchun /topic va /queue yo'llari
        config.enableSimpleBroker("/topic", "/queue")
        // Serverga keluvchi STOMP xabarlar uchun prefix
        config.setApplicationDestinationPrefixes("/app")
        // Foydalanuvchiga shaxsiy xabar yuborish prefiksi
        config.setUserDestinationPrefix("/user")
    }

    override fun registerStompEndpoints(registry: StompEndpointRegistry) {
        // Native WebSocket endpoint — SockJS ishlatilmaydi (zamonaviy brauzerlar uchun)
        registry.addEndpoint("/ws")
            .setAllowedOriginPatterns("*")
    }

    override fun configureClientInboundChannel(registration: ChannelRegistration) {
        // JWT autentifikatsiyasini STOMP CONNECT frameda bajaramiz
        registration.interceptors(authChannelInterceptor)
    }
}
