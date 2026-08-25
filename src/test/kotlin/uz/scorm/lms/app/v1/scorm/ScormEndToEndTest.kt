package uz.scorm.lms.app.v1.scorm

import tools.jackson.databind.ObjectMapper
import jakarta.transaction.Transactional
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.io.TempDir
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.core.io.ClassPathResource
import org.springframework.mock.web.MockMultipartFile
import org.springframework.test.context.ActiveProfiles
import uz.scorm.lms.app.v1.courses.model.Course
import uz.scorm.lms.app.v1.courses.repository.CourseRepository
import uz.scorm.lms.app.v1.scorm.dto.ScormRuntimeUpdateRequest
import uz.scorm.lms.app.v1.scorm.model.ScormAttemptStatus
import uz.scorm.lms.app.v1.scorm.model.ScormVersion
import uz.scorm.lms.app.v1.scorm.repository.ScormAttemptRepository
import uz.scorm.lms.app.v1.scorm.repository.ScormPackageRepository
import uz.scorm.lms.app.v1.scorm.service.ScormService
import java.io.ByteArrayOutputStream
import java.nio.file.Path
import java.util.zip.ZipEntry
import java.util.zip.ZipOutputStream

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class ScormEndToEndTest {

    @Autowired
    private lateinit var courseRepository: CourseRepository

    @Autowired
    private lateinit var packageRepository: ScormPackageRepository

    @Autowired
    private lateinit var attemptRepository: ScormAttemptRepository

    @Autowired
    private lateinit var objectMapper: ObjectMapper

    @TempDir
    lateinit var storageDir: Path

    @Test
    fun `SCORM 1_2 import launch commit finish va qayta ochish oqimi ishlaydi`() {
        val scenario = Scenario(
            fixture = "scorm-1.2",
            expectedVersion = ScormVersion.SCORM_1_2,
            commitValues = mapOf(
                "cmi.core.lesson_status" to "incomplete",
                "cmi.core.score.raw" to "72",
                "cmi.core.session_time" to "00:01:30",
            ),
            finishValues = mapOf("cmi.core.lesson_status" to "passed"),
            expectedScore = 72.0,
            expectedProgress = null,
            expectedSeconds = 90,
            runtimeApiMarker = "window.API =",
            scoApiMarker = "api.LMSInitialize",
        )

        runScenario(scenario)
    }

    @Test
    fun `SCORM 2004 import launch commit finish va qayta ochish oqimi ishlaydi`() {
        val scenario = Scenario(
            fixture = "scorm-2004",
            expectedVersion = ScormVersion.SCORM_2004,
            commitValues = mapOf(
                "cmi.completion_status" to "incomplete",
                "cmi.progress_measure" to "0.65",
                "cmi.score.raw" to "84",
                "cmi.session_time" to "PT2M15S",
            ),
            finishValues = mapOf(
                "cmi.completion_status" to "completed",
                "cmi.success_status" to "passed",
            ),
            expectedScore = 84.0,
            expectedProgress = 0.65,
            expectedSeconds = 135,
            runtimeApiMarker = "window.API_1484_11 =",
            scoApiMarker = "api.Initialize",
        )

        runScenario(scenario)
    }

    private fun runScenario(scenario: Scenario) {
        val service = ScormService(
            courseRepository = courseRepository,
            packageRepository = packageRepository,
            attemptRepository = attemptRepository,
            objectMapper = objectMapper,
            storageDir = storageDir.toString(),
            maxPackageBytes = 5_000_000,
        )
        val teacherId = 5_501L
        val learnerId = 9_901L
        val course = courseRepository.save(Course(
            title = "${scenario.expectedVersion} integratsiya kursi",
            userId = teacherId,
            status = "PUBLISHED",
        ))

        val imported = service.importPackage(
            courseId = requireNotNull(course.id),
            file = fixturePackage(scenario.fixture),
            importerId = teacherId,
            importedBy = "e2e-teacher",
            mayManageAllCourses = false,
        )
        assertEquals(scenario.expectedVersion, imported.version)
        assertEquals("index.html", imported.entryPoint)

        val firstLaunch = service.launch(imported.id, learnerId)
        assertEquals(ScormAttemptStatus.IN_PROGRESS, firstLaunch.dto.status)
        assertTrue(firstLaunch.dto.runtimeData.isEmpty())

        val wrapper = service.content(
            storageKey = firstLaunch.dto.launchUrl.substringAfter("/scorm-content/").substringBefore('/'),
            requestedPath = "__launch.html",
            launchToken = firstLaunch.cookieToken,
        ).resource.inputStream.bufferedReader().use { it.readText() }
        assertTrue(wrapper.contains(scenario.runtimeApiMarker))
        assertTrue(wrapper.contains("attemptId: ${firstLaunch.dto.attemptId}"))

        val sco = service.content(
            storageKey = firstLaunch.dto.launchUrl.substringAfter("/scorm-content/").substringBefore('/'),
            requestedPath = imported.entryPoint,
            launchToken = firstLaunch.cookieToken,
        ).resource.inputStream.bufferedReader().use { it.readText() }
        assertTrue(sco.contains(scenario.scoApiMarker))

        val committed = service.updateRuntime(
            firstLaunch.dto.attemptId,
            learnerId,
            ScormRuntimeUpdateRequest(values = scenario.commitValues),
        )
        assertEquals(ScormAttemptStatus.IN_PROGRESS, committed.status)
        assertEquals(scenario.expectedScore, committed.scoreRaw)
        assertEquals(scenario.expectedProgress, committed.progressMeasure)
        assertEquals(scenario.expectedSeconds, committed.totalTimeSeconds)

        val finished = service.updateRuntime(
            firstLaunch.dto.attemptId,
            learnerId,
            ScormRuntimeUpdateRequest(values = scenario.finishValues, finish = true),
        )
        assertEquals(ScormAttemptStatus.PASSED, finished.status)
        assertTrue(finished.completedAt != null)

        val reopened = service.launch(imported.id, learnerId)
        assertEquals(firstLaunch.dto.attemptId, reopened.dto.attemptId)
        assertNotEquals(firstLaunch.cookieToken, reopened.cookieToken)
        assertEquals(ScormAttemptStatus.PASSED, reopened.dto.status)
        assertEquals(scenario.finishValues.entries.first().value, reopened.dto.runtimeData[scenario.finishValues.keys.first()])

        val persisted = service.getAttempt(reopened.dto.attemptId, learnerId)
        assertEquals(scenario.expectedScore, persisted.scoreRaw)
        assertEquals(scenario.expectedProgress, persisted.progressMeasure)
        assertEquals(scenario.expectedSeconds, persisted.totalTimeSeconds)
        assertEquals(ScormAttemptStatus.PASSED, persisted.status)
    }

    private fun fixturePackage(fixture: String): MockMultipartFile {
        val files = listOf("imsmanifest.xml", "index.html")
        val bytes = ByteArrayOutputStream().use { output ->
            ZipOutputStream(output).use { zip ->
                files.forEach { name ->
                    zip.putNextEntry(ZipEntry(name))
                    ClassPathResource("scorm/$fixture/$name").inputStream.use { it.copyTo(zip) }
                    zip.closeEntry()
                }
            }
            output.toByteArray()
        }
        return MockMultipartFile("file", "$fixture.zip", "application/zip", bytes)
    }

    private data class Scenario(
        val fixture: String,
        val expectedVersion: ScormVersion,
        val commitValues: Map<String, String>,
        val finishValues: Map<String, String>,
        val expectedScore: Double,
        val expectedProgress: Double?,
        val expectedSeconds: Long,
        val runtimeApiMarker: String,
        val scoApiMarker: String,
    )
}
