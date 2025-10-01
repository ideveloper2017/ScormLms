//package uz.scorm.lms.app.config
//
//import io.swagger.v3.oas.models.Components
//import io.swagger.v3.oas.models.OpenAPI
//import io.swagger.v3.oas.models.info.Info
//import io.swagger.v3.oas.models.security.OAuthFlow
//import io.swagger.v3.oas.models.security.OAuthFlows
//import io.swagger.v3.oas.models.security.Scopes
//import io.swagger.v3.oas.models.security.SecurityRequirement
//import io.swagger.v3.oas.models.security.SecurityScheme
//import org.springframework.context.annotation.Bean
//import org.springframework.context.annotation.Configuration
//
//@Configuration
//class SwaggerConfig {
//
//    @Bean
//    fun customOpenAPI(): OpenAPI {
//        val securitySchemeName = "hemisOAuth"
//
//        return OpenAPI()
//            .info(
//                Info()
//                    .title("HEMIS OAuth API")
//                    .version("1.0.0")
//                    .description("Swagger orqali HEMIS OAuth2 login va foydalanuvchi ma’lumotlarini olish")
//            )
//            .components(
//                Components().addSecuritySchemes(
//                    securitySchemeName,
//                    SecurityScheme()
//                        .type(SecurityScheme.Type.OAUTH2)
//                        .flows(
//                            OAuthFlows().authorizationCode(
//                                OAuthFlow()
//                                    .authorizationUrl("https://univer.hemis.uz/oauth/authorize")
//                                    .tokenUrl("https://univer.hemis.uz/oauth/access-token")
//                                    .scopes(
//                                        Scopes().addString("openid", "OpenID Connect scope")
//                                                .addString("profile", "User profile")
//                                                .addString("email", "User email")
//                                    )
//                            )
//                        )
//                )
//            )
//            .addSecurityItem(SecurityRequirement().addList(securitySchemeName))
//    }
//}
