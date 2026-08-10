package uz.scorm.lms.app.v1.student.service

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.audit.service.AuditService
import uz.scorm.lms.app.v1.compliance.Decision559Rules
import uz.scorm.lms.app.v1.group.repository.GroupRepository
import uz.scorm.lms.app.v1.program.model.Program
import uz.scorm.lms.app.v1.program.repository.ProgramRepository
import uz.scorm.lms.app.v1.student.dto.StudentAdmissionRequest
import uz.scorm.lms.app.v1.student.dto.StudentAcademicAdmissionRequest
import uz.scorm.lms.app.v1.student.dto.StudentLifecycleEventDto
import uz.scorm.lms.app.v1.student.dto.StudentLifecycleRequest
import uz.scorm.lms.app.v1.student.dto.StudentLifecycleResultDto
import uz.scorm.lms.app.v1.student.dto.StudentUpdateRequest
import uz.scorm.lms.app.v1.student.model.EducationForm
import uz.scorm.lms.app.v1.student.model.Citizenship
import uz.scorm.lms.app.v1.student.model.StudentLifecycleEvent
import uz.scorm.lms.app.v1.student.model.StudentLifecycleEventType
import uz.scorm.lms.app.v1.student.model.StudentProfile
import uz.scorm.lms.app.v1.student.model.StudentStatus
import uz.scorm.lms.app.v1.student.repository.StudentLifecycleEventRepository
import uz.scorm.lms.app.v1.student.repository.StudentRepository
import uz.scorm.lms.app.v1.user.model.UserStatus
import uz.scorm.lms.app.v1.user.repository.UserRepository
import java.time.Instant
import java.time.LocalDate

@Service
class StudentLifecycleService(
    private val eventRepository: StudentLifecycleEventRepository,
    private val studentRepository: StudentRepository,
    private val studentService: StudentService,
    private val programRepository: ProgramRepository,
    private val groupRepository: GroupRepository,
    private val userRepository: UserRepository,
    private val auditService: AuditService,
) {
    @Transactional
    fun admitRegistered(studentId: Long, request: StudentAcademicAdmissionRequest, actorId: Long): StudentLifecycleResultDto {
        validateEvidence(request.orderNumber, request.orderDate, request.effectiveDate, request.legalBasis, request.reason)
        val student = studentRepository.findByIdForUpdate(studentId)
            ?: throw NoSuchElementException("Talaba topilmadi: $studentId")
        require(student.studentStatus == StudentStatus.REGISTERED) {
            "Faqat hali qabul qilinmagan REGISTERED talaba akademik biriktiriladi"
        }
        require(!eventRepository.existsByStudentIdAndEventTypeAndOrderNumber(
            studentId, StudentLifecycleEventType.ADMISSION, request.orderNumber.trim(),
        )) { "Ushbu talaba va buyruq raqami bilan qabul yozuvi mavjud" }

        val program = programRepository.findById(request.programId)
            .orElseThrow { IllegalArgumentException("Ta'lim dasturi topilmadi: ${request.programId}") }
        val academicYear = requireNotNull(request.academicYear?.trim()?.takeIf(String::isNotBlank)) {
            "O'quv yili tanlanishi shart"
        }
        require(program.active && !program.deleted) { "Faqat faol ta'lim dasturiga qabul qilish mumkin" }
        require(program.degreeLevel.equals(request.degreeLevel.name, ignoreCase = true)) {
            "Tanlangan ta'lim darajasi dastur darajasiga mos emas"
        }
        request.departmentId?.let { require(it == program.department?.id) { "Tanlangan kafedra ta'lim dasturiga tegishli emas" } }
        request.facultyId?.let { require(it == program.department?.faculty?.id) { "Tanlangan fakultet ta'lim dasturiga tegishli emas" } }
        val group = request.groupId?.let {
            groupRepository.findById(it).orElseThrow { IllegalArgumentException("Guruh topilmadi: $it") }
        }
        if (group != null) {
            require(group.active && !group.deleted) { "Faqat faol guruhga biriktirish mumkin" }
            require(group.program?.id == program.id) {
                "Tanlangan guruh ta'lim dasturiga tegishli emas"
            }
            group.educationYear?.trim()?.takeIf(String::isNotBlank)?.let {
                require(it == academicYear) { "Tanlangan guruh $academicYear o'quv yiliga tegishli emas" }
            }
            group.language?.trim()?.takeIf(String::isNotBlank)?.let {
                require(it.equals(request.educationLanguage.trim(), ignoreCase = true)) {
                    "Tanlangan guruh ta'lim tiliga mos emas"
                }
            }
        }
        studentService.validateAcademicAdmission(student, request)

        student.universityId = request.universityId
        student.facultyId = program.department?.faculty?.id
        student.departmentId = program.department?.id
        student.programId = program.id
        student.degreeLevel = request.degreeLevel
        student.educationForm = request.educationForm
        student.educationLanguage = request.educationLanguage.trim()
        student.courseNumber = request.courseNumber
        student.semesterNumber = request.semesterNumber
        student.groupId = group?.id
        student.academicYear = academicYear
        student.admissionDate = request.effectiveDate
        student.admissionOrderNumber = request.orderNumber.trim()
        student.paymentType = request.paymentType
        student.contractNumber = request.contractNumber?.trim()?.takeIf(String::isNotBlank)
        student.contractAmount = request.contractAmount
        student.studentStatus = StudentStatus.ACTIVE
        student.lmsOrientationRequired = Decision559Rules.requiresLmsOrientation(
            request.educationForm == EducationForm.DISTANCE,
            student.citizenship != Citizenship.UZBEKISTAN,
        )
        student.user.status = if (student.user.credentialsInitialized) UserStatus.ACTIVE else UserStatus.INACTIVE
        studentRepository.save(student)

        val eventRequest = StudentLifecycleRequest(
            eventType = StudentLifecycleEventType.ADMISSION,
            orderNumber = request.orderNumber,
            orderDate = request.orderDate,
            effectiveDate = request.effectiveDate,
            legalBasis = request.legalBasis,
            reason = request.reason,
        )
        val event = saveEvent(
            student = student,
            eventType = StudentLifecycleEventType.ADMISSION,
            fromStatus = StudentStatus.REGISTERED,
            toStatus = StudentStatus.ACTIVE,
            fromProgram = null,
            toProgram = program,
            fromGroupId = null,
            toGroupId = group?.id,
            request = eventRequest,
            actorId = actorId,
        )
        auditService.logAction(
            "STUDENT_ADMITTED",
            actorId,
            "student=$studentId; order=${event.orderNumber}; effective=${event.effectiveDate}; program=${program.id}; group=${group?.id}",
        )
        return StudentLifecycleResultDto(studentService.toDto(student), toDto(event))
    }

    @Transactional
    fun admit(request: StudentAdmissionRequest, actorId: Long): StudentLifecycleResultDto {
        validateEvidence(request.orderNumber, request.orderDate, request.effectiveDate, request.legalBasis, request.reason)
        require(request.student.studentStatus == StudentStatus.ACTIVE) { "Qabul yozuvi ACTIVE holatda boshlanishi shart" }
        val created = studentService.create(request.student.copy(
            admissionDate = request.effectiveDate,
            admissionOrderNumber = request.orderNumber.trim(),
            studentStatus = StudentStatus.ACTIVE,
        ))
        val student = studentRepository.findByIdForUpdate(requireNotNull(created.id))
            ?: throw NoSuchElementException("Yaratilgan talaba topilmadi")
        val program = student.programId?.let { programRepository.findById(it).orElse(null) }
        val event = saveEvent(
            student = student,
            eventType = StudentLifecycleEventType.ADMISSION,
            fromStatus = null,
            toStatus = StudentStatus.ACTIVE,
            fromProgram = null,
            toProgram = program,
            fromGroupId = null,
            toGroupId = student.groupId,
            request = StudentLifecycleRequest(
                eventType = StudentLifecycleEventType.ADMISSION,
                orderNumber = request.orderNumber,
                orderDate = request.orderDate,
                effectiveDate = request.effectiveDate,
                legalBasis = request.legalBasis,
                reason = request.reason,
            ),
            actorId = actorId,
        )
        auditService.logAction(
            "STUDENT_ADMITTED",
            actorId,
            "student=${student.id}; order=${event.orderNumber}; effective=${event.effectiveDate}; program=${student.programId}",
        )
        return StudentLifecycleResultDto(studentService.toDto(student), toDto(event))
    }

    @Transactional(readOnly = true)
    fun history(studentId: Long): List<StudentLifecycleEventDto> {
        requireStudent(studentId)
        return eventRepository.findAllByStudentIdOrderByEffectiveDateDescRecordedAtDesc(studentId).map(::toDto)
    }

    @Transactional
    fun transition(studentId: Long, request: StudentLifecycleRequest, actorId: Long): StudentLifecycleResultDto {
        require(request.eventType != StudentLifecycleEventType.ADMISSION) {
            "ADMISSION faqat yangi talaba qabulida yaratiladi"
        }
        validateEvidence(request.orderNumber, request.orderDate, request.effectiveDate, request.legalBasis, request.reason)
        val student = studentRepository.findByIdForUpdate(studentId)
            ?: throw NoSuchElementException("Talaba topilmadi: $studentId")
        require(!eventRepository.existsByStudentIdAndEventTypeAndOrderNumber(
            studentId,
            request.eventType,
            request.orderNumber.trim(),
        )) { "Ushbu talaba, hodisa va buyruq raqami bilan lifecycle yozuvi mavjud" }

        val fromStatus = student.studentStatus
        val fromProgram = student.programId?.let { programRepository.findById(it).orElse(null) }
        val fromGroupId = student.groupId
        val toStatus = targetStatus(request.eventType, fromStatus)
        var toProgram = fromProgram
        var toGroupId = fromGroupId

        if (request.eventType == StudentLifecycleEventType.TRANSFER) {
            val plan = prepareTransfer(student, request, fromProgram, fromGroupId, toStatus)
            toProgram = plan.program
            toGroupId = plan.groupId
            student.programId = requireNotNull(toProgram.id)
            student.departmentId = toProgram.department?.id
            student.facultyId = toProgram.department?.faculty?.id
            student.groupId = toGroupId
            student.academicYear = plan.academicYear
            if (student.educationForm == EducationForm.DISTANCE && fromProgram?.id != toProgram.id) {
                student.lmsOrientationRequired = Decision559Rules.requiresLmsOrientation(
                    isDistanceEducation = true,
                    isForeignCitizen = student.citizenship != Citizenship.UZBEKISTAN,
                )
                student.lmsOrientationCompletedAt = null
            }
        } else {
            require(request.targetProgramId == null && request.targetGroupId == null) {
                "Dastur va guruh faqat TRANSFER hodisasida beriladi"
            }
            if (toStatus == StudentStatus.ACTIVE && fromStatus != StudentStatus.ACTIVE) {
                studentService.validateLifecyclePlacement(student, student.programId, toStatus, effectiveDate = request.effectiveDate)
            }
        }

        student.studentStatus = toStatus
        student.user.status = when {
            toStatus != StudentStatus.ACTIVE -> UserStatus.INACTIVE
            !student.user.credentialsInitialized -> UserStatus.INACTIVE
            fromStatus != StudentStatus.ACTIVE -> UserStatus.ACTIVE
            student.user.status == UserStatus.BLOCKED -> UserStatus.BLOCKED
            else -> UserStatus.ACTIVE
        }
        studentRepository.save(student)
        val event = saveEvent(
            student,
            request.eventType,
            fromStatus,
            toStatus,
            fromProgram,
            toProgram,
            fromGroupId,
            toGroupId,
            request,
            actorId,
        )
        auditService.logAction(
            "STUDENT_LIFECYCLE_${request.eventType}",
            actorId,
            "student=$studentId; ${fromStatus.name}->${toStatus.name}; order=${event.orderNumber}; program=${fromProgram?.id}->${toProgram?.id}",
        )
        return StudentLifecycleResultDto(studentService.toDto(student), toDto(event))
    }

    @Transactional
    fun validateTransferCandidate(studentId: Long, request: StudentLifecycleRequest) {
        require(request.eventType == StudentLifecycleEventType.TRANSFER) { "Faqat TRANSFER hodisasi tekshiriladi" }
        validateEvidence(request.orderNumber, request.orderDate, request.effectiveDate, request.legalBasis, request.reason)
        val student = studentRepository.findByIdForUpdate(studentId)
            ?: throw NoSuchElementException("Talaba topilmadi: $studentId")
        require(!eventRepository.existsByStudentIdAndEventTypeAndOrderNumber(
            studentId, StudentLifecycleEventType.TRANSFER, request.orderNumber.trim(),
        )) { "Ushbu talaba, hodisa va buyruq raqami bilan lifecycle yozuvi mavjud" }
        val fromProgram = student.programId?.let { programRepository.findById(it).orElse(null) }
        val toStatus = targetStatus(StudentLifecycleEventType.TRANSFER, student.studentStatus)
        prepareTransfer(student, request, fromProgram, student.groupId, toStatus)
    }

    private fun prepareTransfer(
        student: StudentProfile,
        request: StudentLifecycleRequest,
        fromProgram: Program?,
        fromGroupId: Long?,
        toStatus: StudentStatus,
    ): TransferPlan {
        val targetProgramId = requireNotNull(request.targetProgramId) { "Ko'chirish uchun yangi ta'lim dasturi majburiy" }
        val targetProgram = programRepository.findById(targetProgramId)
            .orElseThrow { IllegalArgumentException("Ta'lim dasturi topilmadi: $targetProgramId") }
        require(targetProgram.active && !targetProgram.deleted) { "Faqat faol ta'lim dasturiga ko'chirish mumkin" }
        val targetGroup = request.targetGroupId?.let { groupId ->
            groupRepository.findById(groupId).orElseThrow { IllegalArgumentException("Guruh topilmadi: $groupId") }
        }
        if (targetGroup != null) {
            require(targetGroup.active && !targetGroup.deleted) { "Faqat faol guruhga ko'chirish mumkin" }
            require(targetGroup.program?.id == targetProgramId) { "Tanlangan guruh yangi ta'lim dasturiga tegishli emas" }
            request.academicYear?.trim()?.takeIf(String::isNotBlank)?.let { academicYear ->
                targetGroup.educationYear?.trim()?.takeIf(String::isNotBlank)?.let {
                    require(it == academicYear) { "Tanlangan guruh $academicYear o'quv yiliga tegishli emas" }
                }
            }
            targetGroup.language?.trim()?.takeIf(String::isNotBlank)?.let {
                require(it.equals(student.educationLanguage, ignoreCase = true)) {
                    "Tanlangan guruh talabaning ta'lim tiliga mos emas"
                }
            }
        }
        val targetGroupId = targetGroup?.id
        require(fromProgram?.id != targetProgramId || fromGroupId != targetGroupId) {
            "Ko'chirishda ta'lim dasturi yoki guruh o'zgarishi shart"
        }
        val targetAcademicYear = request.academicYear?.trim()?.takeIf(String::isNotBlank)
            ?: targetGroup?.educationYear
            ?: student.academicYear
        studentService.validateLifecyclePlacement(student, targetProgramId, toStatus, targetAcademicYear, request.effectiveDate)
        return TransferPlan(targetProgram, targetGroupId, targetAcademicYear)
    }

    private fun targetStatus(eventType: StudentLifecycleEventType, current: StudentStatus): StudentStatus = when (eventType) {
        StudentLifecycleEventType.ADMISSION -> error("ADMISSION transition endpointida ishlatilmaydi")
        StudentLifecycleEventType.SUSPENSION -> {
            require(current == StudentStatus.ACTIVE) { "Faqat ACTIVE talaba o'qishdan vaqtincha chetlatiladi" }
            StudentStatus.SUSPENDED
        }
        StudentLifecycleEventType.REINSTATEMENT -> {
            require(current in setOf(StudentStatus.SUSPENDED, StudentStatus.EXPELLED)) {
                "Faqat SUSPENDED yoki EXPELLED talaba qayta tiklanadi"
            }
            StudentStatus.ACTIVE
        }
        StudentLifecycleEventType.TRANSFER -> {
            require(current in setOf(StudentStatus.ACTIVE, StudentStatus.SUSPENDED)) {
                "Faqat ACTIVE yoki SUSPENDED talaba ko'chiriladi"
            }
            current
        }
        StudentLifecycleEventType.EXPULSION -> {
            require(current in setOf(StudentStatus.ACTIVE, StudentStatus.SUSPENDED)) {
                "Faqat ACTIVE yoki SUSPENDED talaba chetlashtiriladi"
            }
            StudentStatus.EXPELLED
        }
        StudentLifecycleEventType.GRADUATION -> {
            require(current == StudentStatus.ACTIVE) { "Faqat ACTIVE talaba bitiruvchi holatiga o'tkaziladi" }
            StudentStatus.GRADUATED
        }
    }

    private data class TransferPlan(
        val program: Program,
        val groupId: Long?,
        val academicYear: String?,
    )

    private fun validateEvidence(
        orderNumber: String,
        orderDate: LocalDate,
        effectiveDate: LocalDate,
        legalBasis: String,
        reason: String,
    ) {
        require(orderNumber.trim().length in 2..200) { "Buyruq raqami 2-200 belgi bo'lishi shart" }
        require(!orderDate.isAfter(LocalDate.now())) { "Kelajakdagi buyruq sanasi qabul qilinmaydi" }
        require(!effectiveDate.isBefore(orderDate)) { "Amal sanasi buyruq sanasidan oldin bo'lishi mumkin emas" }
        require(!effectiveDate.isAfter(LocalDate.now())) { "Kelajakda kuchga kiradigan hodisa hozirgi statusni o'zgartira olmaydi" }
        require(legalBasis.trim().length in 5..1000) { "Huquqiy asos 5-1000 belgi bo'lishi shart" }
        require(reason.trim().length in 5..2000) { "Sabab 5-2000 belgi bo'lishi shart" }
    }

    private fun saveEvent(
        student: StudentProfile,
        eventType: StudentLifecycleEventType,
        fromStatus: StudentStatus?,
        toStatus: StudentStatus,
        fromProgram: Program?,
        toProgram: Program?,
        fromGroupId: Long?,
        toGroupId: Long?,
        request: StudentLifecycleRequest,
        actorId: Long,
    ): StudentLifecycleEvent {
        val actor = userRepository.findById(actorId).orElseThrow { NoSuchElementException("Foydalanuvchi topilmadi: $actorId") }
        return eventRepository.save(StudentLifecycleEvent(
            student = student,
            eventType = eventType,
            fromStatus = fromStatus,
            toStatus = toStatus,
            fromProgram = fromProgram,
            toProgram = toProgram,
            fromProgramNameSnapshot = fromProgram?.name,
            toProgramNameSnapshot = toProgram?.name,
            fromGroupId = fromGroupId,
            toGroupId = toGroupId,
            orderNumber = request.orderNumber.trim(),
            orderDate = request.orderDate,
            effectiveDate = request.effectiveDate,
            legalBasis = request.legalBasis.trim(),
            reason = request.reason.trim(),
            recordedBy = actor,
            recordedAt = Instant.now(),
        ))
    }

    private fun requireStudent(id: Long): StudentProfile = studentRepository.findById(id)
        .orElseThrow { NoSuchElementException("Talaba topilmadi: $id") }

    private fun toDto(event: StudentLifecycleEvent) = StudentLifecycleEventDto(
        id = requireNotNull(event.id),
        studentId = requireNotNull(event.student.id),
        studentNumber = event.student.studentNumber,
        studentName = event.student.fullName,
        eventType = event.eventType,
        fromStatus = event.fromStatus,
        toStatus = event.toStatus,
        fromProgramId = event.fromProgram?.id,
        fromProgramName = event.fromProgramNameSnapshot,
        toProgramId = event.toProgram?.id,
        toProgramName = event.toProgramNameSnapshot,
        fromGroupId = event.fromGroupId,
        toGroupId = event.toGroupId,
        orderNumber = event.orderNumber,
        orderDate = event.orderDate,
        effectiveDate = event.effectiveDate,
        legalBasis = event.legalBasis,
        reason = event.reason,
        recordedByUserId = requireNotNull(event.recordedBy.id),
        recordedByName = event.recordedBy.fullName ?: event.recordedBy.username,
        recordedAt = event.recordedAt,
    )
}
