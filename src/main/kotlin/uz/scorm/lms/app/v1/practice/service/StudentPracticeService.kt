package uz.scorm.lms.app.v1.practice.service

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.audit.service.AuditService
import uz.scorm.lms.app.v1.practice.dto.CompleteStudentPracticeRequest
import uz.scorm.lms.app.v1.practice.dto.PracticeStudentOptionDto
import uz.scorm.lms.app.v1.practice.dto.SaveStudentPracticeRequest
import uz.scorm.lms.app.v1.practice.dto.StudentPracticeDto
import uz.scorm.lms.app.v1.practice.model.PracticePlacementBasis
import uz.scorm.lms.app.v1.practice.model.StudentPracticePlacement
import uz.scorm.lms.app.v1.practice.model.StudentPracticeStatus
import uz.scorm.lms.app.v1.practice.repository.StudentPracticeRepository
import uz.scorm.lms.app.v1.student.model.EducationForm
import uz.scorm.lms.app.v1.student.model.StudentStatus
import uz.scorm.lms.app.v1.student.repository.StudentRepository
import uz.scorm.lms.app.v1.user.repository.UserRepository
import java.time.Instant
import java.time.LocalDate

@Service
class StudentPracticeService(
    private val repository: StudentPracticeRepository,
    private val studentRepository: StudentRepository,
    private val userRepository: UserRepository,
    private val auditService: AuditService,
) {
    @Transactional(readOnly = true)
    fun list(): List<StudentPracticeDto> =
        repository.findAllByDeletedFalseOrderByStartsOnDesc().map(::toDto)

    @Transactional(readOnly = true)
    fun get(id: Long): StudentPracticeDto = toDto(requirePlacement(id))

    @Transactional(readOnly = true)
    fun eligibleStudents(): List<PracticeStudentOptionDto> =
        studentRepository.findAllByEducationFormAndStudentStatusOrderByLastNameAsc(EducationForm.DISTANCE, StudentStatus.ACTIVE)
            .map { PracticeStudentOptionDto(requireNotNull(it.id), it.studentNumber, it.fullName, it.academicYear) }

    @Transactional(readOnly = true)
    fun mine(userId: Long): List<StudentPracticeDto> {
        val student = studentRepository.findByUserId(userId)
            ?: throw NoSuchElementException("Talaba profili topilmadi")
        return repository.findAllByStudentIdAndDeletedFalseOrderByStartsOnDesc(requireNotNull(student.id)).map(::toDto)
    }

    @Transactional
    fun create(request: SaveStudentPracticeRequest, actorId: Long): StudentPracticeDto {
        val student = requireEligibleStudent(request.studentId)
        validate(request)
        require(!repository.existsByStudentIdAndAcademicYearAndPlanReferenceAndDeletedFalseAndStatusNot(
            request.studentId,
            request.academicYear,
            request.planReference.trim(),
            StudentPracticeStatus.CANCELLED,
        )) { "Talabaning ushbu o'quv reja amaliyoti allaqachon mavjud" }
        val saved = repository.save(StudentPracticePlacement(
            student = student,
            academicYear = request.academicYear,
            planReference = request.planReference.trim(),
            startsOn = request.startsOn,
            endsOn = request.endsOn,
            placementBasis = request.placementBasis,
            organizationName = request.organizationName.trim(),
            organizationAddress = request.organizationAddress.trim(),
            jobTitle = request.jobTitle.normalized(),
            specialtyMatchConfirmed = request.specialtyMatchConfirmed,
            agreementNumber = request.agreementNumber.normalized(),
            agreementDate = request.agreementDate,
            basisEvidenceReference = request.basisEvidenceReference.trim(),
            createdByUser = requireUser(actorId),
        ))
        auditService.logAction(
            "STUDENT_PRACTICE_CREATED",
            actorId,
            "practice=${saved.id}; student=${student.id}; basis=${saved.placementBasis}; plan=${saved.planReference.take(120)}",
        )
        return toDto(saved)
    }

    @Transactional
    fun update(id: Long, request: SaveStudentPracticeRequest, actorId: Long): StudentPracticeDto {
        val placement = requirePlacement(id)
        require(placement.status == StudentPracticeStatus.DRAFT) { "Faqat DRAFT amaliyot yozuvi tahrirlanadi" }
        require(request.studentId == placement.student.id) { "Amaliyot biriktirilgan talaba o'zgartirilmaydi" }
        requireEligibleStudent(request.studentId)
        validate(request)
        placement.academicYear = request.academicYear
        placement.planReference = request.planReference.trim()
        placement.startsOn = request.startsOn
        placement.endsOn = request.endsOn
        placement.placementBasis = request.placementBasis
        placement.organizationName = request.organizationName.trim()
        placement.organizationAddress = request.organizationAddress.trim()
        placement.jobTitle = request.jobTitle.normalized()
        placement.specialtyMatchConfirmed = request.specialtyMatchConfirmed
        placement.agreementNumber = request.agreementNumber.normalized()
        placement.agreementDate = request.agreementDate
        placement.basisEvidenceReference = request.basisEvidenceReference.trim()
        repository.save(placement)
        auditService.logAction("STUDENT_PRACTICE_UPDATED", actorId, "practice=$id; basis=${placement.placementBasis}")
        return toDto(placement)
    }

    @Transactional
    fun approve(id: Long, actorId: Long): StudentPracticeDto {
        val placement = requirePlacement(id)
        require(placement.status == StudentPracticeStatus.DRAFT) { "Faqat DRAFT amaliyot tasdiqlanadi" }
        validate(toRequest(placement))
        placement.status = StudentPracticeStatus.APPROVED
        placement.approvedAt = Instant.now()
        placement.approvedByUser = requireUser(actorId)
        repository.save(placement)
        auditService.logAction(
            "STUDENT_PRACTICE_APPROVED",
            actorId,
            "practice=$id; student=${placement.student.id}; basis=${placement.placementBasis}; evidence=${placement.basisEvidenceReference.take(120)}",
        )
        return toDto(placement)
    }

    @Transactional
    fun complete(id: Long, request: CompleteStudentPracticeRequest, actorId: Long): StudentPracticeDto {
        val placement = requirePlacement(id)
        require(placement.status == StudentPracticeStatus.APPROVED) { "Faqat APPROVED amaliyot yakunlanadi" }
        require(!placement.endsOn.isAfter(LocalDate.now())) { "Amaliyot muddati tugashidan oldin yakunlanmaydi" }
        require(request.summary.trim().length in 20..10_000) { "Yakuniy xulosa 20 dan 10000 belgigacha bo'lishi kerak" }
        require(request.evidenceReference.isNotBlank() && request.evidenceReference.trim().length <= 1000) {
            "Amaliyot natijasi dalil rekviziti majburiy"
        }
        placement.status = StudentPracticeStatus.COMPLETED
        placement.completionSummary = request.summary.trim()
        placement.completionEvidenceReference = request.evidenceReference.trim()
        placement.completedAt = Instant.now()
        placement.completedByUser = requireUser(actorId)
        repository.save(placement)
        auditService.logAction(
            "STUDENT_PRACTICE_COMPLETED",
            actorId,
            "practice=$id; student=${placement.student.id}; evidence=${placement.completionEvidenceReference?.take(120)}",
        )
        return toDto(placement)
    }

    @Transactional
    fun cancel(id: Long, actorId: Long): StudentPracticeDto {
        val placement = requirePlacement(id)
        require(placement.status in setOf(StudentPracticeStatus.DRAFT, StudentPracticeStatus.APPROVED)) {
            "Faqat DRAFT yoki APPROVED amaliyot bekor qilinadi"
        }
        placement.status = StudentPracticeStatus.CANCELLED
        placement.cancelledAt = Instant.now()
        placement.cancelledByUser = requireUser(actorId)
        repository.save(placement)
        auditService.logAction("STUDENT_PRACTICE_CANCELLED", actorId, "practice=$id; student=${placement.student.id}")
        return toDto(placement)
    }

    private fun validate(request: SaveStudentPracticeRequest) {
        require(request.academicYear.matches(Regex("\\d{4}-\\d{4}"))) { "O'quv yili YYYY-YYYY formatida bo'lishi kerak" }
        val (firstYear, secondYear) = request.academicYear.split("-").map(String::toInt)
        require(secondYear == firstYear + 1) { "O'quv yili ketma-ket ikki yildan iborat bo'lishi kerak" }
        require(!request.endsOn.isBefore(request.startsOn)) { "Amaliyot tugash sanasi boshlanish sanasidan oldin bo'lmasligi kerak" }
        val academicFrom = LocalDate.of(firstYear, 9, 1)
        val academicTo = LocalDate.of(secondYear, 8, 31)
        require(!request.startsOn.isBefore(academicFrom) && !request.endsOn.isAfter(academicTo)) {
            "Amaliyot sanalari ko'rsatilgan o'quv yili doirasida bo'lishi kerak"
        }
        require(request.planReference.isNotBlank() && request.planReference.trim().length <= 500) { "O'quv reja rekviziti majburiy" }
        require(request.organizationName.isNotBlank() && request.organizationName.trim().length <= 500) { "Amaliyot tashkiloti majburiy" }
        require(request.organizationAddress.isNotBlank() && request.organizationAddress.trim().length <= 1000) { "Amaliyot joyi manzili majburiy" }
        require(request.basisEvidenceReference.isNotBlank() && request.basisEvidenceReference.trim().length <= 1000) {
            "Joylashtirish asosi dalil rekviziti majburiy"
        }
        when (request.placementBasis) {
            PracticePlacementBasis.CURRENT_WORKPLACE -> {
                require(request.specialtyMatchConfirmed) { "Joriy ish joyi ta'lim yo'nalishiga mosligi tasdiqlanishi kerak" }
                require(!request.jobTitle.normalized().isNullOrBlank()) { "Joriy ish joyidagi lavozim majburiy" }
            }
            PracticePlacementBasis.PARTNER_ORGANIZATION -> {
                require(!request.agreementNumber.normalized().isNullOrBlank()) { "Hamkor tashkilot kelishuv raqami majburiy" }
                require(request.agreementDate != null) { "Hamkor tashkilot kelishuv sanasi majburiy" }
                require(!request.agreementDate.isAfter(request.startsOn)) { "Kelishuv amaliyot boshlanishidan kech bo'lmasligi kerak" }
            }
        }
    }

    private fun requireEligibleStudent(id: Long) = studentRepository.findById(id).orElseThrow {
        NoSuchElementException("Talaba topilmadi: $id")
    }.also {
        require(it.educationForm == EducationForm.DISTANCE) { "23-band workflowi faqat masofaviy ta'lim talabasiga qo'llanadi" }
        require(it.studentStatus == StudentStatus.ACTIVE) { "Amaliyot faqat faol talabaga biriktiriladi" }
    }

    private fun requirePlacement(id: Long) = repository.findByIdAndDeletedFalse(id)
        ?: throw NoSuchElementException("Talaba amaliyoti topilmadi: $id")

    private fun requireUser(id: Long) = userRepository.findById(id)
        .orElseThrow { NoSuchElementException("Foydalanuvchi topilmadi: $id") }

    private fun toRequest(placement: StudentPracticePlacement) = SaveStudentPracticeRequest(
        studentId = requireNotNull(placement.student.id),
        academicYear = placement.academicYear,
        planReference = placement.planReference,
        startsOn = placement.startsOn,
        endsOn = placement.endsOn,
        placementBasis = placement.placementBasis,
        organizationName = placement.organizationName,
        organizationAddress = placement.organizationAddress,
        jobTitle = placement.jobTitle,
        specialtyMatchConfirmed = placement.specialtyMatchConfirmed,
        agreementNumber = placement.agreementNumber,
        agreementDate = placement.agreementDate,
        basisEvidenceReference = placement.basisEvidenceReference,
    )

    private fun toDto(placement: StudentPracticePlacement) = StudentPracticeDto(
        id = requireNotNull(placement.id),
        studentId = requireNotNull(placement.student.id),
        studentNumber = placement.student.studentNumber,
        studentName = placement.student.fullName,
        academicYear = placement.academicYear,
        planReference = placement.planReference,
        startsOn = placement.startsOn,
        endsOn = placement.endsOn,
        placementBasis = placement.placementBasis.name,
        organizationName = placement.organizationName,
        organizationAddress = placement.organizationAddress,
        jobTitle = placement.jobTitle,
        specialtyMatchConfirmed = placement.specialtyMatchConfirmed,
        agreementNumber = placement.agreementNumber,
        agreementDate = placement.agreementDate,
        basisEvidenceReference = placement.basisEvidenceReference,
        ruleCompliant = when (placement.placementBasis) {
            PracticePlacementBasis.CURRENT_WORKPLACE -> placement.specialtyMatchConfirmed && !placement.jobTitle.isNullOrBlank()
            PracticePlacementBasis.PARTNER_ORGANIZATION -> !placement.agreementNumber.isNullOrBlank() && placement.agreementDate != null
        },
        status = placement.status.name,
        approvedAt = placement.approvedAt,
        approvedByName = placement.approvedByUser?.fullName ?: placement.approvedByUser?.username,
        completionSummary = placement.completionSummary,
        completionEvidenceReference = placement.completionEvidenceReference,
        completedAt = placement.completedAt,
        cancelledAt = placement.cancelledAt,
    )

    private fun String?.normalized(): String? = this?.trim()?.takeIf(String::isNotEmpty)
}
