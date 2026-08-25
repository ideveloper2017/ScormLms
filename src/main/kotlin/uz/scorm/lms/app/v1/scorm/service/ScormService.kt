package uz.scorm.lms.app.v1.scorm.service

import tools.jackson.core.type.TypeReference
import tools.jackson.databind.ObjectMapper
import jakarta.transaction.Transactional
import org.springframework.beans.factory.annotation.Value
import org.springframework.core.io.InputStreamResource
import org.springframework.http.MediaType
import org.springframework.stereotype.Service
import org.springframework.web.multipart.MultipartFile
import org.w3c.dom.Element
import uz.scorm.lms.app.v1.courses.repository.CourseRepository
import uz.scorm.lms.app.v1.scorm.dto.ScormAttemptDto
import uz.scorm.lms.app.v1.scorm.dto.ScormLaunchDto
import uz.scorm.lms.app.v1.scorm.dto.ScormLaunchResult
import uz.scorm.lms.app.v1.scorm.dto.ScormPackageDto
import uz.scorm.lms.app.v1.scorm.dto.ScormRuntimeUpdateRequest
import uz.scorm.lms.app.v1.scorm.model.ScormAttempt
import uz.scorm.lms.app.v1.scorm.model.ScormAttemptStatus
import uz.scorm.lms.app.v1.scorm.model.ScormPackage
import uz.scorm.lms.app.v1.scorm.model.ScormPackageStatus
import uz.scorm.lms.app.v1.scorm.model.ScormVersion
import uz.scorm.lms.app.v1.scorm.repository.ScormAttemptRepository
import uz.scorm.lms.app.v1.scorm.repository.ScormPackageRepository
import uz.scorm.lms.app.v1.attendance.model.LearningActivitySource
import uz.scorm.lms.app.v1.attendance.model.LearningActivityType
import uz.scorm.lms.app.v1.attendance.service.LearningActivityService
import java.io.BufferedInputStream
import java.io.ByteArrayInputStream
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.Paths
import java.security.MessageDigest
import java.security.SecureRandom
import java.time.Duration
import java.time.Instant
import java.util.Base64
import java.util.UUID
import java.util.zip.ZipInputStream
import javax.xml.XMLConstants
import javax.xml.parsers.DocumentBuilderFactory
import kotlin.io.path.extension

data class ScormContentResource(
    val resource: InputStreamResource,
    val mediaType: MediaType,
    val contentLength: Long,
)

@Service
class ScormService(
    private val courseRepository: CourseRepository,
    private val packageRepository: ScormPackageRepository,
    private val attemptRepository: ScormAttemptRepository,
    private val objectMapper: ObjectMapper,
    @Value("\${app.scorm.storage-dir:./private/scorm}") storageDir: String,
    @Value("\${app.scorm.max-package-bytes:209715200}") private val maxPackageBytes: Long,
    private val learningActivityService: LearningActivityService? = null,
) {
    private val storageRoot: Path = Paths.get(storageDir).toAbsolutePath().normalize()
    private val random = SecureRandom()
    private val mapType = object : TypeReference<MutableMap<String, String>>() {}

    @Transactional
    fun importPackage(courseId: Long, file: MultipartFile, importerId: Long, importedBy: String, mayManageAllCourses: Boolean): ScormPackageDto {
        require(!file.isEmpty) { "SCORM ZIP fayli bo'sh" }
        require(file.originalFilename?.lowercase()?.endsWith(".zip") == true) { "Faqat .zip SCORM paket qabul qilinadi" }
        require(file.size <= maxPackageBytes) { "SCORM paket hajmi ruxsat etilgan limitdan katta" }

        val course = courseRepository.findById(courseId)
            .orElseThrow { IllegalArgumentException("Kurs topilmadi: $courseId") }
        require(mayManageAllCourses || course.userId == importerId) {
            "Faqat o'zingizga biriktirilgan kursga SCORM paket yuklashingiz mumkin"
        }
        Files.createDirectories(storageRoot)
        val storageKey = UUID.randomUUID().toString().replace("-", "")
        val targetRoot = storageRoot.resolve(storageKey).normalize()
        require(targetRoot.startsWith(storageRoot)) { "Noto'g'ri saqlash manzili" }

        try {
            Files.createDirectories(targetRoot)
            extractSafely(file, targetRoot)
            val manifest = findManifest(targetRoot)
            val metadata = parseManifest(manifest, targetRoot)
            val sha256 = file.inputStream.use(::sha256)

            return packageRepository.save(ScormPackage(
                course = course,
                title = metadata.title ?: file.originalFilename?.removeSuffix(".zip") ?: course.title ?: "SCORM kurs",
                version = metadata.version,
                manifestIdentifier = metadata.identifier,
                entryPoint = metadata.entryPoint,
                storageKey = storageKey,
                sha256 = sha256,
                status = ScormPackageStatus.READY,
                importedBy = importedBy,
            )).toDto()
        } catch (error: Exception) {
            deleteTree(targetRoot)
            throw IllegalArgumentException("SCORM paketni import qilib bo'lmadi: ${error.message}", error)
        }
    }

    @Transactional
    fun launchLatest(courseId: Long, userId: Long): ScormLaunchResult {
        val scormPackage = packageRepository.findFirstByCourseIdAndDeletedFalseOrderByCreatedAtDesc(courseId)
            ?: throw NoSuchElementException("Kurs uchun SCORM paket topilmadi")
        return launch(requireNotNull(scormPackage.id), userId)
    }

    @Transactional
    fun launch(packageId: Long, userId: Long): ScormLaunchResult {
        val scormPackage = getReadyPackage(packageId)
        val now = Instant.now()
        val attempt = attemptRepository.findByScormPackageIdAndUserId(packageId, userId)
            ?: ScormAttempt(scormPackage = scormPackage, userId = userId)
        val token = newLaunchToken()
        attempt.launchTokenHash = sha256(token.byteInputStream())
        attempt.launchExpiresAt = now.plus(Duration.ofHours(2))
        attempt.lastAccessedAt = now
        if (attempt.startedAt == null) attempt.startedAt = now
        if (attempt.status == ScormAttemptStatus.NOT_STARTED) attempt.status = ScormAttemptStatus.IN_PROGRESS
        val saved = attemptRepository.save(attempt)
        learningActivityService?.recordIfEnrolled(
            courseId = requireNotNull(scormPackage.course.id),
            userId = userId,
            eventType = LearningActivityType.SCORM_LAUNCHED,
            sourceType = LearningActivitySource.SCORM_PACKAGE,
            sourceId = packageId,
        )
        val cookiePath = "/scorm-content/${scormPackage.storageKey}/"
        return ScormLaunchResult(
            dto = ScormLaunchDto(
                packageId = packageId,
                attemptId = requireNotNull(saved.id),
                courseId = requireNotNull(scormPackage.course.id),
                title = scormPackage.title,
                version = scormPackage.version,
                launchUrl = "${cookiePath}__launch.html",
                status = saved.status,
                runtimeData = runtimeData(saved),
            ),
            cookieToken = token,
            cookiePath = cookiePath,
        )
    }

    fun listPackages(courseId: Long): List<ScormPackageDto> =
        packageRepository.findAllByCourseIdOrderByCreatedAtDesc(courseId).map { it.toDto() }

    fun courseIdForPackage(packageId: Long): Long = requireNotNull(getReadyPackage(packageId).course.id)

    fun getAttempt(attemptId: Long, userId: Long): ScormAttemptDto =
        ownedAttempt(attemptId, userId).toDto()

    @Transactional
    fun updateRuntime(attemptId: Long, userId: Long, request: ScormRuntimeUpdateRequest): ScormAttemptDto {
        require(request.values.size <= 200) { "Bir so'rovda juda ko'p CMI qiymat yuborildi" }
        val attempt = ownedAttempt(attemptId, userId)
        val values = runtimeData(attempt)
        var payloadSize = 0
        request.values.forEach { (key, value) ->
            require(key.startsWith("cmi.")) { "Faqat cmi.* qiymatlar qabul qilinadi" }
            require(key.length <= 200) { "CMI kaliti juda uzun" }
            require(value.length <= 65_536) { "CMI qiymati juda uzun: $key" }
            payloadSize += key.length + value.length
            values[key] = value
        }
        require(payloadSize <= 262_144) { "CMI payload hajmi juda katta" }

        attempt.runtimeData = objectMapper.writeValueAsString(values)
        attempt.lastAccessedAt = Instant.now()
        attempt.scoreRaw = values["cmi.core.score.raw"]?.toDoubleOrNull()
            ?: values["cmi.score.raw"]?.toDoubleOrNull()
            ?: attempt.scoreRaw
        attempt.progressMeasure = values["cmi.progress_measure"]?.toDoubleOrNull()?.coerceIn(0.0, 1.0)
            ?: attempt.progressMeasure
        val sessionSeconds = parseSessionSeconds(
            request.values["cmi.core.session_time"] ?: request.values["cmi.session_time"]
        )
        attempt.totalTimeSeconds += sessionSeconds
        attempt.status = deriveStatus(values, attempt.status)
        if (attempt.status in setOf(ScormAttemptStatus.COMPLETED, ScormAttemptStatus.PASSED, ScormAttemptStatus.FAILED)) {
            attempt.completedAt = attempt.completedAt ?: Instant.now()
        }
        val saved = attemptRepository.save(attempt)
        learningActivityService?.recordIfEnrolled(
            courseId = requireNotNull(saved.scormPackage.course.id),
            userId = userId,
            eventType = if (request.finish || saved.status in setOf(
                    ScormAttemptStatus.COMPLETED, ScormAttemptStatus.PASSED, ScormAttemptStatus.FAILED,
                )) LearningActivityType.SCORM_FINISHED else LearningActivityType.SCORM_COMMITTED,
            sourceType = LearningActivitySource.SCORM_PACKAGE,
            sourceId = requireNotNull(saved.scormPackage.id),
            durationSeconds = sessionSeconds.coerceIn(0, 86_400).toInt(),
        )
        return saved.toDto()
    }

    fun content(storageKey: String, requestedPath: String, launchToken: String?): ScormContentResource {
        require(!launchToken.isNullOrBlank()) { "SCORM launch sessiyasi topilmadi" }
        val attempt = attemptRepository.findByLaunchTokenHash(sha256(launchToken.byteInputStream()))
            ?: throw IllegalArgumentException("SCORM launch sessiyasi yaroqsiz")
        require(attempt.launchExpiresAt?.isAfter(Instant.now()) == true) { "SCORM launch sessiyasi tugagan" }
        require(attempt.scormPackage.storageKey == storageKey) { "SCORM paketga kirish ruxsati yo'q" }

        if (requestedPath == "__launch.html") {
            val html = launchWrapper(attempt).toByteArray(Charsets.UTF_8)
            return ScormContentResource(InputStreamResource(ByteArrayInputStream(html)), MediaType.TEXT_HTML, html.size.toLong())
        }

        val packageRoot = storageRoot.resolve(storageKey).normalize()
        require(packageRoot.startsWith(storageRoot)) { "Noto'g'ri SCORM paketi" }
        val target = packageRoot.resolve(requestedPath.replace('\\', '/')).normalize()
        require(target.startsWith(packageRoot) && Files.isRegularFile(target)) { "SCORM resurs topilmadi" }
        val mediaType = runCatching {
            MediaType.parseMediaType(Files.probeContentType(target) ?: fallbackContentType(target))
        }.getOrDefault(MediaType.APPLICATION_OCTET_STREAM)
        return ScormContentResource(
            resource = InputStreamResource(Files.newInputStream(target)),
            mediaType = mediaType,
            contentLength = Files.size(target),
        )
    }

    private fun getReadyPackage(packageId: Long): ScormPackage {
        val item = packageRepository.findById(packageId)
            .orElseThrow { NoSuchElementException("SCORM paket topilmadi: $packageId") }
        require(item.status == ScormPackageStatus.READY && !item.deleted) { "SCORM paket ishga tayyor emas" }
        return item
    }

    private fun ownedAttempt(attemptId: Long, userId: Long): ScormAttempt {
        val attempt = attemptRepository.findById(attemptId)
            .orElseThrow { NoSuchElementException("SCORM urinish topilmadi: $attemptId") }
        require(attempt.userId == userId) { "SCORM urinishiga kirish ruxsati yo'q" }
        return attempt
    }

    private fun extractSafely(file: MultipartFile, targetRoot: Path) {
        var entries = 0
        var extractedBytes = 0L
        ZipInputStream(BufferedInputStream(file.inputStream)).use { zip ->
            while (true) {
                val entry = zip.nextEntry ?: break
                entries++
                require(entries <= 10_000) { "SCORM paketda fayllar soni juda ko'p" }
                val safeName = entry.name.replace('\\', '/')
                require(!safeName.startsWith("/") && !safeName.contains("../")) { "ZIP ichida xavfli yo'l aniqlandi" }
                val output = targetRoot.resolve(safeName).normalize()
                require(output.startsWith(targetRoot)) { "ZIP Slip urinishi bloklandi" }
                if (entry.isDirectory) {
                    Files.createDirectories(output)
                } else {
                    Files.createDirectories(output.parent)
                    Files.newOutputStream(output).use { destination ->
                        val buffer = ByteArray(DEFAULT_BUFFER_SIZE)
                        while (true) {
                            val read = zip.read(buffer)
                            if (read < 0) break
                            extractedBytes += read
                            require(extractedBytes <= maxPackageBytes * 5) { "SCORM ZIP kengaytirilganda juda katta hajm hosil bo'ldi" }
                            destination.write(buffer, 0, read)
                        }
                    }
                }
                zip.closeEntry()
            }
        }
    }

    private fun findManifest(root: Path): Path = Files.walk(root, 5).use { paths ->
        paths.filter { Files.isRegularFile(it) && it.fileName.toString().equals("imsmanifest.xml", true) }
            .findFirst()
            .orElseThrow { IllegalArgumentException("imsmanifest.xml topilmadi") }
    }

    private fun parseManifest(manifest: Path, packageRoot: Path): ManifestMetadata {
        val factory = DocumentBuilderFactory.newInstance().apply {
            isNamespaceAware = true
            setFeature("http://apache.org/xml/features/disallow-doctype-decl", true)
            setFeature("http://xml.org/sax/features/external-general-entities", false)
            setFeature("http://xml.org/sax/features/external-parameter-entities", false)
            setAttribute(XMLConstants.ACCESS_EXTERNAL_DTD, "")
            setAttribute(XMLConstants.ACCESS_EXTERNAL_SCHEMA, "")
        }
        val document = Files.newInputStream(manifest).use { factory.newDocumentBuilder().parse(it) }
        val root = document.documentElement
        val schemaVersion = document.getElementsByTagNameNS("*", "schemaversion")
            .item(0)?.textContent?.trim().orEmpty()
        val version = if (schemaVersion.contains("2004", true) || root.namespaceURI?.contains("adlcp_v1p3", true) == true) {
            ScormVersion.SCORM_2004
        } else {
            ScormVersion.SCORM_1_2
        }
        val resources = document.getElementsByTagNameNS("*", "resource")
        val launchResource = (0 until resources.length)
            .mapNotNull { resources.item(it) as? Element }
            .firstOrNull { it.getAttribute("href").isNotBlank() }
            ?: throw IllegalArgumentException("Manifestda ishga tushiriladigan SCO resurs topilmadi")
        val href = launchResource.getAttribute("href").trim().replace('\\', '/')
        val resourcePath = href.substringBefore('?').substringBefore('#')
        val launchFile = manifest.parent.resolve(resourcePath).normalize()
        require(launchFile.startsWith(packageRoot) && Files.isRegularFile(launchFile)) {
            "Manifestdagi SCO entry point topilmadi: $href"
        }
        val entryPoint = packageRoot.relativize(launchFile).toString().replace('\\', '/') + href.removePrefix(resourcePath)
        val title = document.getElementsByTagNameNS("*", "title").item(0)?.textContent?.trim()
        return ManifestMetadata(
            identifier = root.getAttribute("identifier").ifBlank { null },
            title = title,
            version = version,
            entryPoint = entryPoint,
        )
    }

    private fun runtimeData(attempt: ScormAttempt): MutableMap<String, String> = runCatching {
        objectMapper.readValue(attempt.runtimeData, mapType)
    }.getOrDefault(mutableMapOf())

    private fun deriveStatus(
        values: Map<String, String>,
        current: ScormAttemptStatus,
    ): ScormAttemptStatus {
        val lesson = values["cmi.core.lesson_status"]?.lowercase()
        val completion = values["cmi.completion_status"]?.lowercase()
        val success = values["cmi.success_status"]?.lowercase()
        return when {
            success == "passed" || lesson == "passed" -> ScormAttemptStatus.PASSED
            success == "failed" || lesson == "failed" -> ScormAttemptStatus.FAILED
            completion == "completed" || lesson == "completed" -> ScormAttemptStatus.COMPLETED
            lesson == "incomplete" || completion == "incomplete" -> ScormAttemptStatus.IN_PROGRESS
            else -> current
        }
    }

    private fun parseSessionSeconds(value: String?): Long {
        if (value.isNullOrBlank()) return 0
        return runCatching {
            if (value.startsWith("P")) Duration.parse(value).seconds
            else {
                val parts = value.split(':')
                when (parts.size) {
                    3 -> parts[0].toLong() * 3600 + parts[1].toLong() * 60 + parts[2].toDouble().toLong()
                    2 -> parts[0].toLong() * 60 + parts[1].toDouble().toLong()
                    else -> 0
                }
            }
        }.getOrDefault(0).coerceAtLeast(0)
    }

    private fun fallbackContentType(path: Path): String = when (path.extension.lowercase()) {
        "html", "htm" -> "text/html"
        "js" -> "application/javascript"
        "css" -> "text/css"
        "json" -> "application/json"
        "xml" -> "application/xml"
        "svg" -> "image/svg+xml"
        "mp4" -> "video/mp4"
        "mp3" -> "audio/mpeg"
        else -> "application/octet-stream"
    }

    private fun launchWrapper(attempt: ScormAttempt): String {
        val entryPoint = objectMapper.writeValueAsString(attempt.scormPackage.entryPoint)
        val initialValues = objectMapper.writeValueAsString(runtimeData(attempt)).replace("<", "\\u003c")
        val attemptId = requireNotNull(attempt.id)
        return """<!doctype html>
<html lang="uz"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${attempt.scormPackage.title.replace("<", "&lt;")}</title>
<style>html,body,iframe{width:100%;height:100%;margin:0;border:0;overflow:hidden}</style></head>
<body><iframe id="sco" title="SCORM kontent"></iframe><script>
(() => {
  const values = $initialValues;
  let dirty = {};
  let lastError = "0";
  const send = (type, finish) => {
    window.parent.postMessage({ source: "SCORM_LMS_BRIDGE", type, attemptId: $attemptId, values: dirty, finish: !!finish }, "*");
    dirty = {};
  };
  const getValue = key => values[key] || "";
  const setValue = (key, value) => {
    if (!String(key).startsWith("cmi.")) { lastError = "201"; return "false"; }
    values[key] = String(value); dirty[key] = String(value); lastError = "0"; return "true";
  };
  const commit = () => { send("COMMIT", false); return "true"; };
  const finish = () => { send("FINISH", true); return "true"; };
  const initialize = () => { lastError = "0"; return "true"; };
  const errorString = code => ({"0":"No error","101":"General exception","201":"Invalid argument"})[code || lastError] || "Unknown error";
  window.API_1484_11 = { Initialize:initialize, Terminate:finish, GetValue:getValue, SetValue:setValue, Commit:commit, GetLastError:()=>lastError, GetErrorString:errorString, GetDiagnostic:errorString };
  window.API = { LMSInitialize:initialize, LMSFinish:finish, LMSGetValue:getValue, LMSSetValue:setValue, LMSCommit:commit, LMSGetLastError:()=>lastError, LMSGetErrorString:errorString, LMSGetDiagnostic:errorString };
  window.addEventListener("pagehide", () => { if (Object.keys(dirty).length) send("COMMIT", false); });
  document.getElementById("sco").src = $entryPoint;
})();
</script></body></html>"""
    }

    private fun newLaunchToken(): String {
        val bytes = ByteArray(48)
        random.nextBytes(bytes)
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes)
    }

    private fun sha256(input: java.io.InputStream): String {
        val digest = MessageDigest.getInstance("SHA-256")
        input.use { stream ->
            val buffer = ByteArray(DEFAULT_BUFFER_SIZE)
            while (true) {
                val read = stream.read(buffer)
                if (read < 0) break
                digest.update(buffer, 0, read)
            }
        }
        return digest.digest().joinToString("") { "%02x".format(it) }
    }

    private fun deleteTree(path: Path) {
        if (!path.startsWith(storageRoot) || path == storageRoot || !Files.exists(path)) return
        Files.walk(path).sorted(Comparator.reverseOrder()).use { paths ->
            paths.forEach { runCatching { Files.deleteIfExists(it) } }
        }
    }

    private fun ScormPackage.toDto() = ScormPackageDto(
        id = requireNotNull(id),
        courseId = requireNotNull(course.id),
        title = title,
        version = version,
        manifestIdentifier = manifestIdentifier,
        entryPoint = entryPoint,
        status = status,
        importedBy = importedBy,
        createdAt = createdAt,
    )

    private fun ScormAttempt.toDto() = ScormAttemptDto(
        id = requireNotNull(id),
        packageId = requireNotNull(scormPackage.id),
        status = status,
        scoreRaw = scoreRaw,
        progressMeasure = progressMeasure,
        totalTimeSeconds = totalTimeSeconds,
        runtimeData = runtimeData(this),
        startedAt = startedAt,
        completedAt = completedAt,
        lastAccessedAt = lastAccessedAt,
    )

    private data class ManifestMetadata(
        val identifier: String?,
        val title: String?,
        val version: ScormVersion,
        val entryPoint: String,
    )
}
