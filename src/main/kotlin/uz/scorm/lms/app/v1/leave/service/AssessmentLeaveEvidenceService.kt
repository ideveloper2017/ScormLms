package uz.scorm.lms.app.v1.leave.service

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.audit.service.AuditService
import uz.scorm.lms.app.v1.leave.dto.AssessmentLeaveEvidenceDto
import uz.scorm.lms.app.v1.leave.dto.AssessmentLeaveStudentOptionDto
import uz.scorm.lms.app.v1.leave.dto.RejectAssessmentLeaveEvidenceRequest
import uz.scorm.lms.app.v1.leave.dto.SaveAssessmentLeaveEvidenceRequest
import uz.scorm.lms.app.v1.leave.dto.VerifyAssessmentLeaveEvidenceRequest
import uz.scorm.lms.app.v1.leave.model.AssessmentLeaveEvidence
import uz.scorm.lms.app.v1.leave.model.AssessmentLeavePurpose
import uz.scorm.lms.app.v1.leave.model.AssessmentLeaveStatus
import uz.scorm.lms.app.v1.leave.repository.AssessmentLeaveEvidenceRepository
import uz.scorm.lms.app.v1.student.model.DegreeLevel
import uz.scorm.lms.app.v1.student.model.EducationForm
import uz.scorm.lms.app.v1.student.model.StudentStatus
import uz.scorm.lms.app.v1.student.repository.StudentRepository
import uz.scorm.lms.app.v1.user.repository.UserRepository
import java.time.Instant
import java.time.LocalDate
import java.time.temporal.ChronoUnit

@Service
class AssessmentLeaveEvidenceService(
    private val repository: AssessmentLeaveEvidenceRepository,
    private val studentRepository: StudentRepository,
    private val userRepository: UserRepository,
    private val auditService: AuditService,
) {
    @Transactional(readOnly = true)
    fun list(): List<AssessmentLeaveEvidenceDto> = repository.findAllByDeletedFalseOrderByLeaveStartDateDesc().map(::toDto)

    @Transactional(readOnly = true)
    fun get(id: Long): AssessmentLeaveEvidenceDto = toDto(requireEvidence(id))

    @Transactional(readOnly = true)
    fun eligibleStudents(): List<AssessmentLeaveStudentOptionDto> =
        studentRepository.findAllByEducationFormAndStudentStatusOrderByLastNameAsc(EducationForm.DISTANCE, StudentStatus.ACTIVE)
            .map { AssessmentLeaveStudentOptionDto(requireNotNull(it.id), it.studentNumber, it.fullName, it.academicYear) }

    @Transactional(readOnly = true)
    fun mine(userId: Long): List<AssessmentLeaveEvidenceDto> {
        val student = studentRepository.findByUserId(userId) ?: throw NoSuchElementException("Talaba profili topilmadi")
        return repository.findAllByStudentIdAndDeletedFalseOrderByLeaveStartDateDesc(requireNotNull(student.id)).map(::toDto)
    }

    @Transactional
    fun create(request: SaveAssessmentLeaveEvidenceRequest, actorId: Long): AssessmentLeaveEvidenceDto {
        val student = requireEligibleStudent(request.studentId)
        validate(request, student.degreeLevel)
        val reference = request.assessmentReference.trim()
        require(!repository.existsByStudentIdAndAcademicYearAndLeavePurposeAndAssessmentReferenceAndDeletedFalseAndStatusNot(
            request.studentId, request.academicYear, request.leavePurpose, reference, AssessmentLeaveStatus.REJECTED,
        )) { "Talabaning ushbu yakuniy baholash dalili allaqachon mavjud" }
        val saved = repository.save(AssessmentLeaveEvidence(
            student = student, academicYear = request.academicYear, leavePurpose = request.leavePurpose,
            assessmentReference = reference, employerName = request.employerName.trim(), jobTitle = request.jobTitle.trim(),
            employmentDocumentReference = request.employmentDocumentReference.trim(), leaveOrderNumber = request.leaveOrderNumber.trim(),
            leaveOrderDate = request.leaveOrderDate, leaveStartDate = request.leaveStartDate, leaveEndDate = request.leaveEndDate,
            salaryRetentionConfirmed = request.salaryRetentionConfirmed, evidenceReference = request.evidenceReference.trim(),
            createdByUser = requireUser(actorId),
        ))
        auditService.logAction("ASSESSMENT_LEAVE_CREATED", actorId, "leave=${saved.id}; student=${student.id}; purpose=${saved.leavePurpose}; days=${calendarDays(saved)}")
        return toDto(saved)
    }

    @Transactional
    fun update(id: Long, request: SaveAssessmentLeaveEvidenceRequest, actorId: Long): AssessmentLeaveEvidenceDto {
        val evidence = requireDraft(id)
        require(request.studentId == evidence.student.id) { "Ta'til dalili biriktirilgan talaba o'zgartirilmaydi" }
        validate(request, evidence.student.degreeLevel)
        val reference = request.assessmentReference.trim()
        require(!repository.existsByStudentIdAndAcademicYearAndLeavePurposeAndAssessmentReferenceAndDeletedFalseAndStatusNotAndIdNot(
            request.studentId, request.academicYear, request.leavePurpose, reference, AssessmentLeaveStatus.REJECTED, id,
        )) { "Talabaning ushbu yakuniy baholash dalili allaqachon mavjud" }
        evidence.academicYear = request.academicYear; evidence.leavePurpose = request.leavePurpose
        evidence.assessmentReference = reference; evidence.employerName = request.employerName.trim(); evidence.jobTitle = request.jobTitle.trim()
        evidence.employmentDocumentReference = request.employmentDocumentReference.trim(); evidence.leaveOrderNumber = request.leaveOrderNumber.trim()
        evidence.leaveOrderDate = request.leaveOrderDate; evidence.leaveStartDate = request.leaveStartDate; evidence.leaveEndDate = request.leaveEndDate
        evidence.salaryRetentionConfirmed = request.salaryRetentionConfirmed; evidence.evidenceReference = request.evidenceReference.trim()
        repository.save(evidence)
        auditService.logAction("ASSESSMENT_LEAVE_UPDATED", actorId, "leave=$id; purpose=${evidence.leavePurpose}; days=${calendarDays(evidence)}")
        return toDto(evidence)
    }

    @Transactional
    fun verify(id: Long, request: VerifyAssessmentLeaveEvidenceRequest, actorId: Long): AssessmentLeaveEvidenceDto {
        val evidence = requireDraft(id)
        require(evidence.createdByUser.id != actorId) { "Ta'til dalilini kiritgan foydalanuvchi uni o'zi tekshira olmaydi" }
        require(evidence.salaryRetentionConfirmed) { "22-band bo'yicha ish haqi saqlanishi hujjatda tasdiqlanishi shart" }
        validate(toRequest(evidence), evidence.student.degreeLevel)
        require(request.verificationNote.trim().length in 10..2000) { "Tekshiruv izohi 10..2000 belgidan iborat bo'lishi kerak" }
        evidence.status = AssessmentLeaveStatus.VERIFIED; evidence.verifiedAt = Instant.now()
        evidence.verifiedByUser = requireUser(actorId); evidence.verificationNote = request.verificationNote.trim()
        repository.save(evidence)
        auditService.logAction("ASSESSMENT_LEAVE_VERIFIED", actorId, "leave=$id; student=${evidence.student.id}; order=${evidence.leaveOrderNumber}; days=${calendarDays(evidence)}")
        return toDto(evidence)
    }

    @Transactional
    fun reject(id: Long, request: RejectAssessmentLeaveEvidenceRequest, actorId: Long): AssessmentLeaveEvidenceDto {
        val evidence = requireDraft(id)
        require(evidence.createdByUser.id != actorId) { "Ta'til dalilini kiritgan foydalanuvchi uni o'zi rad eta olmaydi" }
        require(request.reason.trim().length in 10..2000) { "Rad etish sababi 10..2000 belgidan iborat bo'lishi kerak" }
        evidence.status = AssessmentLeaveStatus.REJECTED; evidence.rejectedAt = Instant.now()
        evidence.rejectedByUser = requireUser(actorId); evidence.rejectionReason = request.reason.trim()
        repository.save(evidence)
        auditService.logAction("ASSESSMENT_LEAVE_REJECTED", actorId, "leave=$id; student=${evidence.student.id}; reason=${evidence.rejectionReason?.take(120)}")
        return toDto(evidence)
    }

    private fun validate(request: SaveAssessmentLeaveEvidenceRequest, degreeLevel: DegreeLevel) {
        require(request.academicYear.matches(Regex("\\d{4}-\\d{4}"))) { "O'quv yili YYYY-YYYY formatida bo'lishi kerak" }
        val (first, second) = request.academicYear.split("-").map(String::toInt)
        require(second == first + 1) { "O'quv yili ketma-ket ikki yildan iborat bo'lishi kerak" }
        require(!request.leaveOrderDate.isAfter(LocalDate.now())) { "Ta'til buyrug'i sanasi kelajakda bo'lmasligi kerak" }
        require(!request.leaveOrderDate.isAfter(request.leaveStartDate)) { "Ta'til buyrug'i ta'til boshlanishidan kech bo'lmasligi kerak" }
        require(!request.leaveEndDate.isBefore(request.leaveStartDate)) { "Ta'til tugash sanasi boshlanish sanasidan oldin bo'lmasligi kerak" }
        require(ChronoUnit.DAYS.between(request.leaveStartDate, request.leaveEndDate) + 1 >= 15) { "22-band bo'yicha ta'til kamida 15 kalendar kun bo'lishi kerak" }
        val from = LocalDate.of(first, 9, 1); val to = LocalDate.of(second, 8, 31)
        require(!request.leaveStartDate.isBefore(from) && !request.leaveEndDate.isAfter(to)) { "Ta'til davri ko'rsatilgan o'quv yili doirasida bo'lishi kerak" }
        require(request.assessmentReference.isNotBlank() && request.assessmentReference.trim().length <= 1000) { "Yakuniy baholash yoki himoya rekviziti majburiy" }
        require(request.employerName.isNotBlank() && request.employerName.trim().length <= 500) { "Ish beruvchi nomi majburiy" }
        require(request.jobTitle.isNotBlank() && request.jobTitle.trim().length <= 300) { "Talabaning lavozimi majburiy" }
        require(request.employmentDocumentReference.isNotBlank() && request.employmentDocumentReference.trim().length <= 1000) { "Mehnat faoliyati dalili majburiy" }
        require(request.leaveOrderNumber.isNotBlank() && request.leaveOrderNumber.trim().length <= 200) { "Ta'til buyrug'i raqami majburiy" }
        require(request.evidenceReference.isNotBlank() && request.evidenceReference.trim().length <= 1000) { "Ta'til hujjati dalil rekviziti majburiy" }
        if (request.leavePurpose == AssessmentLeavePurpose.BACHELOR_THESIS_DEFENSE) require(degreeLevel == DegreeLevel.BACHELOR) { "Bakalavr bitiruv himoyasi faqat bakalavriat talabasi uchun" }
        if (request.leavePurpose == AssessmentLeavePurpose.MASTER_THESIS_DEFENSE) require(degreeLevel == DegreeLevel.MASTER) { "Magistrlik himoyasi faqat magistratura talabasi uchun" }
    }

    private fun requireEligibleStudent(id: Long) = studentRepository.findById(id).orElseThrow { NoSuchElementException("Talaba topilmadi: $id") }.also {
        require(it.educationForm == EducationForm.DISTANCE) { "22-band workflowi faqat masofaviy ta'lim talabasiga qo'llanadi" }
        require(it.studentStatus == StudentStatus.ACTIVE) { "Ta'til dalili faqat faol talabaga biriktiriladi" }
    }
    private fun requireEvidence(id: Long) = repository.findByIdAndDeletedFalse(id) ?: throw NoSuchElementException("Yakuniy baholash ta'tili dalili topilmadi: $id")
    private fun requireDraft(id: Long) = requireEvidence(id).also { require(it.status == AssessmentLeaveStatus.DRAFT) { "Faqat DRAFT ta'til dalili o'zgartiriladi" } }
    private fun requireUser(id: Long) = userRepository.findById(id).orElseThrow { NoSuchElementException("Foydalanuvchi topilmadi: $id") }
    private fun calendarDays(evidence: AssessmentLeaveEvidence) = ChronoUnit.DAYS.between(evidence.leaveStartDate, evidence.leaveEndDate) + 1
    private fun toRequest(e: AssessmentLeaveEvidence) = SaveAssessmentLeaveEvidenceRequest(requireNotNull(e.student.id), e.academicYear, e.leavePurpose, e.assessmentReference, e.employerName, e.jobTitle, e.employmentDocumentReference, e.leaveOrderNumber, e.leaveOrderDate, e.leaveStartDate, e.leaveEndDate, e.salaryRetentionConfirmed, e.evidenceReference)
    private fun toDto(e: AssessmentLeaveEvidence) = AssessmentLeaveEvidenceDto(
        requireNotNull(e.id), requireNotNull(e.student.id), e.student.studentNumber, e.student.fullName, e.academicYear,
        e.leavePurpose.name, e.assessmentReference, e.employerName, e.jobTitle, e.employmentDocumentReference,
        e.leaveOrderNumber, e.leaveOrderDate, e.leaveStartDate, e.leaveEndDate, calendarDays(e), e.salaryRetentionConfirmed,
        e.evidenceReference, e.status.name, e.createdByUser.fullName ?: e.createdByUser.username, e.verifiedAt,
        e.verifiedByUser?.fullName ?: e.verifiedByUser?.username, e.verificationNote, e.rejectedAt,
        e.rejectedByUser?.fullName ?: e.rejectedByUser?.username, e.rejectionReason,
    )
}
