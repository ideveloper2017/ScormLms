package uz.scorm.lms.app.config

import io.swagger.v3.oas.models.Components
import io.swagger.v3.oas.models.OpenAPI
import io.swagger.v3.oas.models.info.Info
import io.swagger.v3.oas.models.security.OAuthFlow
import io.swagger.v3.oas.models.security.OAuthFlows
import io.swagger.v3.oas.models.security.Scopes
import io.swagger.v3.oas.models.security.SecurityRequirement
import io.swagger.v3.oas.models.security.SecurityScheme
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
class OpenApiConfig {
    val securitySchemeName = "hemisOAuth"
    @Bean
    fun customOpenAPI(): OpenAPI {
        val bearerSchemeName = "bearerAuth"
        val securityScheme = SecurityScheme()
            .type(SecurityScheme.Type.HTTP)
            .scheme("bearer")
            .bearerFormat("JWT")
            .description("Provide the JWT access token. Example: Bearer eyJhbGciOi...")

        val securityRequirement = SecurityRequirement().addList(bearerSchemeName)

        return OpenAPI()
            .info(
                Info()
                    .title("Scrom LMS API")
                    .description("API documentation for Scrom LMS with JWT authentication")
                    .version("v1")
            )
            .components(Components().addSecuritySchemes(bearerSchemeName, securityScheme))
            .components(
                Components().addSecuritySchemes(
                    securitySchemeName,
                    SecurityScheme()
                        .type(SecurityScheme.Type.OAUTH2)
                        .flows(
                            OAuthFlows().authorizationCode(
                                OAuthFlow()
                                    .authorizationUrl("https://hemis.namdtu.uz/oauth/authorize")
                                    .tokenUrl("https://hemis.namdtu.uz/oauth/access-token")
                                    .scopes(
                                        Scopes().addString("openid", "OpenID Connect scope")
                                            .addString("profile", "User profile")
                                            .addString("email", "User email")
                                    )
                            )
                        )
                )
            )
            .addSecurityItem(securityRequirement)
    }
}
