package uz.scorm.lms.app.v1.academicdocument.service

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.academicdocument.dto.CallLetterDto
import uz.scorm.lms.app.v1.academicdocument.dto.DocumentStudentDto
import uz.scorm.lms.app.v1.academicdocument.dto.SaveCallLetterRequest
import uz.scorm.lms.app.v1.academicdocument.dto.SaveTranscriptRequest
import uz.scorm.lms.app.v1.academicdocument.dto.TranscriptDto
import uz.scorm.lms.app.v1.academicdocument.model.CallLetterStatus
import uz.scorm.lms.app.v1.academicdocument.model.FinalExamCallLetter
import uz.scorm.lms.app.v1.academicdocument.model.StudentTranscript
import uz.scorm.lms.app.v1.academicdocument.repository.FinalExamCallLetterRepository
import uz.scorm.lms.app.v1.academicdocument.repository.StudentTranscriptRepository
import uz.scorm.lms.app.v1.academicresult.service.AcademicAnalyticsService
import uz.scorm.lms.app.v1.audit.service.AuditService
import uz.scorm.lms.app.v1.group.repository.GroupRepository
import uz.scorm.lms.app.v1.program.repository.ProgramRepository
import uz.scorm.lms.app.v1.student.model.StudentProfile
import uz.scorm.lms.app.v1.student.repository.StudentRepository
import uz.scorm.lms.app.v1.user.repository.UserRepository
import java.time.Instant
import java.time.Year
import java.util.UUID

data class GeneratedAcademicDocument(val filename: String, val bytes: ByteArray)

@Service
class AcademicDocumentService(
    private val callLetters: FinalExamCallLetterRepository,
    private val transcripts: StudentTranscriptRepository,
    private val students: StudentRepository,
    private val groups: GroupRepository,
    private val programs: ProgramRepository,
    private val users: UserRepository,
    private val analytics: AcademicAnalyticsService,
    private val pdf: AcademicDocumentPdfService,
    private val auditService: AuditService,
) {
    @Transactional(readOnly = true)
    fun studentOptions(): List<DocumentStudentDto> {
        val groupNames = groupNames()
        val programNames = programNames()
        return students.findAll().map { student -> DocumentStudentDto(
            id = requireNotNull(student.id),
            fullName = student.fullName,
            studentNumber = student.studentNumber,
            educationForm = student.educationForm.name,
            program = student.programId?.let(programNames::get).orEmpty(),
            group = student.groupId?.let(groupNames::get).orEmpty(),
            academicYear = student.academicYear,
            semester = student.semesterNumber,
        ) }.sortedBy { it.fullName }
    }

    @Transactional(readOnly = true)
    fun listCallLetters(): List<CallLetterDto> = callLetters.findAllByDeletedFalseOrderByCreatedAtDesc().map(::callLetterDto)

    @Transactional
    fun createCallLetter(request: SaveCallLetterRequest, actorId: Long): CallLetterDto {
        validateCallLetter(request)
        val entity = callLetters.save(FinalExamCallLetter(
            student = student(request.studentId),
            documentNumber = "PENDING-${UUID.randomUUID()}",
            semester = request.semester,
            orderNumber = required(request.orderNumber, "Buyruq raqami", 1, 120),
            orderDate = request.orderDate,
            startDate = request.startDate,
            endDate = request.endDate,
        ))
        entity.documentNumber = "CHQ-${Year.now().value}-${requireNotNull(entity.id).toString().padStart(6, '0')}"
        val saved = callLetters.save(entity)
        auditService.logAction("CALL_LETTER_CREATED", actorId, "id=${saved.id}; student=${request.studentId}; number=${saved.documentNumber}")
        return callLetterDto(saved)
    }

    @Transactional
    fun updateCallLetter(id: Long, request: SaveCallLetterRequest, actorId: Long): CallLetterDto {
        validateCallLetter(request)
        val entity = requireCallLetter(id)
        entity.student = student(request.studentId)
        entity.semester = request.semester
        entity.orderNumber = required(request.orderNumber, "Buyruq raqami", 1, 120)
        entity.orderDate = request.orderDate
        entity.startDate = request.startDate
        entity.endDate = request.endDate
        if (entity.status == CallLetterStatus.CONFIRMED) entity.status = CallLetterStatus.GENERATED
        val saved = callLetters.save(entity)
        auditService.logAction("CALL_LETTER_UPDATED", actorId, "id=$id; student=${request.studentId}")
        return callLetterDto(saved)
    }

    @Transactional
    fun confirmCallLetter(id: Long, actorId: Long): CallLetterDto {
        val entity = requireCallLetter(id)
        require(entity.generatedAt != null) { "Avval chaqiruv qog'ozini shakllantiring" }
        entity.status = CallLetterStatus.CONFIRMED
        entity.issuedBy = users.findById(actorId).orElseThrow { NoSuchElementException("Foydalanuvchi topilmadi") }
        val saved = callLetters.save(entity)
        auditService.logAction("CALL_LETTER_CONFIRMED", actorId, "id=$id; number=${saved.documentNumber}")
        return callLetterDto(saved)
    }

    @Transactional
    fun generateCallLetter(id: Long, actorId: Long): GeneratedAcademicDocument {
        val entity = requireCallLetter(id)
        val context = context(entity.student)
        val bytes = pdf.callLetter(CallLetterPdfData(
            documentNumber = entity.documentNumber,
            studentName = entity.student.fullName,
            studentNumber = entity.student.studentNumber,
            program = context.program,
            group = context.group,
            semester = entity.semester,
            orderNumber = entity.orderNumber,
            orderDate = entity.orderDate,
            startDate = entity.startDate,
            endDate = entity.endDate,
        ))
        entity.generatedAt = Instant.now()
        if (entity.status == CallLetterStatus.DRAFT) entity.status = CallLetterStatus.GENERATED
        entity.issuedBy = users.findById(actorId).orElseThrow { NoSuchElementException("Foydalanuvchi topilmadi") }
        callLetters.save(entity)
        auditService.logAction("CALL_LETTER_GENERATED", actorId, "id=$id; bytes=${bytes.size}")
        return GeneratedAcademicDocument("${entity.documentNumber}.pdf", bytes)
    }

    @Transactional
    fun deleteCallLetter(id: Long, actorId: Long) {
        val entity = requireCallLetter(id)
        entity.deleted = true
        callLetters.save(entity)
        auditService.logAction("CALL_LETTER_DELETED", actorId, "id=$id; number=${entity.documentNumber}")
    }

    @Transactional(readOnly = true)
    fun listTranscripts(): List<TranscriptDto> = transcripts.findAllByDeletedFalseOrderByCreatedAtDesc().map(::transcriptDto)

    @Transactional
    fun createTranscript(request: SaveTranscriptRequest, actorId: Long): TranscriptDto {
        validateTranscript(request)
        val requestedNumber = request.documentNumber?.trim()?.takeIf(String::isNotBlank)
        requestedNumber?.let { require(transcripts.findByDocumentNumberIgnoreCaseAndDeletedFalse(it) == null) { "Transkript raqami mavjud: $it" } }
        val entity = transcripts.save(StudentTranscript(
            student = student(request.studentId),
            documentNumber = requestedNumber ?: "PENDING-${UUID.randomUUID()}",
            academicYear = request.academicYear.trim(),
            semester = request.semester,
        ))
        if (requestedNumber == null) entity.documentNumber = "TR-${Year.now().value}-${requireNotNull(entity.id).toString().padStart(6, '0')}"
        val saved = transcripts.save(entity)
        auditService.logAction("TRANSCRIPT_CREATED", actorId, "id=${saved.id}; student=${request.studentId}; number=${saved.documentNumber}")
        return transcriptDto(saved)
    }

    @Transactional
    fun updateTranscript(id: Long, request: SaveTranscriptRequest, actorId: Long): TranscriptDto {
        validateTranscript(request)
        val entity = requireTranscript(id)
        val number = request.documentNumber?.trim()?.takeIf(String::isNotBlank) ?: entity.documentNumber
        val duplicate = transcripts.findByDocumentNumberIgnoreCaseAndDeletedFalse(number)
        require(duplicate == null || duplicate.id == entity.id) { "Transkript raqami mavjud: $number" }
        entity.student = student(request.studentId)
        entity.documentNumber = number
        entity.academicYear = request.academicYear.trim()
        entity.semester = request.semester
        val saved = transcripts.save(entity)
        auditService.logAction("TRANSCRIPT_UPDATED", actorId, "id=$id; student=${request.studentId}")
        return transcriptDto(saved)
    }

    @Transactional
    fun generateTranscript(id: Long, actorId: Long): GeneratedAcademicDocument {
        val entity = requireTranscript(id)
        val context = context(entity.student)
        val resultRows = analytics.studentResults()
            .filter { it.studentId == entity.student.id && it.semester <= entity.semester && it.assessed }
        val totalCredits = resultRows.sumOf { it.credits.coerceAtLeast(1) }
        val gpa = if (totalCredits == 0) 0.0 else resultRows.sumOf { (it.gpaPoint ?: 0.0) * it.credits.coerceAtLeast(1) } / totalCredits
        val bytes = pdf.transcript(TranscriptPdfData(
            documentNumber = entity.documentNumber,
            studentName = entity.student.fullName,
            studentNumber = entity.student.studentNumber,
            educationForm = entity.student.educationForm.name,
            program = context.program,
            group = context.group,
            academicYear = entity.academicYear,
            semester = entity.semester,
            lines = resultRows.map { TranscriptLinePdfData(
                subject = it.subject, semester = it.semester, credits = it.credits,
                interim = it.interimScore, finalScore = it.finalScore, total = it.totalScore,
                grade = it.letterGrade,
            ) },
            gpa = gpa,
            totalCredits = totalCredits,
        ))
        entity.generatedAt = Instant.now()
        entity.issuedBy = users.findById(actorId).orElseThrow { NoSuchElementException("Foydalanuvchi topilmadi") }
        transcripts.save(entity)
        auditService.logAction("TRANSCRIPT_GENERATED", actorId, "id=$id; subjects=${resultRows.size}; bytes=${bytes.size}")
        return GeneratedAcademicDocument("${entity.documentNumber}.pdf", bytes)
    }

    @Transactional
    fun deleteTranscript(id: Long, actorId: Long) {
        val entity = requireTranscript(id)
        entity.deleted = true
        transcripts.save(entity)
        auditService.logAction("TRANSCRIPT_DELETED", actorId, "id=$id; number=${entity.documentNumber}")
    }

    private fun validateCallLetter(request: SaveCallLetterRequest) {
        require(request.semester in 1..20) { "Semestr 1-20 oralig'ida bo'lishi kerak" }
        require(!request.endDate.isBefore(request.startDate)) { "Tugash sanasi boshlanish sanasidan oldin bo'lmaydi" }
    }

    private fun validateTranscript(request: SaveTranscriptRequest) {
        require(request.semester in 1..20) { "Semestr 1-20 oralig'ida bo'lishi kerak" }
        require(request.academicYear.trim().matches(Regex("^\\d{4}[- ]\\d{4}$"))) { "O'quv yili 2025-2026 ko'rinishida bo'lishi kerak" }
    }

    private fun required(value: String, label: String, min: Int, max: Int): String {
        val normalized = value.trim()
        require(normalized.length in min..max) { "$label $min-$max belgi bo'lishi kerak" }
        return normalized
    }

    private fun student(id: Long): StudentProfile = students.findById(id).orElseThrow { NoSuchElementException("Talaba topilmadi: $id") }
    private fun requireCallLetter(id: Long) = callLetters.findByIdAndDeletedFalse(id) ?: throw NoSuchElementException("Chaqiruv qog'ozi topilmadi: $id")
    private fun requireTranscript(id: Long) = transcripts.findByIdAndDeletedFalse(id) ?: throw NoSuchElementException("Transkript topilmadi: $id")
    private fun groupNames() = groups.findAll().filter { !it.deleted }.associate { requireNotNull(it.id) to it.name }
    private fun programNames() = programs.findAll().filter { !it.deleted }.associate { requireNotNull(it.id) to it.name }
    private fun context(student: StudentProfile) = StudentContext(
        program = student.programId?.let(programNames()::get).orEmpty(),
        group = student.groupId?.let(groupNames()::get).orEmpty(),
    )
    private data class StudentContext(val program: String, val group: String)

    private fun callLetterDto(value: FinalExamCallLetter) = CallLetterDto(
        id = requireNotNull(value.id), studentId = requireNotNull(value.student.id), fullName = value.student.fullName,
        studentNumber = value.student.studentNumber, semester = value.semester, documentNumber = value.documentNumber,
        orderNumber = value.orderNumber, orderDate = value.orderDate, startDate = value.startDate, endDate = value.endDate,
        status = value.status, generatedAt = value.generatedAt, createdAt = value.createdAt,
    )

    private fun transcriptDto(value: StudentTranscript): TranscriptDto {
        val context = context(value.student)
        return TranscriptDto(
            id = requireNotNull(value.id), studentId = requireNotNull(value.student.id), fullName = value.student.fullName,
            studentNumber = value.student.studentNumber, educationForm = value.student.educationForm.name,
            program = context.program, group = context.group, documentNumber = value.documentNumber,
            academicYear = value.academicYear, semester = value.semester, generatedAt = value.generatedAt, createdAt = value.createdAt,
        )
    }
}
