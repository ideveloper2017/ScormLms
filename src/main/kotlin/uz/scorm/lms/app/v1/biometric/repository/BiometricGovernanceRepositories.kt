package uz.scorm.lms.app.v1.biometric.repository

import org.springframework.data.jpa.repository.EntityGraph
import org.springframework.data.jpa.repository.JpaRepository
import uz.scorm.lms.app.v1.biometric.model.BiometricConsentEvent
import uz.scorm.lms.app.v1.biometric.model.BiometricPolicy
import uz.scorm.lms.app.v1.biometric.model.BiometricPolicyStatus
import uz.scorm.lms.app.v1.biometric.model.BiometricPurgeRecord

interface BiometricPolicyRepository : JpaRepository<BiometricPolicy, Long> {
    @EntityGraph(attributePaths = ["createdByUser", "publishedByUser", "archivedByUser"])
    fun findAllByDeletedFalseOrderByCreatedAtDesc(): List<BiometricPolicy>
    @EntityGraph(attributePaths = ["createdByUser", "publishedByUser", "archivedByUser"])
    fun findByIdAndDeletedFalse(id: Long): BiometricPolicy?
    @EntityGraph(attributePaths = ["createdByUser", "publishedByUser"])
    fun findFirstByStatusAndDeletedFalseOrderByPublishedAtDesc(status: BiometricPolicyStatus): BiometricPolicy?
    fun existsByVersionCodeAndDeletedFalse(versionCode: String): Boolean
    fun existsByVersionCodeAndDeletedFalseAndIdNot(versionCode: String, id: Long): Boolean
    fun countByStatusAndDeletedFalse(status: BiometricPolicyStatus): Long
}

interface BiometricConsentEventRepository : JpaRepository<BiometricConsentEvent, Long> {
    @EntityGraph(attributePaths = ["user", "policy", "actorUser"])
    fun findFirstByUserIdAndPolicyIdAndDeletedFalseOrderByOccurredAtDescIdDesc(userId: Long, policyId: Long): BiometricConsentEvent?
    fun countByPolicyIdAndActionAndDeletedFalse(policyId: Long, action: uz.scorm.lms.app.v1.biometric.model.BiometricConsentAction): Long
    fun countByActionAndDeletedFalse(action: uz.scorm.lms.app.v1.biometric.model.BiometricConsentAction): Long
}

interface BiometricPurgeRecordRepository : JpaRepository<BiometricPurgeRecord, Long> {
    fun countByDeletedFalse(): Long
}
