package uz.scorm.lms.app.v1.scorm

import tools.jackson.databind.ObjectMapper
import io.mockk.every
import io.mockk.mockk
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.junit.jupiter.api.io.TempDir
import org.springframework.mock.web.MockMultipartFile
import uz.scorm.lms.app.v1.courses.model.Course
import uz.scorm.lms.app.v1.courses.repository.CourseRepository
import uz.scorm.lms.app.v1.scorm.dto.ScormRuntimeUpdateRequest
import uz.scorm.lms.app.v1.scorm.model.ScormAttempt
import uz.scorm.lms.app.v1.scorm.model.ScormAttemptStatus
import uz.scorm.lms.app.v1.scorm.model.ScormPackage
import uz.scorm.lms.app.v1.scorm.model.ScormPackageStatus
import uz.scorm.lms.app.v1.scorm.model.ScormVersion
import uz.scorm.lms.app.v1.scorm.repository.ScormAttemptRepository
import uz.scorm.lms.app.v1.scorm.repository.ScormPackageRepository
import uz.scorm.lms.app.v1.scorm.service.ScormService
import java.io.ByteArrayOutputStream
import java.nio.file.Files
import java.nio.file.Path
import java.util.Optional
import java.util.zip.ZipEntry
import java.util.zip.ZipOutputStream

class ScormServiceTest {

    @TempDir
    lateinit var tempDir: Path

    private val courseRepository = mockk<CourseRepository>()
    private val packageRepository = mockk<ScormPackageRepository>()
    private val attemptRepository = mockk<ScormAttemptRepository>()
    private val objectMapper = ObjectMapper()

    @Test
    fun `SCORM 1_2 paket manifestdan import qilinadi`() {
        val service = service()
        prepareImportRepositories()

        val result = service.importPackage(
            courseId = 1,
            file = packageFile(manifest("1.2")),
            importerId = 7,
            importedBy = "teacher",
            mayManageAllCourses = false,
        )

        assertEquals(ScormVersion.SCORM_1_2, result.version)
        assertEquals("index.html", result.entryPoint)
        assertEquals("Test kurs", result.title)
        assertTrue(Files.exists(tempDir.resolve(findStorageDirectory()).resolve("index.html")))
    }

    @Test
    fun `SCORM 2004 paket versiyasi aniqlanadi`() {
        val service = service()
        prepareImportRepositories()

        val result = service.importPackage(1, packageFile(manifest("2004 4th Edition")), 7, "teacher", false)

        assertEquals(ScormVersion.SCORM_2004, result.version)
    }

    @Test
    fun `boshqa oqituvchining kursiga paket yuklash bloklanadi`() {
        val service = service()
        every { courseRepository.findById(1) } returns Optional.of(course(userId = 99))

        val error = assertThrows<IllegalArgumentException> {
            service.importPackage(1, packageFile(manifest("1.2")), 7, "teacher", false)
        }

        assertTrue(error.message.orEmpty().contains("o'zingizga biriktirilgan"))
    }

    @Test
    fun `Zip Slip yoliga yozish bloklanadi`() {
        val service = service()
        prepareImportRepositories()
        val file = zipFile(mapOf(
            "imsmanifest.xml" to manifest("1.2"),
            "../outside.html" to "x",
            "index.html" to "<html></html>",
        ))

        val error = assertThrows<IllegalArgumentException> {
            service.importPackage(1, file, 7, "teacher", false)
        }

        assertTrue(error.message.orEmpty().contains("xavfli yo'l"))
        assertTrue(Files.notExists(tempDir.resolve("outside.html")))
    }

    @Test
    fun `manifestsiz ZIP paket rad etiladi`() {
        val service = service()
        prepareImportRepositories()

        val error = assertThrows<IllegalArgumentException> {
            service.importPackage(1, zipFile(mapOf("index.html" to "<html></html>")), 7, "teacher", false)
        }

        assertTrue(error.message.orEmpty().contains("imsmanifest.xml topilmadi"))
    }

    @Test
    fun `paket hajmi belgilangan limitdan oshmaydi`() {
        val service = service(maxPackageBytes = 100)
        val largeFile = MockMultipartFile("file", "large.zip", "application/zip", ByteArray(101))

        val error = assertThrows<IllegalArgumentException> {
            service.importPackage(1, largeFile, 7, "teacher", false)
        }

        assertTrue(error.message.orEmpty().contains("limitdan katta"))
    }

    @Test
    fun `runtime score progress status va vaqtni saqlaydi hamda vaqtni takrorlamaydi`() {
        val service = service()
        val scormPackage = scormPackage().apply { id = 10 }
        val attempt = ScormAttempt(scormPackage, userId = 42).apply {
            id = 20
            status = ScormAttemptStatus.IN_PROGRESS
        }
        every { attemptRepository.findById(20) } returns Optional.of(attempt)
        every { attemptRepository.save(any()) } answers { firstArg() }

        val first = service.updateRuntime(20, 42, ScormRuntimeUpdateRequest(values = mapOf(
            "cmi.score.raw" to "87.5",
            "cmi.progress_measure" to "0.75",
            "cmi.completion_status" to "completed",
            "cmi.session_time" to "PT1M30S",
        )))
        val second = service.updateRuntime(20, 42, ScormRuntimeUpdateRequest(values = emptyMap()))

        assertEquals(87.5, first.scoreRaw)
        assertEquals(0.75, first.progressMeasure)
        assertEquals(ScormAttemptStatus.COMPLETED, first.status)
        assertEquals(90, first.totalTimeSeconds)
        assertEquals(90, second.totalTimeSeconds)
    }

    @Test
    fun `boshqa foydalanuvchining runtime urinishiga kirish bloklanadi`() {
        val service = service()
        val attempt = ScormAttempt(scormPackage().apply { id = 10 }, userId = 42).apply { id = 20 }
        every { attemptRepository.findById(20) } returns Optional.of(attempt)

        assertThrows<IllegalArgumentException> {
            service.updateRuntime(20, 99, ScormRuntimeUpdateRequest())
        }
    }

    private fun service(maxPackageBytes: Long = 5_000_000): ScormService = ScormService(
        courseRepository = courseRepository,
        packageRepository = packageRepository,
        attemptRepository = attemptRepository,
        objectMapper = objectMapper,
        storageDir = tempDir.toString(),
        maxPackageBytes = maxPackageBytes,
    )

    private fun prepareImportRepositories() {
        every { courseRepository.findById(1) } returns Optional.of(course())
        every { packageRepository.save(any()) } answers {
            firstArg<ScormPackage>().apply { id = 10 }
        }
    }

    private fun course(userId: Long = 7) = Course(title = "Kurs", userId = userId).apply { id = 1 }

    private fun scormPackage() = ScormPackage(
        course = course(),
        title = "Test kurs",
        version = ScormVersion.SCORM_2004,
        manifestIdentifier = "manifest-1",
        entryPoint = "index.html",
        storageKey = "storage-key",
        sha256 = "a".repeat(64),
        status = ScormPackageStatus.READY,
        importedBy = "teacher",
    )

    private fun packageFile(manifest: String) = zipFile(mapOf(
        "imsmanifest.xml" to manifest,
        "index.html" to "<html><body>SCORM</body></html>",
    ))

    private fun zipFile(entries: Map<String, String>): MockMultipartFile {
        val bytes = ByteArrayOutputStream().use { output ->
            ZipOutputStream(output).use { zip ->
                entries.forEach { (name, content) ->
                    zip.putNextEntry(ZipEntry(name))
                    zip.write(content.toByteArray())
                    zip.closeEntry()
                }
            }
            output.toByteArray()
        }
        return MockMultipartFile("file", "course.zip", "application/zip", bytes)
    }

    private fun manifest(version: String) = """
        <?xml version="1.0" encoding="UTF-8"?>
        <manifest identifier="manifest-1" xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2">
          <metadata><schemaversion>$version</schemaversion></metadata>
          <organizations><organization identifier="org-1"><title>Test kurs</title></organization></organizations>
          <resources><resource identifier="res-1" type="webcontent" href="index.html" /></resources>
        </manifest>
    """.trimIndent()

    private fun findStorageDirectory(): String = Files.list(tempDir).use { paths ->
        paths.filter(Files::isDirectory).findFirst().orElseThrow().fileName.toString()
    }
}
