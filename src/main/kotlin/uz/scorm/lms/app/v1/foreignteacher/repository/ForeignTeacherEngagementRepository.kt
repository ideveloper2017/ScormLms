package uz.scorm.lms.app.v1.foreignteacher.repository

import org.springframework.data.jpa.repository.JpaRepository
import uz.scorm.lms.app.v1.foreignteacher.model.ForeignTeacherEngagement
import uz.scorm.lms.app.v1.foreignteacher.model.ForeignTeacherEngagementStatus

interface ForeignTeacherEngagementRepository : JpaRepository<ForeignTeacherEngagement, Long> {
    fun findAllByDeletedFalseOrderByEngagementStartDateDesc(): List<ForeignTeacherEngagement>
    fun findByIdAndDeletedFalse(id: Long): ForeignTeacherEngagement?
    fun countByStatusAndDeletedFalse(status: ForeignTeacherEngagementStatus): Long
    fun existsByTeacherIdAndAcademicYearAndContractNumberAndDeletedFalseAndStatusNot(
        teacherId: Long,
        academicYear: String,
        contractNumber: String,
        status: ForeignTeacherEngagementStatus,
    ): Boolean
    fun existsByTeacherIdAndAcademicYearAndContractNumberAndDeletedFalseAndStatusNotAndIdNot(
        teacherId: Long,
        academicYear: String,
        contractNumber: String,
        status: ForeignTeacherEngagementStatus,
        id: Long,
    ): Boolean
}
