package uz.scorm.lms.app.v1.student.dto

import uz.scorm.lms.app.v1.student.model.*
import java.math.BigDecimal
import java.time.LocalDate
import java.time.Instant

// ── Response DTOs ─────────────────────────────────────────────────────────────

data class StudentDto(
    val id: Long?,
    // Shaxsiy
    val pinfl: String,
    val lastName: String,
    val firstName: String,
    val middleName: String?,
    val fullName: String,
    val birthDate: LocalDate?,
    val gender: Gender?,
    val citizenship: Citizenship?,
    // Pasport
    val passportType: PassportType?,
    val passportSeries: String?,
    val passportNumber: String?,
    val passportIssuedDate: LocalDate?,
    val passportExpiryDate: LocalDate?,
    val passportIssuedBy: String?,
    val photoUrl: String?,
    // Aloqa
    val phoneNumber: String?,
    val email: String?,
    // Doimiy manzil
    val permanentRegion: String?,
    val permanentDistrict: String?,
    val permanentAddress: String?,
    // Hozirgi manzil
    val currentRegion: String?,
    val currentDistrict: String?,
    val currentAddress: String?,
    // Ta'lim
    val studentNumber: String,
    val universityId: Long?,
    val facultyId: Long?,
    val departmentId: Long?,
    val programId: Long?,
    val degreeLevel: DegreeLevel?,
    val educationForm: EducationForm?,
    val educationLanguage: String?,
    val courseNumber: Int?,
    val groupId: Long?,
    val academicYear: String?,
    val admissionDate: LocalDate?,
    val admissionOrderNumber: String?,
    val studentStatus: StudentStatus?,
    val paymentType: PaymentType?,
    val contractNumber: String?,
    val contractAmount: BigDecimal?,
    // Tizim
    val username: String,
    val accountEnabled: Boolean,
    val lastLoginAt: Instant?,
    val createdAt: Instant?,
    val updatedAt: Instant?,
)

data class StudentSummaryDto(
    val id: Long?,
    val studentNumber: String,
    val fullName: String,
    val pinfl: String,
    val phoneNumber: String?,
    val email: String?,
    val facultyId: Long?,
    val groupId: Long?,
    val courseNumber: Int?,
    val degreeLevel: DegreeLevel?,
    val studentStatus: StudentStatus?,
    val photoUrl: String?,
)

// ── Request DTOs ──────────────────────────────────────────────────────────────

data class StudentCreateRequest(
    // Shaxsiy (majburiy)
    val pinfl: String,
    val lastName: String,
    val firstName: String,
    val middleName: String? = null,
    val birthDate: LocalDate,
    val gender: Gender,
    val citizenship: Citizenship = Citizenship.UZBEKISTAN,
    // Pasport
    val passportType: PassportType? = null,
    val passportSeries: String? = null,
    val passportNumber: String? = null,
    val passportIssuedDate: LocalDate? = null,
    val passportExpiryDate: LocalDate? = null,
    val passportIssuedBy: String? = null,
    val photoUrl: String? = null,
    // Aloqa
    val phoneNumber: String? = null,
    val email: String? = null,
    // Doimiy manzil
    val permanentRegion: String? = null,
    val permanentDistrict: String? = null,
    val permanentAddress: String? = null,
    // Hozirgi manzil
    val currentRegion: String? = null,
    val currentDistrict: String? = null,
    val currentAddress: String? = null,
    // Ta'lim (majburiy)
    val studentNumber: String,
    val universityId: Long? = null,
    val facultyId: Long? = null,
    val departmentId: Long? = null,
    val programId: Long? = null,
    val degreeLevel: DegreeLevel = DegreeLevel.BACHELOR,
    val educationForm: EducationForm = EducationForm.FULL_TIME,
    val educationLanguage: String = "uz",
    val courseNumber: Int = 1,
    val groupId: Long? = null,
    val academicYear: String? = null,
    val admissionDate: LocalDate? = null,
    val admissionOrderNumber: String? = null,
    val studentStatus: StudentStatus = StudentStatus.ACTIVE,
    val paymentType: PaymentType? = null,
    val contractNumber: String? = null,
    val contractAmount: BigDecimal? = null,
    // Tizimga kirish
    val password: String = "Student@123",
)

data class StudentUpdateRequest(
    // Shaxsiy
    val lastName: String? = null,
    val firstName: String? = null,
    val middleName: String? = null,
    // Pasport
    val passportType: PassportType? = null,
    val passportSeries: String? = null,
    val passportNumber: String? = null,
    val passportIssuedDate: LocalDate? = null,
    val passportExpiryDate: LocalDate? = null,
    val passportIssuedBy: String? = null,
    val photoUrl: String? = null,
    // Aloqa
    val phoneNumber: String? = null,
    val email: String? = null,
    // Doimiy manzil
    val permanentRegion: String? = null,
    val permanentDistrict: String? = null,
    val permanentAddress: String? = null,
    // Hozirgi manzil
    val currentRegion: String? = null,
    val currentDistrict: String? = null,
    val currentAddress: String? = null,
    // Ta'lim
    val facultyId: Long? = null,
    val departmentId: Long? = null,
    val programId: Long? = null,
    val degreeLevel: DegreeLevel? = null,
    val educationForm: EducationForm? = null,
    val educationLanguage: String? = null,
    val courseNumber: Int? = null,
    val groupId: Long? = null,
    val academicYear: String? = null,
    val studentStatus: StudentStatus? = null,
    val paymentType: PaymentType? = null,
    val contractNumber: String? = null,
    val contractAmount: BigDecimal? = null,
)
