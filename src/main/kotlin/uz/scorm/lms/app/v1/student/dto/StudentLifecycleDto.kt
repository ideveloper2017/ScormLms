package uz.scorm.lms.app.v1.student.dto

import uz.scorm.lms.app.v1.student.model.StudentLifecycleEventType
import uz.scorm.lms.app.v1.student.model.StudentStatus
import java.time.Instant
import java.time.LocalDate
import java.math.BigDecimal
import uz.scorm.lms.app.v1.student.model.DegreeLevel
import uz.scorm.lms.app.v1.student.model.EducationForm
import uz.scorm.lms.app.v1.student.model.PaymentType

data class StudentAdmissionRequest(
    val student: StudentCreateRequest,
    val orderNumber: String,
    val orderDate: LocalDate,
    val effectiveDate: LocalDate,
    val legalBasis: String,
    val reason: String,
)

data class StudentAcademicAdmissionRequest(
    val universityId: Long? = null,
    val facultyId: Long? = null,
    val departmentId: Long? = null,
    val programId: Long,
    val degreeLevel: DegreeLevel,
    val educationForm: EducationForm,
    val educationLanguage: String,
    val courseNumber: Int = 1,
    val groupId: Long? = null,
    val academicYear: String? = null,
    val paymentType: PaymentType? = null,
    val contractNumber: String? = null,
    val contractAmount: BigDecimal? = null,
    val orderNumber: String,
    val orderDate: LocalDate,
    val effectiveDate: LocalDate,
    val legalBasis: String,
    val reason: String,
)

data class StudentLifecycleRequest(
    val eventType: StudentLifecycleEventType,
    val orderNumber: String,
    val orderDate: LocalDate,
    val effectiveDate: LocalDate,
    val legalBasis: String,
    val reason: String,
    val targetProgramId: Long? = null,
    val targetGroupId: Long? = null,
    val academicYear: String? = null,
)

data class StudentLifecycleEventDto(
    val id: Long,
    val studentId: Long,
    val studentNumber: String,
    val studentName: String,
    val eventType: StudentLifecycleEventType,
    val fromStatus: StudentStatus?,
    val toStatus: StudentStatus,
    val fromProgramId: Long?,
    val fromProgramName: String?,
    val toProgramId: Long?,
    val toProgramName: String?,
    val fromGroupId: Long?,
    val toGroupId: Long?,
    val orderNumber: String,
    val orderDate: LocalDate,
    val effectiveDate: LocalDate,
    val legalBasis: String,
    val reason: String,
    val recordedByUserId: Long,
    val recordedByName: String,
    val recordedAt: Instant,
)

data class StudentLifecycleResultDto(
    val student: StudentDto,
    val event: StudentLifecycleEventDto,
)
