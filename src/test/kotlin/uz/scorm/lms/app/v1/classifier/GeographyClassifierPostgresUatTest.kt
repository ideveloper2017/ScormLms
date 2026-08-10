package uz.scorm.lms.app.v1.classifier

import com.fasterxml.jackson.databind.ObjectMapper
import org.flywaydb.core.Flyway
import org.flywaydb.core.api.MigrationVersion
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable
import org.springframework.boot.WebApplicationType
import org.springframework.boot.builder.SpringApplicationBuilder
import uz.scorm.lms.app.ScromLmsProjectsApplication
import uz.scorm.lms.app.v1.classifier.repository.CountryClassifierRepository
import uz.scorm.lms.app.v1.classifier.repository.DistrictClassifierRepository
import uz.scorm.lms.app.v1.classifier.repository.RegionClassifierRepository
import uz.scorm.lms.app.v1.classifier.service.GeographyClassifierImportService
import java.nio.file.Files
import java.nio.file.Path
import java.sql.Connection
import java.sql.DriverManager
import java.time.Instant

@EnabledIfEnvironmentVariable(named = "CLASSIFIER_UAT_DB_URL", matches = "jdbc:postgresql:.*")
class GeographyClassifierPostgresUatTest {
    @Test
    fun `V52 legacy data survives V53 and bundled import is a second-run no-op`() {
        val startedAt = Instant.now()
        val url = requireEnv("CLASSIFIER_UAT_DB_URL")
        val username = requireEnv("CLASSIFIER_UAT_DB_USERNAME")
        val password = System.getenv("CLASSIFIER_UAT_DB_PASSWORD") ?: ""
        val reportPath = Path.of(System.getenv("CLASSIFIER_UAT_REPORT_PATH") ?: "build/reports/geography-classifier-postgres-uat.json").toAbsolutePath()

        val flywayV52 = flyway(url, username, password, "52")
        assertEquals("52", flywayV52.migrate().targetSchemaVersion)
        flywayV52.validate()

        val legacy = DriverManager.getConnection(url, username, password).use(::seedLegacyUatState)
        val before = DriverManager.getConnection(url, username, password).use(::classifierCounts)

        val flywayV53 = flyway(url, username, password, "53")
        assertEquals("53", flywayV53.migrate().targetSchemaVersion)
        flywayV53.validate()
        DriverManager.getConnection(url, username, password).use { connection ->
            assertEquals(1, scalar(connection, "SELECT count(*) FROM region_classifiers WHERE code = 'LOCAL-UAT'"))
            assertEquals(1, scalar(connection, "SELECT count(*) FROM district_classifiers WHERE code = 'LOCAL-UAT-D'"))
        }

        val context = SpringApplicationBuilder(ScromLmsProjectsApplication::class.java)
            .profiles("postgresql-dev")
            .web(WebApplicationType.NONE)
            .run(
                "--spring.datasource.url=$url",
                "--spring.datasource.username=$username",
                "--spring.datasource.password=$password",
                "--spring.datasource.driver-class-name=org.postgresql.Driver",
                "--spring.flyway.enabled=false",
                "--spring.jpa.hibernate.ddl-auto=validate",
                "--spring.jpa.show-sql=false",
                "--spring.devtools.restart.enabled=false",
                "--spring.jmx.enabled=false",
                "--app.integration.worker.enabled=false",
                "--app.hemis.sync.enabled=false",
                "--app.hemis.sync.async-enabled=false",
                "--logging.level.org.hibernate.SQL=OFF",
                "--logging.level.org.springframework=WARN",
            )
        try {
            val service = context.getBean(GeographyClassifierImportService::class.java)
            assertFalse(service.status().current)
            val first = service.importBundledDataset(UAT_ACTOR_ID)
            val second = service.importBundledDataset(UAT_ACTOR_ID)

            val countryRepo = context.getBean(CountryClassifierRepository::class.java)
            val regionRepo = context.getBean(RegionClassifierRepository::class.java)
            val districtRepo = context.getBean(DistrictClassifierRepository::class.java)
            val namanganAfter = requireNotNull(regionRepo.findByCode("UZ-NG"))
            val mingbuloqAfter = requireNotNull(districtRepo.findByCode("UZ-NG-MIN"))
            val after = DriverManager.getConnection(url, username, password).use(::classifierCounts)
            val databaseState = DriverManager.getConnection(url, username, password).use { connection ->
                connection.prepareStatement("SELECT permanent_region_id, permanent_district_id FROM students WHERE id = ?").use { statement ->
                    statement.setLong(1, legacy.studentId)
                    statement.executeQuery().use { rows ->
                        check(rows.next()) { "UAT student topilmadi" }
                        val studentFk = rows.getLong(1) to rows.getLong(2)
                        val localRegion = localRowState(connection, "region_classifiers", "LOCAL-UAT")
                        val localDistrict = localRowState(connection, "district_classifiers", "LOCAL-UAT-D")
                        DatabaseState(studentFk, localRegion, localDistrict)
                    }
                }
            }

            assertEquals(249, countryRepo.findAllByManagedSource("ISO_3166_1").size)
            assertEquals(14, regionRepo.findAllByManagedSource("SOATO").size)
            assertEquals(206, districtRepo.findAllByManagedSource("SOATO").size)
            assertEquals(legacy.namanganRegionId, namanganAfter.id)
            assertEquals(legacy.mingbuloqDistrictId, mingbuloqAfter.id)
            assertEquals(legacy.namanganRegionId to legacy.mingbuloqDistrictId, databaseState.studentFk)
            assertTrue(databaseState.localRegion.active && databaseState.localDistrict.active)
            assertEquals(null, databaseState.localRegion.managedSource)
            assertEquals(469, second.lastRun?.unchangedCount)
            assertEquals(0, second.lastRun?.createdCount)
            assertEquals(0, second.lastRun?.updatedCount)
            assertEquals(0, second.lastRun?.deactivatedCount)

            val report = linkedMapOf<String, Any?>(
                "outcome" to "VERIFIED",
                "startedAt" to startedAt.toString(),
                "finishedAt" to Instant.now().toString(),
                "database" to mapOf("urlWithoutCredentials" to url, "product" to "PostgreSQL", "disposable" to true),
                "migration" to mapOf("legacyVersion" to "52", "targetVersion" to "53", "validated" to true),
                "dataset" to mapOf(
                    "id" to first.datasetId,
                    "version" to first.datasetVersion,
                    "manifestSha256" to first.manifestSha256,
                    "countries" to first.countriesTotal,
                    "regions" to first.regionsTotal,
                    "districts" to first.districtsTotal,
                ),
                "countsBeforeImport" to before,
                "countsAfterImport" to after,
                "firstImport" to first.lastRun,
                "secondImport" to second.lastRun,
                "legacyPreservation" to mapOf(
                    "studentId" to legacy.studentId,
                    "namanganRegionIdBefore" to legacy.namanganRegionId,
                    "namanganRegionIdAfter" to namanganAfter.id,
                    "mingbuloqDistrictIdBefore" to legacy.mingbuloqDistrictId,
                    "mingbuloqDistrictIdAfter" to mingbuloqAfter.id,
                    "studentForeignKeysPreserved" to true,
                ),
                "localAdminRows" to mapOf("regionActive" to databaseState.localRegion.active, "districtActive" to databaseState.localDistrict.active, "managedSourceRemainsNull" to true),
                "checks" to listOf(
                    "V52_TO_V53_MIGRATION_VALID",
                    "OFFICIAL_COUNTS_249_14_206",
                    "LEGACY_IDS_PRESERVED",
                    "STUDENT_FKS_PRESERVED",
                    "LOCAL_ROWS_PRESERVED",
                    "SECOND_IMPORT_NO_OP",
                ),
            )
            Files.createDirectories(reportPath.parent)
            context.getBean(ObjectMapper::class.java).writerWithDefaultPrettyPrinter().writeValue(reportPath.toFile(), report)
            assertTrue(Files.size(reportPath) > 0)
        } finally {
            context.close()
        }
    }

    private fun flyway(url: String, username: String, password: String, target: String) = Flyway.configure()
        .dataSource(url, username, password)
        .locations("classpath:db/migration")
        .baselineOnMigrate(false)
        .target(MigrationVersion.fromVersion(target))
        .load()

    private fun seedLegacyUatState(connection: Connection): LegacyState {
        val namanganId = scalar(connection, "SELECT id FROM region_classifiers WHERE code = 'UZ-NG'")
        val mingbuloqId = scalar(connection, "SELECT id FROM district_classifiers WHERE code = 'UZ-NG-MIN'")
        val localRegionId = returningId(connection, "INSERT INTO region_classifiers(code, name_uz, sort_order) VALUES ('LOCAL-UAT', 'UAT mahalliy hudud', 999) RETURNING id")
        returningId(connection, "INSERT INTO district_classifiers(code, name_uz, region_id, sort_order) VALUES ('LOCAL-UAT-D', 'UAT mahalliy tuman', $localRegionId, 1) RETURNING id")
        val userId = returningId(connection, "INSERT INTO users(username, password_hash, status, deleted) VALUES ('classifier_uat_student', 'not-a-login-password', 'ACTIVE', false) RETURNING id")
        val studentId = returningId(connection, """
            INSERT INTO students(
                user_id, pinfl, last_name, first_name, birth_date, gender, citizenship,
                student_number, degree_level, education_form, student_status,
                permanent_region, permanent_district, permanent_region_id, permanent_district_id
            ) VALUES (
                $userId, '99010199999999', 'UAT', 'Talaba', DATE '1999-01-01', 'MALE', 'UZBEKISTAN',
                'UAT-CLASSIFIER-001', 'BACHELOR', 'DISTANCE', 'REGISTERED',
                'Namangan viloyati', 'Mingbuloq tumani', $namanganId, $mingbuloqId
            ) RETURNING id
        """.trimIndent())
        return LegacyState(studentId, namanganId, mingbuloqId)
    }

    private fun classifierCounts(connection: Connection) = mapOf(
        "countries" to scalar(connection, "SELECT count(*) FROM country_classifiers WHERE deleted = false"),
        "regions" to scalar(connection, "SELECT count(*) FROM region_classifiers WHERE deleted = false"),
        "districts" to scalar(connection, "SELECT count(*) FROM district_classifiers WHERE deleted = false"),
    )

    private fun scalar(connection: Connection, sql: String): Long = connection.createStatement().use { statement ->
        statement.executeQuery(sql).use { rows -> check(rows.next()); rows.getLong(1) }
    }

    private fun returningId(connection: Connection, sql: String): Long = scalar(connection, sql)
    private fun localRowState(connection: Connection, table: String, code: String): LocalRowState {
        require(table in setOf("region_classifiers", "district_classifiers"))
        connection.prepareStatement("SELECT active, managed_source FROM $table WHERE code = ?").use { statement ->
            statement.setString(1, code)
            statement.executeQuery().use { rows ->
                check(rows.next()) { "Local UAT klassifikatori topilmadi: $table/$code" }
                return LocalRowState(rows.getBoolean(1), rows.getString(2))
            }
        }
    }
    private fun requireEnv(name: String) = requireNotNull(System.getenv(name)) { "$name majburiy" }
    private data class LegacyState(val studentId: Long, val namanganRegionId: Long, val mingbuloqDistrictId: Long)
    private data class LocalRowState(val active: Boolean, val managedSource: String?)
    private data class DatabaseState(val studentFk: Pair<Long, Long>, val localRegion: LocalRowState, val localDistrict: LocalRowState)

    companion object { const val UAT_ACTOR_ID = 9_000_001L }
}
