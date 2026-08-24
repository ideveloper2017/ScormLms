package uz.scorm.lms.app.v1.rereading.service

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.academicresult.service.AcademicAnalyticsService
import uz.scorm.lms.app.v1.audit.service.AuditService
import uz.scorm.lms.app.v1.courses.model.CourseEnrollmentStatus
import uz.scorm.lms.app.v1.courses.repository.CourseEnrollmentRepository
import uz.scorm.lms.app.v1.group.repository.GroupRepository
import uz.scorm.lms.app.v1.rereading.dto.*
import uz.scorm.lms.app.v1.rereading.model.*
import uz.scorm.lms.app.v1.rereading.repository.ReReadingApplicationRepository
import uz.scorm.lms.app.v1.rereading.repository.ReReadingPlanRepository
import uz.scorm.lms.app.v1.student.repository.StudentRepository
import uz.scorm.lms.app.v1.teacher.repository.TeacherRepository
import java.math.BigDecimal
import java.math.RoundingMode
import java.time.Instant
import java.time.LocalDate
import java.time.Year
import java.util.UUID

@Service
class ReReadingService(
    private val plans: ReReadingPlanRepository,
    private val applications: ReReadingApplicationRepository,
    private val students: StudentRepository,
    private val groups: GroupRepository,
    private val enrollments: CourseEnrollmentRepository,
    private val teachers: TeacherRepository,
    private val analytics: AcademicAnalyticsService,
    private val audit: AuditService,
) {
    @Transactional(readOnly = true)
    fun plans() = plans.findAllByDeletedFalseOrderByApplicationDeadlineDesc().map(::planDto)

    @Transactional
    fun createPlan(request: SaveReReadingPlanRequest, actorId: Long): ReReadingPlanDto {
        validatePlan(request)
        val saved = plans.save(ReReadingPlan(normalize(request.title, "Reja nomi", 3, 180), request.applicationDeadline, request.description.trim(), request.status))
        audit.logAction("RE_READING_PLAN_CREATED", actorId, "id=${saved.id}; status=${saved.status}")
        return planDto(saved)
    }

    @Transactional
    fun updatePlan(id: Long, request: SaveReReadingPlanRequest, actorId: Long): ReReadingPlanDto {
        validatePlan(request)
        val entity = requirePlan(id)
        entity.title = normalize(request.title, "Reja nomi", 3, 180)
        entity.applicationDeadline = request.applicationDeadline
        entity.description = request.description.trim()
        entity.status = request.status
        val saved = plans.save(entity)
        audit.logAction("RE_READING_PLAN_UPDATED", actorId, "id=$id; status=${saved.status}")
        return planDto(saved)
    }

    @Transactional
    fun deletePlan(id: Long, actorId: Long) {
        val entity = requirePlan(id)
        entity.deleted = true
        plans.save(entity)
        audit.logAction("RE_READING_PLAN_DELETED", actorId, "id=$id")
    }

    @Transactional(readOnly = true)
    fun studentOptions(): List<ReReadingStudentDto> {
        val groupNames = groupNames()
        return students.findAll().map { student -> ReReadingStudentDto(
            id = requireNotNull(student.id), fullName = student.fullName, studentNumber = student.studentNumber,
            group = student.groupId?.let(groupNames::get).orEmpty(), academicYear = student.academicYear,
            semester = student.semesterNumber,
        ) }.sortedBy { it.fullName }
    }

    @Transactional(readOnly = true)
    fun applications(): List<ReReadingApplicationDto> {
        val groupNames = groupNames()
        return applications.findAllByDeletedFalseOrderByCreatedAtDesc().map { applicationDto(it, groupNames) }
    }

    @Transactional
    fun createApplication(request: SaveReReadingApplicationRequest, actorId: Long): ReReadingApplicationDto {
        validateApplication(request)
        val plan = requirePlan(request.planId)
        require(plan.status == ReReadingPlanStatus.OPEN) { "Faqat ochiq rejaga ariza qo'shish mumkin" }
        require(!plan.applicationDeadline.isBefore(LocalDate.now())) { "Ariza topshirish muddati tugagan" }
        require(!applications.existsByPlanIdAndStudentIdAndDeletedFalse(request.planId, request.studentId)) { "Bu talaba reja bo'yicha allaqachon ariza bergan" }
        val student = students.findById(request.studentId).orElseThrow { NoSuchElementException("Talaba topilmadi: ${request.studentId}") }
        val derivedCredits = currentEnrollments(request.studentId).sumOf { it.credits }
        val entity = applications.save(ReReadingApplication(
            plan = plan, student = student, contractNumber = request.contractNumber?.trim()?.takeIf(String::isNotBlank) ?: "PENDING-${UUID.randomUUID()}",
            totalCredits = request.totalCredits.takeIf { it > 0 } ?: derivedCredits,
            totalAmount = request.totalAmount.setScale(2, RoundingMode.HALF_UP),
            paidAmount = request.paidAmount.setScale(2, RoundingMode.HALF_UP),
        ))
        if (entity.contractNumber.startsWith("PENDING-")) entity.contractNumber = "QO-${Year.now().value}-${requireNotNull(entity.id).toString().padStart(6, '0')}"
        val saved = applications.save(entity)
        audit.logAction("RE_READING_APPLICATION_CREATED", actorId, "id=${saved.id}; student=${request.studentId}; contract=${saved.contractNumber}")
        return applicationDto(saved, groupNames())
    }

    @Transactional
    fun updateApplication(id: Long, request: SaveReReadingApplicationRequest, actorId: Long): ReReadingApplicationDto {
        validateApplication(request)
        val entity = requireApplication(id)
        require(entity.status == ReReadingApplicationStatus.DRAFT) { "Faqat qoralama arizani tahrirlash mumkin" }
        val duplicate = applications.existsByPlanIdAndStudentIdAndDeletedFalse(request.planId, request.studentId)
        require(!duplicate || (entity.plan.id == request.planId && entity.student.id == request.studentId)) { "Bu talaba reja bo'yicha allaqachon ariza bergan" }
        entity.plan = requirePlan(request.planId)
        entity.student = students.findById(request.studentId).orElseThrow { NoSuchElementException("Talaba topilmadi: ${request.studentId}") }
        entity.contractNumber = request.contractNumber?.trim()?.takeIf(String::isNotBlank) ?: entity.contractNumber
        entity.totalCredits = request.totalCredits.takeIf { it > 0 } ?: currentEnrollments(request.studentId).sumOf { it.credits }
        entity.totalAmount = request.totalAmount.setScale(2, RoundingMode.HALF_UP)
        entity.paidAmount = request.paidAmount.setScale(2, RoundingMode.HALF_UP)
        val saved = applications.save(entity)
        audit.logAction("RE_READING_APPLICATION_UPDATED", actorId, "id=$id")
        return applicationDto(saved, groupNames())
    }

    @Transactional
    fun changeStatus(id: Long, request: ChangeReReadingStatusRequest, actorId: Long): ReReadingApplicationDto {
        val entity = requireApplication(id)
        require(validTransition(entity.status, request.status)) { "${entity.status} holatidan ${request.status} holatiga o'tib bo'lmaydi" }
        entity.status = request.status
        if (request.status == ReReadingApplicationStatus.SUBMITTED) entity.submittedAt = Instant.now()
        val saved = applications.save(entity)
        audit.logAction("RE_READING_APPLICATION_STATUS", actorId, "id=$id; status=${saved.status}")
        return applicationDto(saved, groupNames())
    }

    @Transactional
    fun deleteApplication(id: Long, actorId: Long) {
        val entity = requireApplication(id)
        require(entity.status == ReReadingApplicationStatus.DRAFT || entity.status == ReReadingApplicationStatus.REJECTED) { "Topshirilgan yoki tasdiqlangan arizani o'chirib bo'lmaydi" }
        entity.deleted = true
        applications.save(entity)
        audit.logAction("RE_READING_APPLICATION_DELETED", actorId, "id=$id")
    }

    @Transactional(readOnly = true)
    fun recoveryResults(): List<ReReadingRecoveryDto> {
        val groupNames = groupNames()
        val rows = analytics.studentResults().groupBy { it.studentId }
        return applications.findAllByDeletedFalseOrderByCreatedAtDesc()
            .filter { it.status == ReReadingApplicationStatus.APPROVED }
            .map { entity -> ReReadingRecoveryDto(
                applicationId = requireNotNull(entity.id), fullName = entity.student.fullName,
                studentNumber = entity.student.studentNumber, group = entity.student.groupId?.let(groupNames::get).orEmpty(),
                contractNumber = entity.contractNumber, status = entity.status,
                results = rows[requireNotNull(entity.student.id)].orEmpty(),
            ) }
    }

    @Transactional(readOnly = true)
    fun teacherReport(): List<ReReadingTeacherReportDto> {
        val approved = applications.findAllByDeletedFalseOrderByCreatedAtDesc().filter { it.status == ReReadingApplicationStatus.APPROVED }
        val studentIds = approved.mapNotNull { it.student.id }.toSet()
        if (studentIds.isEmpty()) return emptyList()
        val teacherNames = teachers.findAllByActiveTrueOrderByFullNameAsc().mapNotNull { teacher -> teacher.user?.id?.let { it to teacher } }.toMap()
        return enrollments.findAllByStudentIdInAndDeletedFalseOrderByStudentIdAscAcademicYearAscSemesterAscEnrolledAtAsc(studentIds)
            .filter { it.status != CourseEnrollmentStatus.WITHDRAWN && it.course.userId != null }
            .groupBy { requireNotNull(it.course.userId) }
            .map { (userId, rows) ->
                val teacher = teacherNames[userId]
                ReReadingTeacherReportDto(
                    teacherId = teacher?.id ?: userId, teacherName = teacher?.fullName ?: "O'qituvchi #$userId",
                    subjects = rows.map { it.course.subject?.name ?: it.course.subjectName ?: it.course.title.orEmpty() }.filter(String::isNotBlank).distinct().sorted(),
                    studentCount = rows.mapNotNull { it.student.id }.distinct().size, totalCredits = rows.sumOf { it.credits },
                )
            }.sortedBy { it.teacherName }
    }

    @Transactional(readOnly = true)
    fun studentReport(): List<ReReadingStudentReportDto> {
        val groupNames = groupNames()
        val results = analytics.studentResults().groupBy { it.studentId }
        return applications.findAllByDeletedFalseOrderByCreatedAtDesc().map { entity ->
            val rows = results[requireNotNull(entity.student.id)].orEmpty().filter { it.assessed }
            ReReadingStudentReportDto(
                application = applicationDto(entity, groupNames), assessedSubjects = rows.size,
                passedSubjects = rows.count { it.passed }, debtSubjects = rows.count { !it.passed },
                averageScore = rows.takeIf(List<*>::isNotEmpty)?.mapNotNull { it.totalScore }?.average()?.let { kotlin.math.round(it * 100) / 100 },
            )
        }
    }

    private fun validatePlan(request: SaveReReadingPlanRequest) {
        normalize(request.title, "Reja nomi", 3, 180)
        require(request.description.trim().length <= 4_000) { "Tavsif 4000 belgidan oshmasligi kerak" }
    }
    private fun validateApplication(request: SaveReReadingApplicationRequest) {
        require(request.totalCredits in 0..300) { "Kredit 0-300 oralig'ida bo'lishi kerak" }
        require(request.totalAmount >= BigDecimal.ZERO) { "Shartnoma summasi manfiy bo'lmaydi" }
        require(request.paidAmount >= BigDecimal.ZERO) { "To'langan summa manfiy bo'lmaydi" }
        require(request.paidAmount <= request.totalAmount) { "To'langan summa jami summadan oshmaydi" }
    }
    private fun normalize(value: String, label: String, min: Int, max: Int): String = value.trim().also { require(it.length in min..max) { "$label $min-$max belgi bo'lishi kerak" } }
    private fun requirePlan(id: Long) = plans.findByIdAndDeletedFalse(id) ?: throw NoSuchElementException("Qayta o'qish rejasi topilmadi: $id")
    private fun requireApplication(id: Long) = applications.findByIdAndDeletedFalse(id) ?: throw NoSuchElementException("Qayta o'qish arizasi topilmadi: $id")
    private fun currentEnrollments(studentId: Long) = enrollments.findAllByStudentIdAndStatusInAndDeletedFalseOrderByEnrolledAtDesc(studentId, listOf(CourseEnrollmentStatus.ACTIVE, CourseEnrollmentStatus.COMPLETED))
    private fun groupNames() = groups.findAll().filter { !it.deleted }.associate { requireNotNull(it.id) to it.name }
    private fun validTransition(from: ReReadingApplicationStatus, to: ReReadingApplicationStatus) = when (from) {
        ReReadingApplicationStatus.DRAFT -> to == ReReadingApplicationStatus.SUBMITTED
        ReReadingApplicationStatus.SUBMITTED -> to == ReReadingApplicationStatus.APPROVED || to == ReReadingApplicationStatus.REJECTED
        ReReadingApplicationStatus.REJECTED -> to == ReReadingApplicationStatus.DRAFT
        ReReadingApplicationStatus.APPROVED -> false
    }
    private fun planDto(value: ReReadingPlan) = ReReadingPlanDto(requireNotNull(value.id), value.title, value.applicationDeadline, value.description, value.status, value.createdAt, value.updatedAt)
    private fun applicationDto(value: ReReadingApplication, groupNames: Map<Long, String>) = ReReadingApplicationDto(
        id = requireNotNull(value.id), planId = requireNotNull(value.plan.id), planTitle = value.plan.title,
        studentId = requireNotNull(value.student.id), fullName = value.student.fullName, studentNumber = value.student.studentNumber,
        group = value.student.groupId?.let(groupNames::get).orEmpty(), contractNumber = value.contractNumber,
        totalCredits = value.totalCredits, totalAmount = value.totalAmount, paidAmount = value.paidAmount,
        debtAmount = value.totalAmount.subtract(value.paidAmount), status = value.status,
        submittedAt = value.submittedAt, createdAt = value.createdAt,
    )
}
