package uz.scorm.lms.app.v1.readiness.repository

import org.springframework.data.jpa.repository.EntityGraph
import org.springframework.data.jpa.repository.JpaRepository
import uz.scorm.lms.app.v1.readiness.model.DistanceInfrastructureReadiness
import uz.scorm.lms.app.v1.readiness.model.DistanceReadinessStatus

interface DistanceInfrastructureReadinessRepository : JpaRepository<DistanceInfrastructureReadiness, Long> {
    @EntityGraph(attributePaths = ["createdByUser", "reviewedByUser", "archivedByUser"])
    fun findAllByDeletedFalseOrderByCreatedAtDesc(): List<DistanceInfrastructureReadiness>
    @EntityGraph(attributePaths = ["createdByUser", "reviewedByUser", "archivedByUser"])
    fun findByIdAndDeletedFalse(id: Long): DistanceInfrastructureReadiness?
    fun existsByVersionCodeAndDeletedFalse(versionCode: String): Boolean
    fun existsByVersionCodeAndDeletedFalseAndIdNot(versionCode: String, id: Long): Boolean
    fun countByStatusAndDeletedFalse(status: DistanceReadinessStatus): Long
}

