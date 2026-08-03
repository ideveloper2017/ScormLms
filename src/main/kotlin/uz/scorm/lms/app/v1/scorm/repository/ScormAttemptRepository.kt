package uz.scorm.lms.app.v1.scorm.repository

import org.springframework.data.jpa.repository.JpaRepository
import uz.scorm.lms.app.v1.scorm.model.ScormAttempt

interface ScormAttemptRepository : JpaRepository<ScormAttempt, Long> {
    fun findByScormPackageIdAndUserId(packageId: Long, userId: Long): ScormAttempt?
    fun findByLaunchTokenHash(launchTokenHash: String): ScormAttempt?
    fun findAllByScormPackageCourseIdAndUserIdAndDeletedFalse(courseId: Long, userId: Long): List<ScormAttempt>
}
