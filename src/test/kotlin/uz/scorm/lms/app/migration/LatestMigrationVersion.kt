package uz.scorm.lms.app.migration

import java.io.File

/**
 * db/migration dagi eng katta Flyway versiyasi. Testlarda qotirib yozilgan versiya har yangi
 * migratsiyadan keyin CI'ni yiqitardi (masalan "expected 71 but was 77").
 */
val latestMigrationVersion: String by lazy {
    val directory = requireNotNull(Thread.currentThread().contextClassLoader.getResource("db/migration")) {
        "classpath:db/migration topilmadi"
    }
    File(directory.toURI()).list().orEmpty()
        .mapNotNull { Regex("^V(\\d+)__.+\\.sql$").find(it)?.groupValues?.get(1)?.toInt() }
        .max()
        .toString()
}
