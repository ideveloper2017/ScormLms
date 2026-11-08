package uz.scorm.lms.app.config

import org.slf4j.LoggerFactory
import org.springframework.boot.context.event.ApplicationPreparedEvent
import org.springframework.context.ApplicationListener
import org.springframework.core.env.Environment
import java.sql.DriverManager
import java.sql.SQLException

/**
 * Ilova ishga tushganda PostgreSQL bazasi (DB_URL dagi nom) yo'q bo'lsa, uni yaratadi — keyin Flyway odatdagidek
 * jadvallarni quradi. Flyway bazaning o'zini yarata olmaydi, shuning uchun bu qadam alohida.
 *
 * DataSource yaratilishidan oldin (ApplicationPreparedEvent) `postgres` xizmat bazasiga shu foydalanuvchi bilan ulanadi.
 * Foydalanuvchida CREATEDB huquqi bo'lmasa yoki ulanib bo'lmasa — faqat tushunarli ogohlantirish yoziladi, ilova
 * davom etadi (keyingi xato DataSource'dan chiqadi). DB_AUTO_CREATE=false bilan o'chiriladi.
 * META-INF/spring.factories orqali ro'yxatdan o'tadi.
 */
class DatabaseAutoCreateListener : ApplicationListener<ApplicationPreparedEvent> {
    private val log = LoggerFactory.getLogger(DatabaseAutoCreateListener::class.java)

    override fun onApplicationEvent(event: ApplicationPreparedEvent) {
        val env: Environment = event.applicationContext.environment
        if (!env.getProperty("app.database.auto-create", Boolean::class.java, true)) return
        val url = env.getProperty("spring.datasource.url") ?: return
        val target = parsePostgresUrl(url) ?: run {
            log.debug("DB_URL PostgreSQL formatida emas, baza avtomatik yaratilmaydi: {}", url)
            return
        }
        val user = env.getProperty("spring.datasource.username").orEmpty()
        val password = env.getProperty("spring.datasource.password").orEmpty()
        try {
            DriverManager.getConnection(target.maintenanceUrl, user, password).use { connection ->
                val exists = connection.prepareStatement("SELECT 1 FROM pg_database WHERE datname = ?").use { statement ->
                    statement.setString(1, target.database)
                    statement.executeQuery().use { it.next() }
                }
                if (exists) {
                    log.debug("PostgreSQL bazasi '{}' mavjud", target.database)
                    return
                }
                // Nom tekshirilgan identifikator (parsePostgresUrl) — SQL in'ektsiya xavfi yo'q
                connection.createStatement().use { it.executeUpdate("CREATE DATABASE \"${target.database}\"") }
                log.info("PostgreSQL bazasi '{}' yaratildi ({}); jadvallarni Flyway quradi", target.database, target.hostPort)
            }
        } catch (e: SQLException) {
            log.warn(
                "PostgreSQL bazasi '{}' ni avtomatik yaratib bo'lmadi ({}): {}. Qo'lda: sudo -u postgres createdb --owner {} {} " +
                    "yoki foydalanuvchiga huquq bering: ALTER ROLE {} CREATEDB;",
                target.database, target.hostPort, e.message?.lineSequence()?.firstOrNull(), user, target.database, user,
            )
        }
    }
}

/** DB_URL dan host:port, baza nomi va `postgres` xizmat bazasiga ulanish manzili */
internal data class PostgresTarget(val hostPort: String, val database: String, val maintenanceUrl: String)

private val POSTGRES_URL = Regex("^jdbc:postgresql://([^/?]+)/([A-Za-z_][A-Za-z0-9_]*)(\\?.*)?$")

/** `jdbc:postgresql://host:5432/scorm_lms?currentSchema=public` -> host:5432, scorm_lms, `.../postgres?...` */
internal fun parsePostgresUrl(url: String): PostgresTarget? {
    val match = POSTGRES_URL.find(url.trim()) ?: return null
    val (hostPort, database, query) = match.destructured
    // currentSchema maqsad bazaga tegishli — xizmat bazasiga ulanishda olib tashlanadi
    val params = query.removePrefix("?").split('&').filter { it.isNotBlank() && !it.startsWith("currentSchema=") }
    val maintenanceQuery = (params + "loginTimeout=5").joinToString("&", prefix = "?")
    return PostgresTarget(hostPort, database, "jdbc:postgresql://$hostPort/postgres$maintenanceQuery")
}
