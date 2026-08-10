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
import uz.scorm.lms.app.v1.audit.service.AuditService
import uz.scorm.lms.app.v1.classifier.service.GeographyClassifierService
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
    private val auditService: AuditService,
    private val classifierService: GeographyClassifierService,
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
    fun register(req: StudentRegistrationRequest, actorId: Long? = null): StudentDto {
        val resolvedCitizenship = classifierService.resolveCitizenship(req.citizenshipCountryId, req.citizenship)
        val permanent = classifierService.resolveAddress(req.permanentRegionId, req.permanentDistrictId, req.permanentRegion, req.permanentDistrict)
        val current = classifierService.resolveAddress(req.currentRegionId, req.currentDistrictId, req.currentRegion, req.currentDistrict)
        validatePersonalData(
            pinfl = req.pinfl,
            firstName = req.firstName,
            lastName = req.lastName,
            middleName = req.middleName,
            birthDate = req.birthDate,
            passportType = req.passportType,
            passportSeries = req.passportSeries,
            passportNumber = req.passportNumber,
            passportIssuedDate = req.passportIssuedDate,
            passportExpiryDate = req.passportExpiryDate,
            passportIssuedBy = req.passportIssuedBy,
            phoneNumber = req.phoneNumber,
            email = req.email,
            photoUrl = req.photoUrl,
            permanentRegion = permanent.regionName,
            permanentDistrict = permanent.districtName,
            permanentAddress = req.permanentAddress,
            currentRegion = current.regionName,
            currentDistrict = current.districtName,
            currentAddress = req.currentAddress,
        )
        require(req.studentNumber.trim().isNotBlank()) { "Talaba raqami majburiy" }
        if (studentRepository.existsByPinfl(req.pinfl))
            throw IllegalArgumentException("Bu PINFL allaqachon ro'yxatdan o'tgan: ${req.pinfl}")
        if (studentRepository.existsByStudentNumber(req.studentNumber.trim()))
            throw IllegalArgumentException("Bu talaba raqami band: ${req.studentNumber}")

        val user = userService.register(req.studentNumber.trim(), req.password, "student")
        user.fullName = listOf(req.lastName.trim(), req.firstName.trim(), normalized(req.middleName)).filterNotNull().joinToString(" ")
        user.email = normalized(req.email)?.lowercase()
        user.phone = normalized(req.phoneNumber)
        user.status = UserStatus.INACTIVE
        val student = StudentProfile(
            user = user,
            pinfl = req.pinfl,
            lastName = req.lastName.trim(),
            firstName = req.firstName.trim(),
            middleName = req.middleName?.trim()?.takeIf(String::isNotBlank),
            birthDate = req.birthDate,
            gender = req.gender,
            citizenship = resolvedCitizenship.citizenship,
            citizenshipCountryId = resolvedCitizenship.countryId,
            passportType = req.passportType,
            passportSeries = normalized(req.passportSeries)?.uppercase(),
            passportNumber = normalized(req.passportNumber)?.uppercase(),
            passportIssuedDate = req.passportIssuedDate,
            passportExpiryDate = req.passportExpiryDate,
            passportIssuedBy = normalized(req.passportIssuedBy),
            photoUrl = normalized(req.photoUrl),
            phoneNumber = normalized(req.phoneNumber),
            email = normalized(req.email)?.lowercase(),
            permanentRegion = permanent.regionName,
            permanentRegionId = permanent.regionId,
            permanentDistrict = permanent.districtName,
            permanentDistrictId = permanent.districtId,
            permanentAddress = normalized(req.permanentAddress),
            currentRegion = current.regionName,
            currentRegionId = current.regionId,
            currentDistrict = current.districtName,
            currentDistrictId = current.districtId,
            currentAddress = normalized(req.currentAddress),
            studentNumber = req.studentNumber.trim(),
            studentStatus = StudentStatus.REGISTERED,
        )
        val saved = studentRepository.save(student)
        actorId?.let {
            auditService.logAction(
                "STUDENT_PERSONAL_CARD_CREATED",
                it,
                "student=${saved.id}; account=INACTIVE; academic=UNASSIGNED",
            )
        }
        return toDto(saved)
    }

    @Transactional
    fun updatePersonalProfile(id: Long, req: StudentPersonalProfileUpdateRequest, actorId: Long? = null): StudentDto {
        val student = studentRepository.findById(id)
            .orElseThrow { NoSuchElementException("Talaba topilmadi: $id") }
        val permanent = classifierService.resolveAddress(req.permanentRegionId, req.permanentDistrictId, req.permanentRegion, req.permanentDistrict)
        val current = classifierService.resolveAddress(req.currentRegionId, req.currentDistrictId, req.currentRegion, req.currentDistrict)
        validatePersonalData(
            pinfl = student.pinfl,
            firstName = req.firstName,
            lastName = req.lastName,
            middleName = req.middleName,
            birthDate = student.birthDate,
            passportType = req.passportType,
            passportSeries = req.passportSeries,
            passportNumber = req.passportNumber,
            passportIssuedDate = req.passportIssuedDate,
            passportExpiryDate = req.passportExpiryDate,
            passportIssuedBy = req.passportIssuedBy,
            phoneNumber = req.phoneNumber,
            email = req.email,
            photoUrl = req.photoUrl,
            permanentRegion = permanent.regionName,
            permanentDistrict = permanent.districtName,
            permanentAddress = req.permanentAddress,
            currentRegion = current.regionName,
            currentDistrict = current.districtName,
            currentAddress = req.currentAddress,
        )
        student.lastName = req.lastName.trim()
        student.firstName = req.firstName.trim()
        student.middleName = normalized(req.middleName)
        student.passportType = req.passportType
        student.passportSeries = normalized(req.passportSeries)?.uppercase()
        student.passportNumber = normalized(req.passportNumber)?.uppercase()
        student.passportIssuedDate = req.passportIssuedDate
        student.passportExpiryDate = req.passportExpiryDate
        student.passportIssuedBy = normalized(req.passportIssuedBy)
        student.photoUrl = normalized(req.photoUrl)
        student.phoneNumber = normalized(req.phoneNumber)
        student.email = normalized(req.email)?.lowercase()
        student.permanentRegion = permanent.regionName
        student.permanentRegionId = permanent.regionId
        student.permanentDistrict = permanent.districtName
        student.permanentDistrictId = permanent.districtId
        student.permanentAddress = normalized(req.permanentAddress)
        student.currentRegion = current.regionName
        student.currentRegionId = current.regionId
        student.currentDistrict = current.districtName
        student.currentDistrictId = current.districtId
        student.currentAddress = normalized(req.currentAddress)
        student.user.fullName = student.fullName
        student.user.phone = student.phoneNumber
        student.user.email = student.email
        val saved = studentRepository.save(student)
        actorId?.let {
            auditService.logAction(
                "STUDENT_PERSONAL_PROFILE_UPDATED",
                it,
                "student=$id",
            )
        }
        return toDto(saved)
    }

    private fun validatePersonalData(
        pinfl: String,
        firstName: String,
        lastName: String,
        middleName: String?,
        birthDate: LocalDate,
        passportType: uz.scorm.lms.app.v1.student.model.PassportType?,
        passportSeries: String?,
        passportNumber: String?,
        passportIssuedDate: LocalDate?,
        passportExpiryDate: LocalDate?,
        passportIssuedBy: String?,
        phoneNumber: String?,
        email: String?,
        photoUrl: String?,
        permanentRegion: String?,
        permanentDistrict: String?,
        permanentAddress: String?,
        currentRegion: String?,
        currentDistrict: String?,
        currentAddress: String?,
    ) {
        require(pinfl.matches(Regex("\\d{14}"))) { "JSHSHIR 14 ta raqamdan iborat bo'lishi shart" }
        require(birthDate.isBefore(LocalDate.now())) { "Tug'ilgan sana bugundan oldin bo'lishi shart" }
        require(firstName.trim().length in 2..100) { "Ism 2-100 belgi bo'lishi shart" }
        require(lastName.trim().length in 2..100) { "Familiya 2-100 belgi bo'lishi shart" }
        require(middleName == null || middleName.trim().length <= 100) { "Otasining ismi 100 belgidan oshmasligi kerak" }
        val series = normalized(passportSeries)
        val number = normalized(passportNumber)
        val hasPassportDetails = passportType != null || series != null || number != null ||
            passportIssuedDate != null || passportExpiryDate != null || normalized(passportIssuedBy) != null
        if (hasPassportDetails) {
            require(passportType != null) { "Pasport turi majburiy" }
            require(number != null && number.length in 5..20) { "Pasport raqami 5-20 belgi bo'lishi shart" }
            require(series == null || series.length <= 10) { "Pasport seriyasi 10 belgidan oshmasligi kerak" }
        }
        require(passportIssuedDate == null || !passportIssuedDate.isAfter(LocalDate.now())) {
            "Pasport berilgan sana kelajakda bo'lishi mumkin emas"
        }
        require(passportIssuedDate == null || passportExpiryDate == null || passportExpiryDate.isAfter(passportIssuedDate)) {
            "Pasport amal qilish sanasi berilgan sanadan keyin bo'lishi shart"
        }
        normalized(phoneNumber)?.let {
            require(it.matches(Regex("\\+?[0-9 ()-]{7,20}"))) { "Telefon raqami formati noto'g'ri" }
        }
        normalized(email)?.let {
            require(it.length <= 150 && it.matches(Regex("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$"))) { "Email formati noto'g'ri" }
        }
        require(normalized(passportIssuedBy)?.length?.let { it <= 300 } != false) { "Pasport bergan organ 300 belgidan oshmasligi kerak" }
        normalized(photoUrl)?.let {
            require(it.length <= 500 && it.startsWith("https://", ignoreCase = true)) {
                "Foto URL xavfsiz HTTPS manzil bo'lishi shart"
            }
        }
        listOf(permanentRegion, permanentDistrict, currentRegion, currentDistrict).forEach {
            require(normalized(it)?.length?.let { length -> length <= 100 } != false) { "Hudud yoki tuman nomi 100 belgidan oshmasligi kerak" }
        }
        listOf(permanentAddress, currentAddress).forEach {
            require(normalized(it)?.length?.let { length -> length <= 500 } != false) { "Manzil 500 belgidan oshmasligi kerak" }
        }
    }

    private fun normalized(value: String?): String? = value?.trim()?.takeIf(String::isNotBlank)

    fun validateAcademicAdmission(student: StudentProfile, req: StudentAcademicAdmissionRequest) {
        require(req.semesterNumber in 1..12) { "Semestr 1-12 oralig'ida bo'lishi shart" }
        val calculatedCourse = ((req.semesterNumber - 1) / 2) + 1
        require(req.courseNumber == calculatedCourse) {
            "Kurs tanlangan semestrga mos emas: ${req.semesterNumber}-semestr uchun $calculatedCourse-kurs"
        }
        require(req.courseNumber in 1..6) { "Kurs 1-6 oralig'ida bo'lishi shart" }
        val academicYear = requireNotNull(req.academicYear?.trim()?.takeIf(String::isNotBlank)) {
            "O'quv yili tanlanishi shart"
        }
        require(academicYear.matches(Regex("\\d{4}-\\d{4}"))) {
            "O'quv yili YYYY-YYYY formatida bo'lishi kerak"
        }
        val (startYear, endYear) = academicYear.split("-").map(String::toInt)
        require(endYear == startYear + 1) { "O'quv yili ketma-ket ikki yildan iborat bo'lishi kerak" }
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
        student.semesterNumber = student.semesterNumber?.let { (it + 2).coerceAtMost(12) }
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
        citizenshipCountryId = s.citizenshipCountryId,
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
        permanentRegionId    = s.permanentRegionId,
        permanentDistrict    = s.permanentDistrict,
        permanentDistrictId  = s.permanentDistrictId,
        permanentAddress     = s.permanentAddress,
        currentRegion        = s.currentRegion,
        currentRegionId      = s.currentRegionId,
        currentDistrict      = s.currentDistrict,
        currentDistrictId    = s.currentDistrictId,
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
        semesterNumber       = s.semesterNumber.takeUnless { s.studentStatus == StudentStatus.REGISTERED },
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
        semesterNumber = s.semesterNumber.takeUnless { s.studentStatus == StudentStatus.REGISTERED },
        degreeLevel   = s.degreeLevel.takeUnless { s.studentStatus == StudentStatus.REGISTERED },
        studentStatus = s.studentStatus,
        photoUrl      = s.photoUrl,
        lmsOrientationRequired = s.lmsOrientationRequired,
        username      = s.user.username,
        accountStatus = s.user.status,
        accountEnabled = s.user.status == UserStatus.ACTIVE,
    )
}
