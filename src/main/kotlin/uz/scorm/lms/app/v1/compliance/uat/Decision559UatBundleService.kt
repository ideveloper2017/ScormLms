package uz.scorm.lms.app.v1.compliance.uat

import com.fasterxml.jackson.databind.ObjectMapper
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.audit.service.AuditService
import java.io.BufferedOutputStream
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.StandardOpenOption
import java.security.MessageDigest
import java.util.zip.ZipEntry
import java.util.zip.ZipOutputStream

data class TemporaryDecision559UatBundle(
    val path: Path,
    val fileName: String,
    val sizeBytes: Long,
    val sha256: String,
)

@Service
class Decision559UatBundleService(
    private val uatService: Decision559UatService,
    private val objectMapper: ObjectMapper,
    private val auditService: AuditService,
) {
    @Transactional
    fun create(runId: Long, actorId: Long): TemporaryDecision559UatBundle {
        val detail = uatService.detail(runId)
        require(detail.run.status == Decision559UatRunStatus.APPROVED && detail.run.readyToSubmit) {
            "Acceptance bundle faqat yakuniy APPROVED UAT run uchun yaratiladi"
        }
        val manifest = uatService.manifest(runId)
        require(manifest.status == Decision559UatRunStatus.APPROVED && manifest.readyToSubmit) {
            "UAT manifest yakuniy qabul holatida emas"
        }
        val manifestBytes = objectMapper.writeValueAsBytes(manifest)
        val declaredPayloadBytes = detail.evidence.sumOf { item ->
            if (manifest.schemaVersion == 2) item.sizeBytes ?: 0L else item.files.sumOf { it.sizeBytes }
        } + (manifest.protocol.sizeBytes ?: 0L)
        val hashedEntryNames = buildList {
            add(MANIFEST_ENTRY)
            detail.evidence.sortedBy { it.band }.forEach { item ->
                if (manifest.schemaVersion == 2 && item.originalName != null) {
                    add("evidence/${item.requirementId}/evidence${extension(requireNotNull(item.contentType))}")
                } else if (manifest.schemaVersion >= 3) {
                    item.files.sortedBy { it.id }.forEach { metadata ->
                        add(Decision559UatService.attachmentBundlePath(
                            item.requirementId,
                            metadata.id,
                            metadata.contentType,
                        ))
                    }
                }
            }
            add(PROTOCOL_ENTRY)
        }
        val sumsBytes = hashedEntryNames.sumOf { name ->
            (SHA256_HEX_LENGTH + SHA256_SEPARATOR_BYTES + name.toByteArray(Charsets.UTF_8).size + NEWLINE_BYTES).toLong()
        }
        val totalUncompressedBytes = declaredPayloadBytes + manifestBytes.size + sumsBytes
        require(totalUncompressedBytes <= MAX_BUNDLE_UNCOMPRESSED_BYTES) {
            "Acceptance bundle ochilgan jami hajmi 300 MB chegaradan oshadi"
        }

        val temporary = Files.createTempFile("decision-559-uat-run-$runId-", ".zip")
        temporary.toFile().deleteOnExit()
        try {
            val hashes = linkedMapOf<String, String>()
            ZipOutputStream(BufferedOutputStream(Files.newOutputStream(
                temporary,
                StandardOpenOption.TRUNCATE_EXISTING,
                StandardOpenOption.WRITE,
            ))).use { zip ->
                addEntry(zip, MANIFEST_ENTRY, manifestBytes)
                hashes[MANIFEST_ENTRY] = sha256(manifestBytes)

                detail.evidence.sortedBy { it.band }.forEach { item ->
                    if (manifest.schemaVersion == 2 && item.originalName != null) {
                        val file = uatService.evidenceFile(item.id)
                        val entryName = "evidence/${item.requirementId}/evidence${extension(file.contentType)}"
                        require(file.sha256 == item.sha256) { "${item.requirementId} dalil SHA-256 qiymati mos emas" }
                        addEntry(zip, entryName, file.bytes)
                        hashes[entryName] = file.sha256
                    } else if (manifest.schemaVersion >= 3) {
                        item.files.sortedBy { it.id }.forEach { metadata ->
                            val file = uatService.evidenceAttachmentFile(metadata.id)
                            val entryName = Decision559UatService.attachmentBundlePath(
                                item.requirementId,
                                metadata.id,
                                metadata.contentType,
                            )
                            require(file.sha256 == metadata.sha256) {
                                "${item.requirementId} attachment SHA-256 qiymati mos emas"
                            }
                            addEntry(zip, entryName, file.bytes)
                            hashes[entryName] = file.sha256
                        }
                    }
                }

                val protocol = uatService.protocolFile(runId)
                require(protocol.contentType == "application/pdf" && protocol.sha256 == manifest.protocol.sha256) {
                    "Imzolangan protokol metadata yoki SHA-256 qiymati mos emas"
                }
                addEntry(zip, PROTOCOL_ENTRY, protocol.bytes)
                hashes[PROTOCOL_ENTRY] = protocol.sha256

                val sums = hashes.entries.sortedBy { it.key }
                    .joinToString(separator = "\n", postfix = "\n") { (name, hash) -> "$hash  $name" }
                    .toByteArray(Charsets.UTF_8)
                addEntry(zip, SUMS_ENTRY, sums)
            }

            val size = Files.size(temporary)
            val bundleSha = sha256(temporary)
            auditService.logAction(
                "DECISION_559_UAT_BUNDLE_EXPORTED",
                actorId,
                "run=$runId; size=$size; sha256=$bundleSha",
            )
            return TemporaryDecision559UatBundle(
                path = temporary,
                fileName = "decision-559-uat-run-$runId-acceptance-bundle.zip",
                sizeBytes = size,
                sha256 = bundleSha,
            )
        } catch (error: Exception) {
            Files.deleteIfExists(temporary)
            throw error
        }
    }

    private fun addEntry(zip: ZipOutputStream, name: String, bytes: ByteArray) {
        require(name.isNotBlank() && !name.startsWith('/') && '\\' !in name && ".." !in name.split('/')) {
            "Xavfsiz bo'lmagan acceptance bundle yo'li"
        }
        zip.putNextEntry(ZipEntry(name).apply { time = 0L })
        zip.write(bytes)
        zip.closeEntry()
    }

    private fun extension(contentType: String): String = when (contentType) {
        "application/pdf" -> ".pdf"
        "image/png" -> ".png"
        "image/jpeg" -> ".jpg"
        else -> throw IllegalArgumentException("Bundle uchun noma'lum dalil turi: $contentType")
    }

    private fun sha256(bytes: ByteArray): String = MessageDigest.getInstance("SHA-256")
        .digest(bytes).joinToString("") { "%02x".format(it) }

    private fun sha256(path: Path): String {
        val digest = MessageDigest.getInstance("SHA-256")
        Files.newInputStream(path).use { input ->
            val buffer = ByteArray(DEFAULT_BUFFER_SIZE)
            while (true) {
                val read = input.read(buffer)
                if (read < 0) break
                digest.update(buffer, 0, read)
            }
        }
        return digest.digest().joinToString("") { "%02x".format(it) }
    }

    companion object {
        const val MANIFEST_ENTRY = "manifest.json"
        const val PROTOCOL_ENTRY = "protocol/signed-protocol.pdf"
        const val SUMS_ENTRY = "SHA256SUMS"
        const val MAX_BUNDLE_UNCOMPRESSED_BYTES = 300L * 1024 * 1024
        private const val SHA256_HEX_LENGTH = 64
        private const val SHA256_SEPARATOR_BYTES = 2
        private const val NEWLINE_BYTES = 1
    }
}
