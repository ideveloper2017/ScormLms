package uz.scorm.lms.app.config

import org.springframework.boot.WebApplicationType
import org.springframework.boot.builder.SpringApplicationBuilder
import org.springframework.context.annotation.Configuration
import org.springframework.core.env.ConfigurableEnvironment
import kotlin.test.Test
import uz.scorm.lms.app.security.jwtSecretProblem
import kotlin.test.assertEquals
import kotlin.test.assertNull
import kotlin.test.assertTrue

/**
 * `postgresql-prod` profili hech qanday env fayl/o'zgaruvchisiz ham ishga tushishi uchun standart qiymatlarga
 * ega bo'lishi kerak. Bu test haqiqiy yml fayllarni bean'siz Spring muhitiga yuklab, standartlar hal bo'lishini va
 * JWT kaliti talablariga javob berishini tekshiradi (baza/Docker kerak emas).
 */
class ProductionProfileDefaultsTest {

    private val MIN_HMAC_SECRET_BYTES = 64

    @Configuration(proxyBeanMethods = false)
    class NoBeans

    private fun <T> withProdEnvironment(vararg args: String, block: (ConfigurableEnvironment) -> T): T =
        SpringApplicationBuilder(NoBeans::class.java)
            .web(WebApplicationType.NONE)
            .run(
                "--spring.profiles.active=postgresql-prod",
                "--LOG_FILE=build/test-logs/production-defaults.log",
                *args,
            )
            .use { block(it.environment) }

    private fun ConfigurableEnvironment.required(name: String): String =
        requireNotNull(getProperty(name)) { "$name hal bo'lmadi" }

    @Test
    fun `production secrets resolve without any env and pass the production guard`() {
        withProdEnvironment { env ->
            val jwt = env.required("app.jwt.secret")
            val survey = env.required("app.survey.anonymization-secret")
            val dbPassword = env.required("spring.datasource.password")

            // Standart JWT kaliti yaroqli bo'lishi kerak: aks holda JwtService har safar ogohlantirish berardi
            assertNull(jwtSecretProblem(jwt, production = true))
            assertTrue(survey.toByteArray().size >= MIN_HMAC_SECRET_BYTES)
            assertTrue(dbPassword.isNotBlank())
        }
    }

    @Test
    fun `survey anonymization secret is stable across reads so restarts keep respondent hashes`() {
        withProdEnvironment { env ->
            assertEquals(
                env.required("app.survey.anonymization-secret"),
                env.required("app.survey.anonymization-secret"),
            )
        }
    }

    @Test
    fun `database defaults point to the local scorm_lms database`() {
        withProdEnvironment { env ->
            val url = env.required("spring.datasource.url")
            assertTrue(url.startsWith("jdbc:postgresql://"), url)
            assertTrue(url.endsWith("/scorm_lms"), url)
        }
    }

    @Test
    fun `default cors origin is explicit so SecurityConfig starts`() {
        withProdEnvironment { env ->
            val origins = env.required("app.cors.allowed-origins").split(',').map(String::trim).filter(String::isNotBlank)
            assertTrue(origins.isNotEmpty())
            assertTrue(origins.none { it == "*" })
            assertTrue(origins.all { it.startsWith("http://") || it.startsWith("https://") })
        }
    }

    @Test
    fun `all storage directories default under the tomcat base directory`() {
        withProdEnvironment("--catalina.base=/srv/tomcat") { env ->
            val dataDir = "/srv/tomcat/scorm-lms-data"
            assertEquals(dataDir, env.required("app.data-dir"))
            listOf(
                "app.upload.dir",
                "file.upload-dir",
                "app.face.model-dir",
                "app.scorm.storage-dir",
                "app.assignment.storage-dir",
                "app.course-content.storage-dir",
                "uat.private-storage-dir",
            ).forEach { name ->
                assertTrue(env.required(name).startsWith("$dataDir/"), "$name = ${env.required(name)}")
            }
        }
    }

    @Test
    fun `short postgres profile name is an alias that loads production settings`() {
        SpringApplicationBuilder(NoBeans::class.java)
            .web(WebApplicationType.NONE)
            .run("--spring.profiles.active=postgres", "--LOG_FILE=build/test-logs/production-defaults.log")
            .use { context ->
                val env = context.environment
                assertTrue("postgresql-prod" in env.activeProfiles, env.activeProfiles.joinToString())
                assertTrue(env.required("app.jwt.secret").toByteArray().size >= MIN_HMAC_SECRET_BYTES)
                assertTrue(env.required("spring.datasource.url").endsWith("/scorm_lms"))
                assertTrue(env.required("app.data-dir").endsWith("scorm-lms-data"))
            }
    }

    @Test
    fun `explicit environment values still override the defaults`() {
        val jwt = "k".repeat(80)
        withProdEnvironment(
            "--JWT_SECRET=$jwt",
            "--DB_PASSWORD=Another-Strong-Db-Pass",
            "--CORS_ALLOWED_ORIGINS=https://lms.example.uz",
            "--APP_DATA_DIR=/data/lms",
            "--FILE_UPLOAD_DIR=/data/custom-uploads",
        ) { env ->
            assertEquals(jwt, env.required("app.jwt.secret"))
            assertEquals(jwt, env.required("app.survey.anonymization-secret"))
            assertEquals("Another-Strong-Db-Pass", env.required("spring.datasource.password"))
            assertEquals("https://lms.example.uz", env.required("app.cors.allowed-origins"))
            assertEquals("/data/lms", env.required("app.data-dir"))
            assertEquals("/data/custom-uploads", env.required("app.upload.dir"))
            assertEquals("/data/lms/scorm", env.required("app.scorm.storage-dir"))
        }
    }
}
