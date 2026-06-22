package uz.scorm.lms.app.v1.student.service

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.student.dto.StudentProfileResponse
import uz.scorm.lms.app.v1.student.dto.UpdateStudentProfileRequest
import uz.scorm.lms.app.v1.student.model.StudentProfile
import uz.scorm.lms.app.v1.student.repository.StudentRepository
import uz.scorm.lms.app.v1.user.model.User
import uz.scorm.lms.app.v1.user.repository.UserRepository

@Service
class StudentPortalService(
    private val studentRepository: StudentRepository,
    private val userRepository: UserRepository,
) {

    @Transactional(readOnly = true)
    fun getProfile(currentUser: User): StudentProfileResponse {
        val profile = studentRepository.findByUserId(currentUser.id!!)
            ?: throw NoSuchElementException("Talaba profili topilmadi")
        return toResponse(profile)
    }

    @Transactional
    fun updateProfile(currentUser: User, req: UpdateStudentProfileRequest): StudentProfileResponse {
        val profile = studentRepository.findByUserId(currentUser.id!!)
            ?: throw NoSuchElementException("Talaba profili topilmadi")

        req.phoneNumber?.let    { profile.phoneNumber = it; currentUser.phone = it }
        req.email?.let          { profile.email = it; currentUser.email = it }
        req.currentRegion?.let  { profile.currentRegion = it }
        req.currentDistrict?.let { profile.currentDistrict = it }
        req.currentAddress?.let { profile.currentAddress = it }
        req.photoUrl?.let       { profile.photoUrl = it }

        userRepository.save(currentUser)
        return toResponse(studentRepository.save(profile))
    }

    private fun toResponse(s: StudentProfile) = StudentProfileResponse(
        id               = s.id,
        pinfl            = s.pinfl,
        lastName         = s.lastName,
        firstName        = s.firstName,
        middleName       = s.middleName,
        fullName         = "${s.lastName} ${s.firstName}${s.middleName?.let { " $it" } ?: ""}",
        birthDate        = s.birthDate,
        gender           = s.gender,
        citizenship      = s.citizenship,
        photoUrl         = s.photoUrl,
        phoneNumber      = s.phoneNumber,
        email            = s.email,
        permanentRegion  = s.permanentRegion,
        permanentDistrict = s.permanentDistrict,
        permanentAddress = s.permanentAddress,
        currentRegion    = s.currentRegion,
        currentDistrict  = s.currentDistrict,
        currentAddress   = s.currentAddress,
        studentNumber    = s.studentNumber,
        degreeLevel      = s.degreeLevel,
        educationForm    = s.educationForm,
        educationLanguage = s.educationLanguage,
        courseNumber     = s.courseNumber,
        groupId          = s.groupId,
        academicYear     = s.academicYear,
        studentStatus    = s.studentStatus,
        paymentType      = s.paymentType,
        username         = s.user.username,
        lastLoginAt      = s.user.lastLoginAt,
    )
}
