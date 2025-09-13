package uz.scorm.lms.app.config

import io.netty.handler.ssl.SslContextBuilder
import io.netty.handler.ssl.util.InsecureTrustManagerFactory
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.http.client.reactive.ReactorClientHttpConnector
import org.springframework.web.reactive.function.client.WebClient
import org.springframework.web.reactive.function.client.ExchangeStrategies
import reactor.netty.http.client.HttpClient
import java.time.Duration


@Configuration
class WebClientConfig {
    @Bean
    fun webClient(): WebClient {
        val tlsContext = SslContextBuilder
            .forClient()
            .trustManager(InsecureTrustManagerFactory.INSTANCE)
            .build()

        val httpClient = HttpClient.create()
            .secure { spec ->
                spec.sslContext(tlsContext)
            }
            .responseTimeout(Duration.ofSeconds(30))
            .wiretap(true)  // Enable wiretap logging

        // Increase memory size for large responses
        val strategies = ExchangeStrategies.builder()
            .codecs { configurer ->
                configurer.defaultCodecs().maxInMemorySize(16 * 1024 * 1024) // 16MB
            }
            .build()

        return WebClient.builder()
            .clientConnector(ReactorClientHttpConnector(httpClient))
            .exchangeStrategies(strategies)
            .build()
    }
}