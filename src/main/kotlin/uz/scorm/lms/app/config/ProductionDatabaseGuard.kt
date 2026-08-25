package uz.scorm.lms.app.config

import org.flywaydb.core.api.callback.BaseCallback
import org.flywaydb.core.api.callback.Callback
import org.flywaydb.core.api.callback.Context
import org.flywaydb.core.api.callback.Event
import org.springframework.beans.factory.annotation.Value
import org.springframework.boot.hibernate.autoconfigure.HibernatePropertiesCustomizer
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.context.annotation.Profile
import javax.sql.DataSource

@Configuration(proxyBeanMethods = false)
@Profile("postgresql-prod")
class ProductionDatabaseGuard(
    private val dataSource: DataSource,
    @param:Value("\${app.database.expected-name:scorm_lms}")
    private val expectedDatabaseName: String
) {

    @Bean
    fun productionFlywayDatabaseNameGuard(): Callback =
        ProductionDatabaseNameFlywayCallback(expectedDatabaseName)

    @Bean
    fun productionDatabaseNameGuard(): HibernatePropertiesCustomizer =
        HibernatePropertiesCustomizer {
            val actualDatabaseName = dataSource.connection.use { connection ->
                connection.catalog
                    ?: error("PostgreSQL connection database nomini qaytarmadi")
            }
            requireExpectedProductionDatabase(actualDatabaseName, expectedDatabaseName)
        }
}

internal class ProductionDatabaseNameFlywayCallback(
    private val expectedDatabaseName: String,
) : BaseCallback() {

    override fun supports(event: Event, context: Context): Boolean =
        event == Event.BEFORE_VALIDATE || event == Event.BEFORE_MIGRATE

    override fun canHandleInTransaction(event: Event, context: Context): Boolean = false

    override fun handle(event: Event, context: Context) {
        val actualDatabaseName = context.connection.catalog
            ?: error("PostgreSQL connection database nomini qaytarmadi")
        requireExpectedProductionDatabase(actualDatabaseName, expectedDatabaseName)
    }

    override fun getCallbackName(): String = "productionDatabaseNameGuard"
}

internal fun requireExpectedProductionDatabase(actual: String, expected: String) {
    require(expected.matches(Regex("[A-Za-z_][A-Za-z0-9_]*"))) {
        "APP_EXPECTED_DATABASE_NAME xavfsiz PostgreSQL database nomi emas"
    }
    require(actual == expected) {
        "Noto'g'ri PostgreSQL database: '$actual'. Kutilgan database: '$expected'. " +
            "DB_URL ni jdbc:postgresql://host:port/$expected ga o'zgartiring."
    }
}
