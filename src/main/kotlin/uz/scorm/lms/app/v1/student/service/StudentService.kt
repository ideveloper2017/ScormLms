package uz.scorm.lms.app.v1.student.service

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.student.dto.*
import uz.scorm.lms.app.v1.student.model.StudentProfile
import uz.scorm.lms.app.v1.student.model.StudentStatus
import uz.scorm.lms.app.v1.student.model.Citizenship
import uz.scorm.lms.app.v1.student.model.EducationForm
import uz.scorm.lms.app.v1.student.model.PaymentType
import uz.scorm.lms.app.v1.student.repository.StudentRepository
import uz.scorm.lms.app.v1.program.repository.ProgramRepository
import uz.scorm.lms.app.v1.teacher.repository.TeacherRepository
import uz.scorm.lms.app.v1.compliance.Decision559Rules
import uz.scorm.lms.app.v1.user.model.UserStatus
import uz.scorm.lms.app.v1.user.service.UserService

@Service
class StudentService(
    private val studentRepository: StudentRepository,
    private val userService: UserService,
    private val programRepository: ProgramRepository,
    private val teacherRepository: TeacherRepository,
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

        validateDistanceAdmission(req)

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

    private fun validateDistanceAdmission(req: StudentCreateRequest) {
        if (req.educationForm != EducationForm.DISTANCE) return

        val programId = requireNotNull(req.programId) {
            "Masofaviy ta'lim uchun yo'nalish tanlanishi shart"
        }
        val program = programRepository.findById(programId)
            .orElseThrow { IllegalArgumentException("Yo'nalish topilmadi: $programId") }

        require(program.distanceEnabled) {
            "${program.name} yo'nalishida masofaviy ta'limga ruxsat berilmagan"
        }
        require(program.degreeLevel.equals(req.degreeLevel.name, ignoreCase = true)) {
            "Talabaning ta'lim darajasi yo'nalish darajasiga mos emas"
        }
        require(req.paymentType == PaymentType.CONTRACT) {
            "559-son qarorning 13-bandiga ko'ra masofaviy ta'lim to'lov-kontrakt asosida amalga oshiriladi"
        }
        require(program.educationLanguage.equals(req.educationLanguage, ignoreCase = true)) {
            "Ta'lim kontenti tili talabaning ta'lim tiliga mos bo'lishi shart"
        }

        if (!program.informationTechnologyProgram && req.citizenship == Citizenship.UZBEKISTAN) {
            val current = studentRepository.countByProgramIdAndEducationFormAndStudentStatusAndCitizenship(
                programId,
                EducationForm.DISTANCE,
                StudentStatus.ACTIVE,
                Citizenship.UZBEKISTAN,
            )
            val limit = program.distanceAdmissionLimit
                ?: Decision559Rules.regulatoryLimit(program.degreeLevel)
                ?: throw IllegalArgumentException("Yo'nalish uchun masofaviy qabul limiti aniqlanmagan")
            require(current < limit) {
                "${program.name} yo'nalishi bo'yicha masofaviy qabul limiti ($limit) to'lgan"
            }
        }

        val activeTeachers = teacherRepository.countByActiveTrue()
        require(activeTeachers > 0) {
            "Masofaviy talabani qabul qilishdan oldin kamida bitta faol o'qituvchi ro'yxatdan o'tkazilishi kerak"
        }
        val activeDistanceStudents = studentRepository.countByEducationFormAndStudentStatus(
            EducationForm.DISTANCE,
            StudentStatus.ACTIVE,
        )
        require(activeDistanceStudents + 1 <= activeTeachers * Decision559Rules.MAX_STUDENTS_PER_TEACHER) {
            "559-son qarordagi 1:${Decision559Rules.MAX_STUDENTS_PER_TEACHER} o'qituvchi-talaba normasi buziladi"
        }
    }

    @Transactional
    fun update(id: Long, req: StudentUpdateRequest): StudentDto {
        val student = studentRepository.findById(id)
            .orElseThrow { NoSuchElementException("Talaba topilmadi: $id") }

        validateDistanceUpdate(student, req)

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

    private fun validateDistanceUpdate(student: StudentProfile, req: StudentUpdateRequest) {
        val futureForm = req.educationForm ?: student.educationForm
        if (futureForm != EducationForm.DISTANCE) return

        val futureProgramId = req.programId ?: student.programId
        val programId = requireNotNull(futureProgramId) { "Masofaviy ta'lim uchun yo'nalish tanlanishi shart" }
        val program = programRepository.findById(programId)
            .orElseThrow { IllegalArgumentException("Yo'nalish topilmadi: $programId") }
        val futureDegree = req.degreeLevel ?: student.degreeLevel
        val futureLanguage = req.educationLanguage ?: student.educationLanguage
        val futurePayment = req.paymentType ?: student.paymentType
        val futureStatus = req.studentStatus ?: student.studentStatus

        require(program.distanceEnabled) { "${program.name} yo'nalishida masofaviy ta'limga ruxsat berilmagan" }
        require(program.degreeLevel.equals(futureDegree.name, ignoreCase = true)) { "Talabaning ta'lim darajasi yo'nalish darajasiga mos emas" }
        require(futurePayment == PaymentType.CONTRACT) { "Masofaviy ta'lim to'lov-kontrakt asosida amalga oshiriladi" }
        require(program.educationLanguage.equals(futureLanguage, ignoreCase = true)) { "Ta'lim kontenti tili talabaning ta'lim tiliga mos bo'lishi shart" }

        val entersTargetProgram = student.educationForm != EducationForm.DISTANCE || student.programId != programId || student.studentStatus != StudentStatus.ACTIVE
        if (!program.informationTechnologyProgram && student.citizenship == Citizenship.UZBEKISTAN && futureStatus == StudentStatus.ACTIVE) {
            val current = studentRepository.countByProgramIdAndEducationFormAndStudentStatusAndCitizenship(
                programId, EducationForm.DISTANCE, StudentStatus.ACTIVE, Citizenship.UZBEKISTAN,
            )
            val limit = program.distanceAdmissionLimit ?: Decision559Rules.regulatoryLimit(program.degreeLevel)
                ?: throw IllegalArgumentException("Yo'nalish uchun masofaviy qabul limiti aniqlanmagan")
            require(current + (if (entersTargetProgram) 1 else 0) <= limit) { "${program.name} yo'nalishi bo'yicha masofaviy qabul limiti ($limit) to'lgan" }
        }

        if (futureStatus == StudentStatus.ACTIVE && (student.educationForm != EducationForm.DISTANCE || student.studentStatus != StudentStatus.ACTIVE)) {
            val teachers = teacherRepository.countByActiveTrue()
            val current = studentRepository.countByEducationFormAndStudentStatus(EducationForm.DISTANCE, StudentStatus.ACTIVE)
            require(teachers > 0 && current + 1 <= teachers * Decision559Rules.MAX_STUDENTS_PER_TEACHER) {
                "559-son qarordagi 1:${Decision559Rules.MAX_STUDENTS_PER_TEACHER} o'qituvchi-talaba normasi buziladi"
            }
        }
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
