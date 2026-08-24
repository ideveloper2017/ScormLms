package uz.scorm.lms.app.v1.academicresult.repository

import org.springframework.data.jpa.repository.JpaRepository
import uz.scorm.lms.app.v1.academicresult.model.RatingSystem

interface RatingSystemRepository : JpaRepository<RatingSystem, Long> {
    fun findAllByDeletedFalseOrderByNameAsc(): List<RatingSystem>
    fun findByIdAndDeletedFalse(id: Long): RatingSystem?
    fun findByNameIgnoreCaseAndDeletedFalse(name: String): RatingSystem?
    fun findByShortNameIgnoreCaseAndDeletedFalse(shortName: String): RatingSystem?
}
