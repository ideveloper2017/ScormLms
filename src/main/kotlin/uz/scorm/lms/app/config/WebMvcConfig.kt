package uz.scorm.lms.app.config

import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Configuration
import org.springframework.web.method.support.HandlerMethodArgumentResolver
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer
import uz.scorm.lms.app.security.CurrentUserArgumentResolver
import java.nio.file.Paths

@Configuration
class WebMvcConfig(
    private val currentUserArgumentResolver: CurrentUserArgumentResolver,
    @Value("\${file.upload-dir:./uploads}") private val uploadDir: String
) : WebMvcConfigurer {

    override fun addArgumentResolvers(resolvers: MutableList<HandlerMethodArgumentResolver>) {
        resolvers.add(currentUserArgumentResolver)
    }

    override fun addResourceHandlers(registry: ResourceHandlerRegistry) {
        // Serve uploaded files (including face photos) from /uploads/**
        val uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize().toString()
        registry.addResourceHandler("/uploads/**")
            .addResourceLocations("file:$uploadPath/")
    }
}