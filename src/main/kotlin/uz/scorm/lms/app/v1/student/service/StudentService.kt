package uz.scorm.lms.app.v1.student.service

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.student.dto.*
import uz.scorm.lms.app.v1.student.model.StudentProfile
import uz.scorm.lms.app.v1.student.model.StudentStatus
import uz.scorm.lms.app.v1.student.repository.StudentRepository
import uz.scorm.lms.app.v1.user.model.UserStatus
import uz.scorm.lms.app.v1.user.service.UserService

@Service
class StudentService(
    private val studentRepository: StudentRepository,
    private val userService: UserService,
) {

    @Transactional(readOnly = true)
    fun listAll(): List<StudentSummaryDto> =
        studentRepository.findAll().map { toSummary(it) }

    @Transactional(readOnly = true)
    fun getById(id: Long): StudentDto =
        toDto(studentRepository.findById(id).orElseThrow { NoSuchElementException("Talaba topilmadi: $id") })

    @Transactional(readOnly = true)
    fun getByStudentNumber(studentNumber: String): StudentDto =
        toDto(studentRepository.findByStudentNumber(studentNumber)
            ?: throw NoSuchElementException("Talaba topilmadi: $studentNumber"))

    @Transactional
    fun create(req: StudentCreateRequest): StudentDto {
        if (studentRepository.existsByPinfl(req.pinfl))
            throw IllegalArgumentException("Bu PINFL allaqachon ro'yxatdan o'tgan: ${req.pinfl}")
        if (studentRepository.existsByStudentNumber(req.studentNumber))
            throw IllegalArgumentException("Bu talaba raqami band: ${req.studentNumber}")

        val user = userService.register(req.studentNumber, req.password, "student")
        user.email = req.email
        user.phone = req.phoneNumber

        val student = StudentProfile(
            user           = user,
            pinfl          = req.pinfl,
            lastName       = req.lastName,
            firstName      = req.firstName,
            middleName     = req.middleName,
            birthDate      = req.birthDate,
            gender         = req.gender,
            citizenship    = req.citizenship,
            passportType   = req.passportType,
            passportSeries = req.passportSeries,
            passportNumber = req.passportNumber,
            passportIssuedDate   = req.passportIssuedDate,
            passportExpiryDate   = req.passportExpiryDate,
            passportIssuedBy     = req.passportIssuedBy,
            photoUrl       = req.photoUrl,
            phoneNumber    = req.phoneNumber,
            email          = req.email,
            permanentRegion   = req.permanentRegion,
            permanentDistrict = req.permanentDistrict,
            permanentAddress  = req.permanentAddress,
            currentRegion     = req.currentRegion,
            currentDistrict   = req.currentDistrict,
            currentAddress    = req.currentAddress,
            studentNumber     = req.studentNumber,
            universityId      = req.universityId,
            facultyId         = req.facultyId,
            departmentId      = req.departmentId,
            programId         = req.programId,
            degreeLevel       = req.degreeLevel,
            educationForm     = req.educationForm,
            educationLanguage = req.educationLanguage,
            courseNumber      = req.courseNumber,
            groupId           = req.groupId,
            academicYear      = req.academicYear,
            admissionDate     = req.admissionDate,
            admissionOrderNumber = req.admissionOrderNumber,
            studentStatus     = req.studentStatus,
            paymentType       = req.paymentType,
            contractNumber    = req.contractNumber,
            contractAmount    = req.contractAmount,
        )
        return toDto(studentRepository.save(student))
    }

    @Transactional
    fun update(id: Long, req: StudentUpdateRequest): StudentDto {
        val student = studentRepository.findById(id)
            .orElseThrow { NoSuchElementException("Talaba topilmadi: $id") }

        req.lastName?.let       { student.lastName = it }
        req.firstName?.let      { student.firstName = it }
        req.middleName?.let     { student.middleName = it }
        req.passportType?.let   { student.passportType = it }
        req.passportSeries?.let { student.passportSeries = it }
        req.passportNumber?.let { student.passportNumber = it }
        req.passportIssuedDate?.let  { student.passportIssuedDate = it }
        req.passportExpiryDate?.let  { student.passportExpiryDate = it }
        req.passportIssuedBy?.let    { student.passportIssuedBy = it }
        req.photoUrl?.let       { student.photoUrl = it }
        req.phoneNumber?.let    { student.phoneNumber = it; student.user.phone = it }
        req.email?.let          { student.email = it; student.user.email = it }
        req.permanentRegion?.let   { student.permanentRegion = it }
        req.permanentDistrict?.let { student.permanentDistrict = it }
        req.permanentAddress?.let  { student.permanentAddress = it }
        req.currentRegion?.let     { student.currentRegion = it }
        req.currentDistrict?.let   { student.currentDistrict = it }
        req.currentAddress?.let    { student.currentAddress = it }
        req.facultyId?.let         { student.facultyId = it }
        req.departmentId?.let      { student.departmentId = it }
        req.programId?.let         { student.programId = it }
        req.degreeLevel?.let       { student.degreeLevel = it }
        req.educationForm?.let     { student.educationForm = it }
        req.educationLanguage?.let { student.educationLanguage = it }
        req.courseNumber?.let      { student.courseNumber = it }
        req.groupId?.let           { student.groupId = it }
        req.academicYear?.let      { student.academicYear = it }
        req.studentStatus?.let     { student.studentStatus = it }
        req.paymentType?.let       { student.paymentType = it }
        req.contractNumber?.let    { student.contractNumber = it }
        req.contractAmount?.let    { student.contractAmount = it }

        return toDto(studentRepository.save(student))
    }

    @Transactional
    fun changeStatus(id: Long, status: StudentStatus): StudentDto {
        val student = studentRepository.findById(id)
            .orElseThrow { NoSuchElementException("Talaba topilmadi: $id") }
        student.studentStatus = status
        if (status == StudentStatus.EXPELLED || status == StudentStatus.GRADUATED) {
            student.user.status = UserStatus.INACTIVE
        }
        return toDto(studentRepository.save(student))
    }

    @Transactional
    fun promote(id: Long): StudentDto {
        val student = studentRepository.findById(id)
            .orElseThrow { NoSuchElementException("Talaba topilmadi: $id") }
        student.courseNumber += 1
        return toDto(studentRepository.save(student))
    }

    @Transactional
    fun delete(id: Long) {
        val student = studentRepository.findById(id)
            .orElseThrow { NoSuchElementException("Talaba topilmadi: $id") }
        studentRepository.delete(student)
    }

    // ── Mapper helpers ────────────────────────────────────────────────────────

    fun toDto(s: StudentProfile) = StudentDto(
        id                   = s.id,
        pinfl                = s.pinfl,
        lastName             = s.lastName,
        firstName            = s.firstName,
        middleName           = s.middleName,
        fullName             = "${s.lastName} ${s.firstName}${s.middleName?.let { " $it" } ?: ""}",
        birthDate            = s.birthDate,
        gender               = s.gender,
        citizenship          = s.citizenship,
        passportType         = s.passportType,
        passportSeries       = s.passportSeries,
        passportNumber       = s.passportNumber,
        passportIssuedDate   = s.passportIssuedDate,
        passportExpiryDate   = s.passportExpiryDate,
        passportIssuedBy     = s.passportIssuedBy,
        photoUrl             = s.photoUrl,
        phoneNumber          = s.phoneNumber,
        email                = s.email,
        permanentRegion      = s.permanentRegion,
        permanentDistrict    = s.permanentDistrict,
        permanentAddress     = s.permanentAddress,
        currentRegion        = s.currentRegion,
        currentDistrict      = s.currentDistrict,
        currentAddress       = s.currentAddress,
        studentNumber        = s.studentNumber,
        universityId         = s.universityId,
        facultyId            = s.facultyId,
        departmentId         = s.departmentId,
        programId            = s.programId,
        degreeLevel          = s.degreeLevel,
        educationForm        = s.educationForm,
        educationLanguage    = s.educationLanguage,
        courseNumber         = s.courseNumber,
        groupId              = s.groupId,
        academicYear         = s.academicYear,
        admissionDate        = s.admissionDate,
        admissionOrderNumber = s.admissionOrderNumber,
        studentStatus        = s.studentStatus,
        paymentType          = s.paymentType,
        contractNumber       = s.contractNumber,
        contractAmount       = s.contractAmount,
        username             = s.user.username,
        accountEnabled       = s.user.status == UserStatus.ACTIVE,
        lastLoginAt          = s.user.lastLoginAt,
        createdAt            = s.createdAt,
        updatedAt            = s.updatedAt,
    )

    fun toSummary(s: StudentProfile) = StudentSummaryDto(
        id            = s.id,
        studentNumber = s.studentNumber,
        fullName      = "${s.lastName} ${s.firstName}${s.middleName?.let { " $it" } ?: ""}",
        pinfl         = s.pinfl,
        phoneNumber   = s.phoneNumber,
        email         = s.email,
        facultyId     = s.facultyId,
        groupId       = s.groupId,
        courseNumber  = s.courseNumber,
        degreeLevel   = s.degreeLevel,
        studentStatus = s.studentStatus,
        photoUrl      = s.photoUrl,
    )
}
