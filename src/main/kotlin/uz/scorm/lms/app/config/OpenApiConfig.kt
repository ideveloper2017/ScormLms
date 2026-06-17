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

        val bearerScheme = SecurityScheme()
            .type(SecurityScheme.Type.HTTP)
            .scheme("bearer")
            .bearerFormat("JWT")
            .description("Provide the JWT access token. Example: Bearer eyJhbGciOi...")

        val hemisOAuthScheme = SecurityScheme()
            .type(SecurityScheme.Type.OAUTH2)
            .flows(
                OAuthFlows().authorizationCode(
                    OAuthFlow()
                        .authorizationUrl("https://hemis.namdtu.uz/oauth/authorize")
                        .tokenUrl("https://hemis.namdtu.uz/oauth/access-token")
                        .scopes(
                            Scopes()
                                .addString("openid", "OpenID Connect scope")
                                .addString("profile", "User profile")
                                .addString("email", "User email")
                        )
                )
            )

        return OpenAPI()
            .info(
                Info()
                    .title("Scorm LMS API")
                    .description("API documentation for Scorm LMS with JWT authentication")
                    .version("v1")
            )
            .components(
                Components()
                    .addSecuritySchemes(bearerSchemeName, bearerScheme)
                    .addSecuritySchemes(securitySchemeName, hemisOAuthScheme)
            )
            .addSecurityItem(SecurityRequirement().addList(bearerSchemeName))
            .addSecurityItem(SecurityRequirement().addList(securitySchemeName))
    }
}
