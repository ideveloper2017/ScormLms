package uz.scorm.lms.app

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.builder.SpringApplicationBuilder
import org.springframework.boot.runApplication
import org.springframework.boot.web.servlet.support.SpringBootServletInitializer

@SpringBootApplication
class ScromLmsProjectsApplication : SpringBootServletInitializer() {

    override fun configure(application: SpringApplicationBuilder): SpringApplicationBuilder {
        return application.sources(ScromLmsProjectsApplication::class.java)
    }
}

fun main(args: Array<String>) {
    runApplication<ScromLmsProjectsApplication>(*args)
}
