package uz.scorm.lms.app.v1.student.dto

import uz.scorm.lms.app.v1.student.model.*
import java.math.BigDecimal
import java.time.LocalDate
import java.time.Instant

data class StudentProfileResponse(
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
    val photoUrl: String?,
    // Aloqa
    val phoneNumber: String?,
    val email: String?,
    // Manzil
    val permanentRegion: String?,
    val permanentDistrict: String?,
    val permanentAddress: String?,
    val currentRegion: String?,
    val currentDistrict: String?,
    val currentAddress: String?,
    // Ta'lim
    val studentNumber: String,
    val degreeLevel: DegreeLevel?,
    val educationForm: EducationForm?,
    val educationLanguage: String?,
    val courseNumber: Int?,
    val groupId: Long?,
    val academicYear: String?,
    val studentStatus: StudentStatus?,
    val paymentType: PaymentType?,
    // Tizim
    val username: String,
    val lastLoginAt: Instant?,
)

data class UpdateStudentProfileRequest(
    val phoneNumber: String? = null,
    val email: String? = null,
    val currentRegion: String? = null,
    val currentDistrict: String? = null,
    val currentAddress: String? = null,
    val photoUrl: String? = null,
)