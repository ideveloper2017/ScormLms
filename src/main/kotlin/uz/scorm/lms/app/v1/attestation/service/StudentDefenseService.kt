package uz.scorm.lms.app.v1.attestation.service

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.attestation.dto.CancelDefenseRequest
import uz.scorm.lms.app.v1.attestation.dto.DefenseGradeDto
import uz.scorm.lms.app.v1.attestation.dto.RecordDefenseRequest
import uz.scorm.lms.app.v1.attestation.dto.RescheduleDefenseRequest
import uz.scorm.lms.app.v1.attestation.dto.ScheduleDefenseRequest
import uz.scorm.lms.app.v1.attestation.dto.StudentDefenseDetailsDto
import uz.scorm.lms.app.v1.attestation.dto.StudentDefenseHistoryDto
import uz.scorm.lms.app.v1.attestation.dto.StudentGradeDto
import uz.scorm.lms.app.v1.attestation.dto.SubmitGradeRequest
import uz.scorm.lms.app.v1.attestation.model.AttestationGrade
import uz.scorm.lms.app.v1.attestation.model.DefenseDecision
import uz.scorm.lms.app.v1.attestation.model.DefenseStatus
import uz.scorm.lms.app.v1.attestation.model.StudentDefense
import uz.scorm.lms.app.v1.attestation.repository.AttestationGradeRepository
import uz.scorm.lms.app.v1.attestation.repository.StudentDefenseRepository
import uz.scorm.lms.app.v1.attestation.repository.CommissionMemberRepository
import uz.scorm.lms.app.v1.attestation.repository.GraduationCertificateRepository
import uz.scorm.lms.app.v1.attestation.dto.StudentAttestationSessionDto
import uz.scorm.lms.app.v1.attestation.model.AttestationSessionStatus
import uz.scorm.lms.app.v1.audit.service.AuditService
import uz.scorm.lms.app.v1.courses.repository.CourseEnrollmentRepository
import uz.scorm.lms.app.v1.courses.service.CourseAccessService
import uz.scorm.lms.app.v1.user.repository.UserRepository
import java.math.BigDecimal
import java.time.Instant

@Service
class StudentDefenseService(
    private val defenseRepository: StudentDefenseRepository,
    private val gradeRepository: AttestationGradeRepository,
    private val memberRepository: CommissionMemberRepository,
    private val certificateRepository: GraduationCertificateRepository,
    private val enrollmentRepository: CourseEnrollmentRepository,
    private val userRepository: UserRepository,
    private val courseAccessService: CourseAccessService,
    private val auditService: AuditService,
) {

    @Transactional
    fun scheduleDefense(
        defenseId: Long,
        request: ScheduleDefenseRequest,
        userId: Long,
    ): StudentDefenseDetailsDto {
        val defense = defenseRepository.findByIdAndDeletedFalse(defenseId)
            ?: throw IllegalArgumentException("Himoya topilmadi")

        val enrollment = defense.enrollment
        require(enrollment.student.user.id == userId) { "Faqat o'z himoyangizni rejalashtira olasiz" }

        request.defenseDate?.let {
            require(it >= defense.attestationSession.examDate) { "Himoya sanasi sessiya sanasidan ertaroq bo'lishi mumkin emas" }
            defense.defenseDate = it
        }
        request.defenseTime?.let { defense.defenseTime = it }
        request.presentationFileUrl?.let { defense.presentationFileUrl = it }

        val updated = defenseRepository.save(defense)
        auditService.logAction("DEFENSE_SCHEDULED", userId, "Himoya rejalashtrildi: ${enrollment.student.fullName}")
        return toStudentDefenseDetailsDto(updated)
    }

    @Transactional
    fun recordDefense(
        defenseId: Long,
        request: RecordDefenseRequest,
        userId: Long,
        mayManageAll: Boolean,
    ): uz.scorm.lms.app.v1.attestation.dto.TeacherStudentDefenseDto {
        val defense = defenseRepository.findByIdAndDeletedFalse(defenseId)
            ?: throw IllegalArgumentException("Himoya topilmadi")

        courseAccessService.requireManage(defense.attestationSession.course.id, userId, mayManageAll)
        require(defense.attestationSession.status == AttestationSessionStatus.ONGOING) { "Himoya faqat davom etayotgan sessiyada qayd etiladi" }

        request.defenseDate?.let { defense.defenseDate = it }
        request.defenseTime?.let { defense.defenseTime = it }
        request.presentationFileUrl?.let { defense.presentationFileUrl = it }
        request.presentationFileName?.let { defense.presentationFileName = it }
        request.defenseNotes?.let { defense.defenseNotes = it }

        val status = try {
            DefenseStatus.valueOf(request.defenseStatus)
        } catch (e: IllegalArgumentException) {
            throw IllegalArgumentException("Noto'g'ri himoya holati: ${request.defenseStatus}")
        }
        defense.defenseStatus = status

        val updated = defenseRepository.save(defense)
        auditService.logAction("DEFENSE_RECORDED", userId, "Himoya qayd etildi: ${defense.enrollment.student.fullName}")
        return toTeacherStudentDefenseDto(updated)
    }

    @Transactional
    fun submitGrade(
        defenseId: Long,
        userId: Long,
        request: SubmitGradeRequest,
        mayManageAll: Boolean,
    ): DefenseGradeDto {
        val defense = defenseRepository.findByIdAndDeletedFalse(defenseId)
            ?: throw IllegalArgumentException("Himoya topilmadi")

        require(defense.attestationSession.status == AttestationSessionStatus.ONGOING) { "Baho faqat davom etayotgan sessiyada beriladi" }
        require(defense.defenseStatus == DefenseStatus.DEFENDED) { "Avval himoya o'tkazilgan deb qayd etilishi kerak" }
        require(mayManageAll || memberRepository.findBySessionIdAndUserIdAndDeletedFalse(defense.attestationSession.id!!, userId) != null) {
            "Faqat komissiya a'zosi baho bera oladi"
        }
        require(request.score >= BigDecimal.ZERO && request.score <= BigDecimal("100")) {
            "Ball 0 dan 100 gacha bo'lishi kerak"
        }

        val grader = userRepository.findById(userId)
            .orElseThrow { IllegalArgumentException("Foydalanuvchi topilmadi") }

        val existingGrade = gradeRepository.findByStudentDefenseIdAndGradedByIdAndDeletedFalse(defenseId, userId)

        val grade = if (existingGrade != null) {
            existingGrade.score = request.score
            existingGrade.criteriaScores = request.criteriaScores
            existingGrade.comments = request.comments
            existingGrade.gradingDate = Instant.now()
            existingGrade
        } else {
            AttestationGrade(
                studentDefense = defense,
                gradedBy = grader,
                score = request.score,
                criteriaScores = request.criteriaScores,
                comments = request.comments,
                gradingDate = Instant.now(),
            )
        }

        val saved = gradeRepository.save(grade)

        // Update defense with average score
        val allGrades = gradeRepository.findAllByStudentDefenseIdAndDeletedFalseOrderByGradingDateDesc(defenseId)
        val avgScore = if (allGrades.isNotEmpty()) {
            allGrades.map { it.score }.fold(BigDecimal.ZERO, BigDecimal::add) / BigDecimal(allGrades.size)
        } else {
            BigDecimal.ZERO
        }
        defense.commissionScore = avgScore
        defense.totalGraders = allGrades.size
        if (allGrades.size >= defense.attestationSession.minCommissionMembers) {
            defense.commissionDecision = if (avgScore.toDouble() >= defense.attestationSession.minPassScore) DefenseDecision.PASS else DefenseDecision.FAIL
        }
        defenseRepository.save(defense)

        auditService.logAction("GRADE_SUBMITTED", userId, "Ball berildi: ${defense.enrollment.student.fullName} - ${request.score}")

        return DefenseGradeDto(
            id = saved.id.toString(),
            gradedByName = grader.fullName ?: grader.username,
            gradedByEmail = grader.email.orEmpty(),
            score = saved.score.toDouble(),
            criteriaScores = saved.criteriaScores,
            comments = saved.comments,
            gradingDate = saved.gradingDate,
        )
    }

    @Transactional
    fun cancelDefense(
        defenseId: Long,
        request: CancelDefenseRequest,
        userId: Long,
        mayManageAll: Boolean,
    ): StudentDefenseDetailsDto {
        val defense = defenseRepository.findByIdAndDeletedFalse(defenseId)
            ?: throw IllegalArgumentException("Himoya topilmadi")

        courseAccessService.requireManage(defense.attestationSession.course.id, userId, mayManageAll)
        require(defense.defenseStatus != DefenseStatus.CANCELLED) { "Himoya allaqachon bekor qilingan" }

        defense.defenseStatus = DefenseStatus.CANCELLED
        val updated = defenseRepository.save(defense)

        auditService.logAction("DEFENSE_CANCELLED", userId, "Himoya bekor qilindi: ${defense.enrollment.student.fullName}")
        return toStudentDefenseDetailsDto(updated)
    }

    @Transactional
    fun rescheduleDefense(
        defenseId: Long,
        request: RescheduleDefenseRequest,
        userId: Long,
    ): StudentDefenseDetailsDto {
        val defense = defenseRepository.findByIdAndDeletedFalse(defenseId)
            ?: throw IllegalArgumentException("Himoya topilmadi")

        val enrollment = defense.enrollment
        require(enrollment.student.user.id == userId) { "Faqat o'z himoyangizni qayta rejalashtira olasiz" }

        require(request.newDefenseDate >= defense.attestationSession.examDate) {
            "Yangi himoya sanasi sessiya sanasidan ertaroq bo'lishi mumkin emas"
        }

        defense.defenseDate = request.newDefenseDate
        defense.defenseTime = request.newDefenseTime
        defense.defenseStatus = DefenseStatus.RESCHEDULED

        val updated = defenseRepository.save(defense)
        auditService.logAction("DEFENSE_RESCHEDULED", userId, "Himoya qayta rejalashtrildi: ${enrollment.student.fullName}")
        return toStudentDefenseDetailsDto(updated)
    }

    @Transactional(readOnly = true)
    fun getDefenseDetails(
        defenseId: Long,
        userId: Long,
        isTeacher: Boolean,
    ): Any {
        val defense = defenseRepository.findByIdAndDeletedFalse(defenseId)
            ?: throw IllegalArgumentException("Himoya topilmadi")

        return if (isTeacher) {
            courseAccessService.requireManage(defense.attestationSession.course.id, userId, false)
            toTeacherStudentDefenseDto(defense)
        } else {
            require(defense.enrollment.student.user.id == userId) { "Boshqa talabaning himoyasini ko'ra olmaysiz" }
            toStudentDefenseDetailsDto(defense)
        }
    }

    @Transactional(readOnly = true)
    fun getStudentDefenseHistory(
        enrollmentId: Long,
        userId: Long,
    ): List<StudentDefenseHistoryDto> {
        val defenses = defenseRepository.findAllByEnrollmentIdAndDeletedFalseOrderByAttestationSessionIdDesc(enrollmentId)
        val enrollment = enrollmentRepository.findById(enrollmentId).orElseThrow { IllegalArgumentException("Biriktiruv topilmadi") }
        if (enrollment.student.user.id != userId) {
            courseAccessService.requireManage(enrollment.course.id, userId, false)
        }

        return defenses.map { defense ->
            StudentDefenseHistoryDto(
                courseId = defense.attestationSession.course.id.toString(),
                courseName = defense.attestationSession.course.name,
                sessionTitle = defense.attestationSession.title,
                defenseStatus = defense.defenseStatus.name,
                defenseDate = defense.defenseDate,
                defenseDecision = defense.commissionDecision?.name,
                averageScore = defense.commissionScore.toDouble(),
                certificateIssued = false, // Will be checked by certificate service
            )
        }
    }

    @Transactional(readOnly = true)
    fun getMyAttestations(userId: Long): List<StudentAttestationSessionDto> = defenseRepository
        .findAllByEnrollmentStudentUserIdAndDeletedFalseOrderByAttestationSessionExamDateDesc(userId)
        .filter { it.attestationSession.status != AttestationSessionStatus.DRAFT }
        .map { defense ->
            val session = defense.attestationSession
            val certificate = certificateRepository.findByStudentDefenseIdAndDeletedFalse(defense.id!!)
            val published = session.status == AttestationSessionStatus.COMPLETED && session.resultPublishedAt != null
            StudentAttestationSessionDto(
                id = session.id!!.toString(), courseId = session.course.id!!.toString(), courseTitle = session.course.name,
                title = session.title, description = session.description, examDate = session.examDate, examTime = session.examTime,
                location = session.location, defenseType = session.defenseType.name,
                chairName = session.commissionChair.fullName ?: session.commissionChair.username, status = session.status.name,
                myDefenseStatus = defense.defenseStatus.name,
                myDefenseDecision = defense.commissionDecision?.name?.takeIf { published },
                myScore = defense.commissionScore.toDouble().takeIf { published },
                myAverageScore = defense.commissionScore.toDouble().takeIf { published },
                certificateIssued = certificate != null, certificateNumber = certificate?.certificateNumber,
                resultPublished = published,
            )
        }

    private fun toTeacherStudentDefenseDto(defense: StudentDefense): uz.scorm.lms.app.v1.attestation.dto.TeacherStudentDefenseDto {
        val grades = gradeRepository.findAllByStudentDefenseIdAndDeletedFalseOrderByGradingDateDesc(defense.id!!)

        return uz.scorm.lms.app.v1.attestation.dto.TeacherStudentDefenseDto(
            id = defense.id.toString(),
            sessionId = defense.attestationSession.id.toString(),
            sessionTitle = defense.attestationSession.title,
            enrollmentId = defense.enrollment.id.toString(),
            studentId = defense.enrollment.student.id.toString(),
            studentName = defense.enrollment.student.fullName ?: defense.enrollment.student.username,
            studentEmail = defense.enrollment.student.email.orEmpty(),
            defenseStatus = defense.defenseStatus.name,
            defenseDate = defense.defenseDate,
            defenseTime = defense.defenseTime,
            location = defense.attestationSession.location,
            presentationFileName = defense.presentationFileName,
            presentationFileUrl = defense.presentationFileUrl,
            defenseNotes = defense.defenseNotes,
            commissionDecision = defense.commissionDecision?.name,
            commissionScore = defense.commissionScore.toDouble(),
            gradeCount = grades.size,
            allGradesSubmitted = grades.size >= defense.totalGraders,
            grades = grades.map {
                DefenseGradeDto(
                    id = it.id.toString(),
                    gradedByName = it.gradedBy.fullName ?: it.gradedBy.username,
                    gradedByEmail = it.gradedBy.email.orEmpty(),
                    score = it.score.toDouble(),
                    criteriaScores = it.criteriaScores,
                    comments = it.comments,
                    gradingDate = it.gradingDate,
                )
            },
            createdAt = defense.createdAt!!,
            updatedAt = defense.updatedAt!!,
        )
    }

    private fun toStudentDefenseDetailsDto(defense: StudentDefense): StudentDefenseDetailsDto {
        val grades = gradeRepository.findAllByStudentDefenseIdAndDeletedFalseOrderByGradingDateDesc(defense.id!!)
        val avgScore = if (grades.isNotEmpty()) {
            grades.map { it.score.toDouble() }.average()
        } else {
            null
        }

        return StudentDefenseDetailsDto(
            id = defense.id.toString(),
            sessionId = defense.attestationSession.id.toString(),
            sessionTitle = defense.attestationSession.title,
            courseId = defense.attestationSession.course.id.toString(),
            courseName = defense.attestationSession.course.name,
            examDate = defense.attestationSession.examDate,
            examTime = defense.attestationSession.examTime,
            location = defense.attestationSession.location,
            defenseType = defense.attestationSession.defenseType.name,
            defenseStatus = defense.defenseStatus.name,
            defenseDate = defense.defenseDate,
            defenseTime = defense.defenseTime,
            presentationFileName = defense.presentationFileName,
            presentationFileUrl = defense.presentationFileUrl,
            commissionDecision = defense.commissionDecision?.name,
            averageScore = avgScore,
            myGrades = grades.map {
                StudentGradeDto(
                    gradedByName = it.gradedBy.fullName ?: it.gradedBy.username,
                    gradedByEmail = it.gradedBy.email.orEmpty(),
                    score = it.score.toDouble(),
                    comments = it.comments,
                    gradingDate = it.gradingDate,
                )
            },
            certificateIssued = false, // Will be checked by certificate service
            certificateNumber = null, // Will be set by certificate service
            createdAt = defense.createdAt!!,
            updatedAt = defense.updatedAt!!,
        )
    }
}
