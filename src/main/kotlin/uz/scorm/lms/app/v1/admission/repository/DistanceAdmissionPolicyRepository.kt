package uz.scorm.lms.app.v1.admission.repository

import org.springframework.data.jpa.repository.JpaRepository
import uz.scorm.lms.app.v1.admission.model.AdmissionPolicyStatus
import uz.scorm.lms.app.v1.admission.model.DistanceAdmissionPolicy
import uz.scorm.lms.app.v1.admission.model.InstitutionGovernanceType

interface DistanceAdmissionPolicyRepository : JpaRepository<DistanceAdmissionPolicy, Long> {
    fun findByIdAndDeletedFalse(id: Long): DistanceAdmissionPolicy?
    fun findAllByDeletedFalseOrderByAcademicYearDescVersionCodeAsc(): List<DistanceAdmissionPolicy>
    fun existsByProgramIdAndAcademicYearAndVersionCodeAndDeletedFalse(programId: Long, academicYear: String, versionCode: String): Boolean
    fun existsByProgramIdAndAcademicYearAndStatusAndDeletedFalse(programId: Long, academicYear: String, status: AdmissionPolicyStatus): Boolean
    fun findByProgramIdAndAcademicYearAndStatusAndDeletedFalse(programId: Long, academicYear: String, status: AdmissionPolicyStatus): DistanceAdmissionPolicy?
    fun countByStatusAndDeletedFalse(status: AdmissionPolicyStatus): Long
    fun findAllByInstitutionGovernanceTypeAndStatusAndDeletedFalse(
        institutionGovernanceType: InstitutionGovernanceType,
        status: AdmissionPolicyStatus,
    ): List<DistanceAdmissionPolicy>
}
