package uz.scorm.lms.app.v1.scorm.repository

import org.springframework.data.jpa.repository.JpaRepository
import uz.scorm.lms.app.v1.scorm.model.ScormPackage
import uz.scorm.lms.app.v1.scorm.model.ScormPackageStatus

interface ScormPackageRepository : JpaRepository<ScormPackage, Long> {
    fun findAllByCourseIdOrderByCreatedAtDesc(courseId: Long): List<ScormPackage>
    fun findFirstByCourseIdAndDeletedFalseOrderByCreatedAtDesc(courseId: Long): ScormPackage?
    fun findFirstByCourseIdAndStatusAndDeletedFalseOrderByCreatedAtDesc(
        courseId: Long,
        status: ScormPackageStatus,
    ): ScormPackage?
    fun findByStorageKey(storageKey: String): ScormPackage?
}
