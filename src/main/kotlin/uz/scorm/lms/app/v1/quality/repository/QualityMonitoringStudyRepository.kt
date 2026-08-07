package uz.scorm.lms.app.v1.quality.repository

import org.springframework.data.jpa.repository.JpaRepository
import uz.scorm.lms.app.v1.quality.model.QualityMonitoringStatus
import uz.scorm.lms.app.v1.quality.model.QualityMonitoringStudy

interface QualityMonitoringStudyRepository : JpaRepository<QualityMonitoringStudy, Long> {
    fun findByIdAndDeletedFalse(id: Long): QualityMonitoringStudy?
    fun findAllByDeletedFalseOrderByStartsAtDesc(): List<QualityMonitoringStudy>
    fun countByStatusAndDeletedFalse(status: QualityMonitoringStatus): Long
}

