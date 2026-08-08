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
import uz.scorm.lms.app.v1.admission.model.AdmissionPolicyStatus
import uz.scorm.lms.app.v1.admission.model.DistanceAdmissionPolicy
import uz.scorm.lms.app.v1.admission.model.InstitutionGovernanceType
import uz.scorm.lms.app.v1.admission.repository.DistanceAdmissionPolicyRepository
import uz.scorm.lms.app.v1.license.model.NonStateLicenseStatus
import uz.scorm.lms.app.v1.license.repository.NonStateLicenseProgramScopeRepository
import uz.scorm.lms.app.v1.user.model.UserStatus
import uz.scorm.lms.app.v1.user.service.UserService
import uz.scorm.lms.app.v1.restriction.service.DistanceProgramRestrictionService
import java.time.LocalDate

@Service
class StudentService(
    private val studentRepository: StudentRepository,
    private val userService: UserService,
    private val programRepository: ProgramRepository,
    private val teacherRepository: TeacherRepository,
    private val admissionPolicyRepository: DistanceAdmissionPolicyRepository,
    private val licenseScopeRepository: NonStateLicenseProgramScopeRepository,
    private val restrictionService: DistanceProgramRestrictionService,
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
    fun register(req: StudentRegistrationRequest): StudentDto {
        require(req.pinfl.matches(Regex("\\d{14}"))) { "JSHSHIR 14 ta raqamdan iborat bo'lishi shart" }
        require(req.firstName.trim().isNotBlank() && req.lastName.trim().isNotBlank()) {
            "Talabaning ism va familiyasi majburiy"
        }
        require(req.studentNumber.trim().isNotBlank()) { "Talaba raqami majburiy" }
        if (studentRepository.existsByPinfl(req.pinfl))
            throw IllegalArgumentException("Bu PINFL allaqachon ro'yxatdan o'tgan: ${req.pinfl}")
        if (studentRepository.existsByStudentNumber(req.studentNumber.trim()))
            throw IllegalArgumentException("Bu talaba raqami band: ${req.studentNumber}")

        val user = userService.register(req.studentNumber.trim(), req.password, "student")
        user.email = req.email
        user.phone = req.phoneNumber
        user.status = UserStatus.INACTIVE
        val student = StudentProfile(
            user = user,
            pinfl = req.pinfl,
            lastName = req.lastName.trim(),
            firstName = req.firstName.trim(),
            middleName = req.middleName?.trim()?.takeIf(String::isNotBlank),
            birthDate = req.birthDate,
            gender = req.gender,
            citizenship = req.citizenship,
            passportType = req.passportType,
            passportSeries = req.passportSeries,
            passportNumber = req.passportNumber,
            passportIssuedDate = req.passportIssuedDate,
            passportExpiryDate = req.passportExpiryDate,
            passportIssuedBy = req.passportIssuedBy,
            photoUrl = req.photoUrl,
            phoneNumber = req.phoneNumber,
            email = req.email,
            permanentRegion = req.permanentRegion,
            permanentDistrict = req.permanentDistrict,
            permanentAddress = req.permanentAddress,
            currentRegion = req.currentRegion,
            currentDistrict = req.currentDistrict,
            currentAddress = req.currentAddress,
            studentNumber = req.studentNumber.trim(),
            studentStatus = StudentStatus.REGISTERED,
        )
        return toDto(studentRepository.save(student))
    }

    fun validateAcademicAdmission(student: StudentProfile, req: StudentAcademicAdmissionRequest) {
        require(req.courseNumber in 1..6) { "Kurs 1-6 oralig'ida bo'lishi shart" }
        val group = req.groupId?.let { groupId ->
            // Group ownership is checked in lifecycle service where GroupRepository is available.
            groupId
        }
        validateDistanceAdmission(StudentCreateRequest(
            pinfl = student.pinfl,
            lastName = student.lastName,
            firstName = student.firstName,
            middleName = student.middleName,
            birthDate = student.birthDate,
            gender = student.gender,
            citizenship = student.citizenship,
            studentNumber = student.studentNumber,
            universityId = req.universityId,
            facultyId = req.facultyId,
            departmentId = req.departmentId,
            programId = req.programId,
            degreeLevel = req.degreeLevel,
            educationForm = req.educationForm,
            educationLanguage = req.educationLanguage.trim(),
            courseNumber = req.courseNumber,
            groupId = group,
            academicYear = req.academicYear,
            admissionDate = req.effectiveDate,
            paymentType = req.paymentType,
            contractNumber = req.contractNumber,
            contractAmount = req.contractAmount,
        ))
    }

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
            lmsOrientationRequired = Decision559Rules.requiresLmsOrientation(
                req.educationForm == EducationForm.DISTANCE,
                req.citizenship != Citizenship.UZBEKISTAN,
            ),
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
        require(program.active && !program.deleted) {
            "Faqat faol ta'lim dasturiga masofaviy qabul qilish mumkin"
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
        Decision559Rules.validateStudyDuration(
            program.distanceEnabled,
            program.fullTimeDurationMonths,
            program.distanceDurationMonths,
        )
        Decision559Rules.validateFullTimeCounterpart(
            program.distanceEnabled,
            program.informationTechnologyProgram,
            program.fullTimeAvailable,
            program.fullTimeBasisReference,
        )
        restrictionService.requireAllowed(program.code, program.degreeLevel, program.distanceEnabled, req.admissionDate ?: LocalDate.now())

        val academicYear = requireNotNull(req.academicYear?.trim()?.takeIf(String::isNotBlank)) {
            "Masofaviy qabul uchun o'quv yili majburiy"
        }
        val policy = requireApprovedAdmissionPolicy(programId, academicYear)
        validateNonStateLicenseCoverage(policy, programId, req.admissionDate ?: LocalDate.now())
        val contractAmount = requireNotNull(req.contractAmount) {
            "Masofaviy qabul uchun tasdiqlangan kontrakt qiymati majburiy"
        }
        require(contractAmount.compareTo(policy.contractAmount) == 0) {
            "Kontrakt qiymati tasdiqlangan qabul siyosatidagi ${policy.contractAmount} UZS qiymatiga mos emas"
        }
        val admitted = studentRepository.countByProgramIdAndAcademicYearAndEducationForm(
            programId, academicYear, EducationForm.DISTANCE,
        )
        require(admitted < policy.admissionQuota) {
            "${program.name} yo'nalishining $academicYear o'quv yili uchun tasdiqlangan qabul parametri (${policy.admissionQuota}) to'lgan"
        }

        if (!program.informationTechnologyProgram && req.citizenship == Citizenship.UZBEKISTAN) {
            val current = studentRepository.countByProgramIdAndAcademicYearAndEducationFormAndCitizenship(
                programId,
                academicYear,
                EducationForm.DISTANCE,
                Citizenship.UZBEKISTAN,
            )
            val limit = Decision559Rules.regulatoryLimit(program.degreeLevel)
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

        require(req.studentStatus == null || req.studentStatus == student.studentStatus) {
            "Talaba statusi faqat buyruqli lifecycle endpointi orqali o'zgartiriladi"
        }
        require(req.programId == null || req.programId == student.programId) {
            "Ta'lim dasturi faqat buyruqli TRANSFER lifecycle'i orqali o'zgartiriladi"
        }
        require(req.groupId == null || req.groupId == student.groupId) {
            "Guruh faqat buyruqli TRANSFER lifecycle'i orqali o'zgartiriladi"
        }
        require(req.facultyId == null || req.facultyId == student.facultyId) {
            "Fakultet faqat buyruqli TRANSFER lifecycle'i orqali o'zgartiriladi"
        }
        require(req.departmentId == null || req.departmentId == student.departmentId) {
            "Kafedra faqat buyruqli TRANSFER lifecycle'i orqali o'zgartiriladi"
        }
        require(req.degreeLevel == null || req.degreeLevel == student.degreeLevel) {
            "Ta'lim darajasi faqat rasmiy akademik lifecycle orqali o'zgartiriladi"
        }
        require(req.educationForm == null || req.educationForm == student.educationForm) {
            "Ta'lim shakli faqat rasmiy akademik lifecycle orqali o'zgartiriladi"
        }

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
        val entersDistanceEducation = student.educationForm != EducationForm.DISTANCE &&
            req.educationForm == EducationForm.DISTANCE
        req.educationForm?.let     { student.educationForm = it }
        req.educationLanguage?.let { student.educationLanguage = it }
        req.courseNumber?.let      { student.courseNumber = it }
        req.groupId?.let           { student.groupId = it }
        req.academicYear?.let      { student.academicYear = it }
        req.studentStatus?.let     { student.studentStatus = it }
        req.paymentType?.let       { student.paymentType = it }
        req.contractNumber?.let    { student.contractNumber = it }
        req.contractAmount?.let    { student.contractAmount = it }

        if (entersDistanceEducation) {
            student.lmsOrientationRequired = Decision559Rules.requiresLmsOrientation(
                isDistanceEducation = true,
                isForeignCitizen = student.citizenship != Citizenship.UZBEKISTAN,
            )
            student.lmsOrientationCompletedAt = null
        }

        return toDto(studentRepository.save(student))
    }

    private fun validateDistanceUpdate(student: StudentProfile, req: StudentUpdateRequest, effectiveDate: LocalDate = LocalDate.now()) {
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
        val futureAcademicYear = req.academicYear ?: student.academicYear
        val futureContractAmount = req.contractAmount ?: student.contractAmount

        require(program.distanceEnabled) { "${program.name} yo'nalishida masofaviy ta'limga ruxsat berilmagan" }
        require(program.active && !program.deleted) { "Faqat faol ta'lim dasturidan foydalanish mumkin" }
        require(program.degreeLevel.equals(futureDegree.name, ignoreCase = true)) { "Talabaning ta'lim darajasi yo'nalish darajasiga mos emas" }
        require(futurePayment == PaymentType.CONTRACT) { "Masofaviy ta'lim to'lov-kontrakt asosida amalga oshiriladi" }
        require(program.educationLanguage.equals(futureLanguage, ignoreCase = true)) { "Ta'lim kontenti tili talabaning ta'lim tiliga mos bo'lishi shart" }
        Decision559Rules.validateStudyDuration(
            program.distanceEnabled,
            program.fullTimeDurationMonths,
            program.distanceDurationMonths,
        )
        Decision559Rules.validateFullTimeCounterpart(
            program.distanceEnabled,
            program.informationTechnologyProgram,
            program.fullTimeAvailable,
            program.fullTimeBasisReference,
        )
        if (futureStatus == StudentStatus.ACTIVE) {
            restrictionService.requireAllowed(program.code, program.degreeLevel, program.distanceEnabled, effectiveDate)
        }

        val entersPolicyCohort = student.educationForm != EducationForm.DISTANCE || student.programId != programId || student.academicYear != futureAcademicYear
        if (futureStatus == StudentStatus.ACTIVE) {
            val academicYear = requireNotNull(futureAcademicYear?.trim()?.takeIf(String::isNotBlank)) {
                "Faol masofaviy talaba uchun o'quv yili majburiy"
            }
            val policy = requireApprovedAdmissionPolicy(programId, academicYear)
            validateNonStateLicenseCoverage(policy, programId, effectiveDate)
            val contractAmount = requireNotNull(futureContractAmount) {
                "Faol masofaviy talaba uchun kontrakt qiymati majburiy"
            }
            require(contractAmount.compareTo(policy.contractAmount) == 0) {
                "Kontrakt qiymati tasdiqlangan qabul siyosatidagi ${policy.contractAmount} UZS qiymatiga mos emas"
            }
            val current = studentRepository.countByProgramIdAndAcademicYearAndEducationForm(
                programId, academicYear, EducationForm.DISTANCE,
            )
            require(current + (if (entersPolicyCohort) 1 else 0) <= policy.admissionQuota) {
                "${program.name} yo'nalishining $academicYear o'quv yili uchun tasdiqlangan qabul parametri (${policy.admissionQuota}) to'lgan"
            }
        }
        if (!program.informationTechnologyProgram && student.citizenship == Citizenship.UZBEKISTAN && futureStatus == StudentStatus.ACTIVE) {
            val academicYear = requireNotNull(futureAcademicYear?.trim()?.takeIf(String::isNotBlank))
            val current = studentRepository.countByProgramIdAndAcademicYearAndEducationFormAndCitizenship(
                programId, academicYear, EducationForm.DISTANCE, Citizenship.UZBEKISTAN,
            )
            val limit = Decision559Rules.regulatoryLimit(program.degreeLevel)
                ?: throw IllegalArgumentException("Yo'nalish uchun masofaviy qabul limiti aniqlanmagan")
            require(current + (if (entersPolicyCohort) 1 else 0) <= limit) { "${program.name} yo'nalishi bo'yicha masofaviy qabul limiti ($limit) to'lgan" }
        }

        if (futureStatus == StudentStatus.ACTIVE && (student.educationForm != EducationForm.DISTANCE || student.studentStatus != StudentStatus.ACTIVE)) {
            val teachers = teacherRepository.countByActiveTrue()
            val current = studentRepository.countByEducationFormAndStudentStatus(EducationForm.DISTANCE, StudentStatus.ACTIVE)
            require(teachers > 0 && current + 1 <= teachers * Decision559Rules.MAX_STUDENTS_PER_TEACHER) {
                "559-son qarordagi 1:${Decision559Rules.MAX_STUDENTS_PER_TEACHER} o'qituvchi-talaba normasi buziladi"
            }
        }
    }

    fun validateLifecyclePlacement(
        student: StudentProfile,
        targetProgramId: Long?,
        targetStatus: StudentStatus,
        academicYear: String? = student.academicYear,
        effectiveDate: LocalDate = LocalDate.now(),
    ) {
        validateDistanceUpdate(student, StudentUpdateRequest(
            programId = targetProgramId,
            studentStatus = targetStatus,
            academicYear = academicYear,
        ), effectiveDate)
    }

    private fun validateNonStateLicenseCoverage(policy: DistanceAdmissionPolicy, programId: Long, effectiveDate: LocalDate) {
        if (policy.institutionGovernanceType != InstitutionGovernanceType.NON_STATE) return
        require(licenseScopeRepository.existsEffectiveCoverage(programId, NonStateLicenseStatus.VERIFIED, effectiveDate)) {
            "Nodavlat OTMning masofaviy dasturi $effectiveDate sanasida amaldagi va tekshirilgan litsenziyada qayd etilmagan"
        }
    }

    private fun requireApprovedAdmissionPolicy(programId: Long, academicYear: String) =
        admissionPolicyRepository.findByProgramIdAndAcademicYearAndStatusAndDeletedFalse(
            programId, academicYear, AdmissionPolicyStatus.APPROVED,
        ) ?: throw IllegalArgumentException(
            "$academicYear o'quv yili uchun 559-son qarorning 15-bandiga muvofiq tasdiqlangan qabul parametri va kontrakt qiymati topilmadi"
        )

    @Transactional
    fun promote(id: Long): StudentDto {
        val student = studentRepository.findById(id)
            .orElseThrow { NoSuchElementException("Talaba topilmadi: $id") }
        require(student.studentStatus == StudentStatus.ACTIVE) { "Faqat faol talaba keyingi kursga o'tkaziladi" }
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
        programId            = s.programId.takeUnless { s.studentStatus == StudentStatus.REGISTERED },
        degreeLevel          = s.degreeLevel.takeUnless { s.studentStatus == StudentStatus.REGISTERED },
        educationForm        = s.educationForm.takeUnless { s.studentStatus == StudentStatus.REGISTERED },
        educationLanguage    = s.educationLanguage.takeUnless { s.studentStatus == StudentStatus.REGISTERED },
        courseNumber         = s.courseNumber.takeUnless { s.studentStatus == StudentStatus.REGISTERED },
        groupId              = s.groupId.takeUnless { s.studentStatus == StudentStatus.REGISTERED },
        academicYear         = s.academicYear.takeUnless { s.studentStatus == StudentStatus.REGISTERED },
        admissionDate        = s.admissionDate,
        admissionOrderNumber = s.admissionOrderNumber,
        studentStatus        = s.studentStatus,
        paymentType          = s.paymentType,
        contractNumber       = s.contractNumber,
        contractAmount       = s.contractAmount,
        lmsOrientationRequired = s.lmsOrientationRequired,
        lmsOrientationCompletedAt = s.lmsOrientationCompletedAt,
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
        facultyId     = s.facultyId.takeUnless { s.studentStatus == StudentStatus.REGISTERED },
        groupId       = s.groupId.takeUnless { s.studentStatus == StudentStatus.REGISTERED },
        courseNumber  = s.courseNumber.takeUnless { s.studentStatus == StudentStatus.REGISTERED },
        degreeLevel   = s.degreeLevel.takeUnless { s.studentStatus == StudentStatus.REGISTERED },
        studentStatus = s.studentStatus,
        photoUrl      = s.photoUrl,
        lmsOrientationRequired = s.lmsOrientationRequired,
    )
}
