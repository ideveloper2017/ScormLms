package uz.scorm.lms.app.v1.biometric.service

import org.springframework.beans.factory.annotation.Value
import org.springframework.data.domain.PageRequest
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.audit.service.AuditService
import uz.scorm.lms.app.v1.biometric.dto.BiometricRetentionRunDto
import uz.scorm.lms.app.v1.biometric.model.BiometricAssetType
import uz.scorm.lms.app.v1.biometric.model.BiometricPurgeRecord
import uz.scorm.lms.app.v1.biometric.repository.BiometricPurgeRecordRepository
import uz.scorm.lms.app.v1.quiz.repository.ProctoringSessionRepository
import uz.scorm.lms.app.v1.user.repository.UserRepository
import java.nio.file.Files
import java.nio.file.Path
import java.time.Instant

@Service
class BiometricDataErasureService(
    private val userRepository: UserRepository,
    private val sessionRepository: ProctoringSessionRepository,
    private val purgeRepository: BiometricPurgeRecordRepository,
    private val auditService: AuditService,
    @Value("\${file.upload-dir:./uploads}") private val uploadDir: String,
) {
    @Transactional
    fun eraseFaceTemplate(userId: Long, reason: String, actorId: Long?): Boolean {
        val user = userRepository.findById(userId).orElseThrow { NoSuchElementException("Foydalanuvchi topilmadi: $userId") }
        val hadData = !user.facePhotoUrl.isNullOrBlank() || !user.faceDescriptor.isNullOrBlank()
        if (!hadData) return false
        val policy = user.facePolicy
        val dueAt = user.faceExpiresAt
        val fileDeleted = deleteStoredFaceFile(user.facePhotoUrl)
        user.facePhotoUrl = null
        user.faceDescriptor = null
        user.faceUploadedAt = null
        user.facePolicy = null
        user.faceConsentEvent = null
        user.faceExpiresAt = null
        userRepository.save(user)
        purgeRepository.save(BiometricPurgeRecord(
            user = user, policy = policy, assetType = BiometricAssetType.FACE_TEMPLATE,
            reason = reason.take(1000), dueAt = dueAt, executedAt = Instant.now(), fileDeleted = fileDeleted,
            executedByUser = actorId?.let { userRepository.findById(it).orElse(null) },
        ))
        actorId?.let { auditService.logAction("BIOMETRIC_FACE_TEMPLATE_PURGED", it, "user=$userId; reason=${reason.take(200)}; fileDeleted=$fileDeleted") }
        return true
    }

    @Transactional
    fun runRetention(actorId: Long? = null): BiometricRetentionRunDto {
        val now = Instant.now()
        var faces = 0
        userRepository.findAllByFaceExpiresAtBeforeAndFaceDescriptorIsNotNullAndDeletedFalse(now).forEach { user ->
            if (eraseFaceTemplate(requireNotNull(user.id), "RETENTION_EXPIRED", actorId)) faces++
        }
        var evidence = 0
        while (true) {
            val expired = sessionRepository.findAllByBiometricRetentionUntilBeforeAndBiometricPurgedAtIsNullAndDeletedFalse(now, PageRequest.of(0, 100))
            if (expired.isEmpty()) break
            expired.forEach { session ->
                val user = session.enrollment.student.user
                val dueAt = session.biometricRetentionUntil
                session.centerFrameHash = null
                session.challengeFrameHash = null
                session.identitySimilarity = null
                session.movementDelta = null
                session.biometricPurgedAt = now
                sessionRepository.save(session)
                purgeRepository.save(BiometricPurgeRecord(
                    user = user, policy = session.biometricPolicy, assetType = BiometricAssetType.PROCTORING_EVIDENCE,
                    reason = "RETENTION_EXPIRED", dueAt = dueAt, executedAt = now, fileDeleted = null,
                    executedByUser = actorId?.let { userRepository.findById(it).orElse(null) },
                ))
                evidence++
            }
        }
        actorId?.let { auditService.logAction("BIOMETRIC_RETENTION_RUN", it, "faceTemplates=$faces; proctoringEvidence=$evidence") }
        return BiometricRetentionRunDto(faces, evidence, now)
    }

    @Scheduled(cron = "\${app.biometric.retention.cron:0 20 2 * * *}")
    fun scheduledRetention() { runRetention() }

    private fun deleteStoredFaceFile(url: String?): Boolean? {
        if (url.isNullOrBlank()) return null
        return try {
            val prefix = "/uploads/"
            if (!url.startsWith(prefix)) return false
            val root = Path.of(uploadDir).toAbsolutePath().normalize()
            val target = root.resolve(url.removePrefix(prefix)).normalize()
            if (!target.startsWith(root)) return false
            Files.deleteIfExists(target)
        } catch (_: Exception) {
            false
        }
    }
}
