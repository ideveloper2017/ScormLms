package uz.scorm.lms.app.v1.attestation.service

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.attestation.dto.AddCommissionMemberRequest
import uz.scorm.lms.app.v1.attestation.dto.AttestationSessionDetailDto
import uz.scorm.lms.app.v1.attestation.dto.AttestationSessionStatsDto
import uz.scorm.lms.app.v1.attestation.dto.CompleteAttestationSessionRequest
import uz.scorm.lms.app.v1.attestation.dto.CreateAttestationSessionRequest
import uz.scorm.lms.app.v1.attestation.dto.PublishAttestationSessionRequest
import uz.scorm.lms.app.v1.attestation.dto.RemoveCommissionMemberRequest
import uz.scorm.lms.app.v1.attestation.dto.TeacherAttestationSessionDto
import uz.scorm.lms.app.v1.attestation.dto.UpdateAttestationSessionRequest
import uz.scorm.lms.app.v1.attestation.model.AttestationCommissionMember
import uz.scorm.lms.app.v1.attestation.model.AttestationSessionStatus
import uz.scorm.lms.app.v1.attestation.model.CommissionRole
import uz.scorm.lms.app.v1.attestation.model.DefenseDecision
import uz.scorm.lms.app.v1.attestation.model.DefenseStatus
import uz.scorm.lms.app.v1.attestation.model.StateAttestationSession
import uz.scorm.lms.app.v1.attestation.model.StudentDefense
import uz.scorm.lms.app.v1.attestation.repository.AttestationSessionRepository
import uz.scorm.lms.app.v1.attestation.repository.CommissionMemberRepository
import uz.scorm.lms.app.v1.attestation.repository.GraduationCertificateRepository
import uz.scorm.lms.app.v1.attestation.repository.StudentDefenseRepository
import uz.scorm.lms.app.v1.audit.service.AuditService
import uz.scorm.lms.app.v1.courses.model.CourseStatus
import uz.scorm.lms.app.v1.courses.model.CourseEnrollmentStatus
import uz.scorm.lms.app.v1.courses.repository.CourseEnrollmentRepository
import uz.scorm.lms.app.v1.courses.repository.CourseRepository
import uz.scorm.lms.app.v1.courses.service.CourseAccessService
import uz.scorm.lms.app.v1.user.repository.UserRepository
import java.time.Instant
import java.time.LocalDate

@Service
class AttestationSessionService(
    private val sessionRepository: AttestationSessionRepository,
    private val memberRepository: CommissionMemberRepository,
    private val defenseRepository: StudentDefenseRepository,
    private val certificateRepository: GraduationCertificateRepository,
    private val courseRepository: CourseRepository,
    private val enrollmentRepository: CourseEnrollmentRepository,
    private val userRepository: UserRepository,
    private val courseAccessService: CourseAccessService,
    private val auditService: AuditService,
) {

    @Transactional
    fun createSession(
        request: CreateAttestationSessionRequest,
        userId: Long,
        mayManageAll: Boolean,
    ): TeacherAttestationSessionDto {
        val course = courseAccessService.requireManage(request.courseId, userId, mayManageAll)
        require(course.status != CourseStatus.ARCHIVED.name) { "Arxivlangan kurs uchun attestatsiya sessiyasi yaratilmaydi" }

        val commissionChair = userRepository.findById(request.commissionChairId)
            .orElseThrow { IllegalArgumentException("Komissiya raisboshi topilmadi") }

        require(request.examDate >= LocalDate.now()) { "Attestatsiya sanasi bugundan keyingi bo'lishi kerak" }
        require(request.minCommissionMembers in 1..10) { "Komissiya azolari soni 1-10 oraligida bo'lishi kerak" }
        require(request.minPassScore in 0..100) { "Minimum o'tish balli 0-100 oraligida bo'lishi kerak" }
        require(request.title.isNotBlank()) { "Attestatsiya nomi majburiy" }
        require(request.location.isNotBlank()) { "Attestatsiya joyi majburiy" }

        val session = StateAttestationSession(
            course = course,
            semesterId = request.semesterId,
            title = request.title.trim(),
            description = request.description,
            examDate = request.examDate,
            examTime = request.examTime,
            location = request.location.trim(),
            commissionChair = commissionChair,
            defenseType = request.defenseType,
            minCommissionMembers = request.minCommissionMembers,
            minPassScore = request.minPassScore,
        )

        val saved = sessionRepository.save(session)
        memberRepository.save(AttestationCommissionMember(
            session = saved, user = commissionChair, role = CommissionRole.CHAIR,
            appointedBy = userRepository.findById(userId).orElseThrow(), appointedAt = Instant.now(),
        ))
        auditService.logAction("ATTESTATION_SESSION_CREATED", userId, "Attestatsiya sessiyasi yaratildi: ${saved.title}")
        return toTeacherDto(saved, 0, 0, 0)
    }

    @Transactional
    fun updateSession(
        sessionId: Long,
        request: UpdateAttestationSessionRequest,
        userId: Long,
        mayManageAll: Boolean,
    ): TeacherAttestationSessionDto {
        val session = sessionRepository.findByIdAndDeletedFalse(sessionId)
            ?: throw IllegalArgumentException("Attestatsiya sessiyasi topilmadi")

        courseAccessService.requireManage(session.course.id, userId, mayManageAll)
        require(session.status == AttestationSessionStatus.DRAFT) { "Faqat DRAFT sessiyasi o'zgartiriladi" }

        request.title?.let { session.title = it.trim() }
        request.description?.let { session.description = it }
        request.location?.let { session.location = it.trim() }
        request.examDate?.let {
            require(it >= LocalDate.now()) { "Attestatsiya sanasi bugundan keyingi bo'lishi kerak" }
            session.examDate = it
        }
        request.examTime?.let { session.examTime = it }
        request.commissionChairId?.let {
            session.commissionChair = userRepository.findById(it)
                .orElseThrow { IllegalArgumentException("Komissiya raisboshi topilmadi") }
        }
        request.minCommissionMembers?.let {
            require(it in 1..10) { "Komissiya azolari soni 1-10 oraligida bo'lishi kerak" }
            session.minCommissionMembers = it
        }
        request.minPassScore?.let {
            require(it in 0..100) { "Minimum o'tish balli 0-100 oraligida bo'lishi kerak" }
            session.minPassScore = it
        }

        val updated = sessionRepository.save(session)
        val stats = getSessionStats(sessionId)
        auditService.logAction("ATTESTATION_SESSION_UPDATED", userId, "Attestatsiya sessiyasi yangilandi: ${session.title}")
        return toTeacherDto(updated, stats.passedCount, stats.failedCount, stats.retakeCount)
    }

    @Transactional
    fun publishSession(
        sessionId: Long,
        request: PublishAttestationSessionRequest?,
        userId: Long,
        mayManageAll: Boolean,
    ): TeacherAttestationSessionDto {
        val session = sessionRepository.findByIdAndDeletedFalse(sessionId)
            ?: throw IllegalArgumentException("Attestatsiya sessiyasi topilmadi")

        courseAccessService.requireManage(session.course.id, userId, mayManageAll)
        require(session.status == AttestationSessionStatus.DRAFT) { "Faqat DRAFT sessiyalari nashr etilishi mumkin" }
        require(memberRepository.countBySessionIdAndDeletedFalse(sessionId) >= session.minCommissionMembers) {
            "Kam uchun ${session.minCommissionMembers} ta komissiya azosi talab qilinadi"
        }

        val enrollments = enrollmentRepository.findAllByCourseIdAndDeletedFalseOrderByEnrolledAtDesc(session.course.id!!)
            .filter { it.status in setOf(CourseEnrollmentStatus.ACTIVE, CourseEnrollmentStatus.COMPLETED) }
        require(enrollments.isNotEmpty()) { "Himoyaga biriktiriladigan talaba yo'q" }
        session.status = AttestationSessionStatus.PUBLISHED
        session.publishedAt = Instant.now()
        sessionRepository.save(session)
        enrollments.forEach { enrollment ->
            if (defenseRepository.findByAttestationSessionIdAndEnrollmentIdAndDeletedFalse(sessionId, enrollment.id!!) == null) {
                defenseRepository.save(StudentDefense(session, enrollment, defenseDate = session.examDate, defenseTime = session.examTime))
            }
        }

        val updated = sessionRepository.save(session)
        val stats = getSessionStats(sessionId)
        auditService.logAction("ATTESTATION_SESSION_PUBLISHED", userId, "Attestatsiya sessiyasi nashr etildi: ${session.title}")
        return toTeacherDto(updated, stats.passedCount, stats.failedCount, stats.retakeCount)
    }

    @Transactional
    fun startSession(sessionId: Long, userId: Long, mayManageAll: Boolean): TeacherAttestationSessionDto {
        val session = sessionRepository.findByIdAndDeletedFalse(sessionId)
            ?: throw IllegalArgumentException("Attestatsiya sessiyasi topilmadi")
        courseAccessService.requireManage(session.course.id, userId, mayManageAll)
        require(session.status == AttestationSessionStatus.PUBLISHED) { "Faqat e'lon qilingan sessiya boshlanadi" }
        require(session.examDate == LocalDate.now()) { "Attestatsiya faqat belgilangan sanada boshlanadi" }
        session.status = AttestationSessionStatus.ONGOING
        val saved = sessionRepository.save(session)
        val stats = getSessionStats(sessionId)
        auditService.logAction("ATTESTATION_SESSION_STARTED", userId, "Attestatsiya boshlandi: ${session.title}")
        return toTeacherDto(saved, stats.passedCount, stats.failedCount, stats.retakeCount)
    }

    @Transactional
    fun completeSession(
        sessionId: Long,
        request: CompleteAttestationSessionRequest?,
        userId: Long,
        mayManageAll: Boolean,
    ): TeacherAttestationSessionDto {
        val session = sessionRepository.findByIdAndDeletedFalse(sessionId)
            ?: throw IllegalArgumentException("Attestatsiya sessiyasi topilmadi")

        courseAccessService.requireManage(session.course.id, userId, mayManageAll)
        require(session.status == AttestationSessionStatus.ONGOING) { "Faqat davom etayotgan sessiya tugatiladi" }
        val defenses = defenseRepository.findAllByAttestationSessionIdAndDeletedFalseOrderByDefenseDateAsc(sessionId)
        require(defenses.all { it.defenseStatus in setOf(DefenseStatus.DEFENDED, DefenseStatus.CANCELLED) }) { "Barcha himoyalar yakunlanishi kerak" }
        require(defenses.filter { it.defenseStatus == DefenseStatus.DEFENDED }.all { it.commissionDecision != null }) { "Barcha himoyalar bo'yicha komissiya qarori kerak" }

        session.status = AttestationSessionStatus.COMPLETED
        session.heldAt = Instant.now()
        session.resultPublishedAt = Instant.now()

        val updated = sessionRepository.save(session)
        val stats = getSessionStats(sessionId)
        auditService.logAction("ATTESTATION_SESSION_COMPLETED", userId, "Attestatsiya sessiyasi tugatildi: ${session.title}")
        return toTeacherDto(updated, stats.passedCount, stats.failedCount, stats.retakeCount)
    }

    @Transactional
    fun addCommissionMember(
        sessionId: Long,
        request: AddCommissionMemberRequest,
        userId: Long,
        mayManageAll: Boolean,
    ) {
        val session = sessionRepository.findByIdAndDeletedFalse(sessionId)
            ?: throw IllegalArgumentException("Attestatsiya sessiyasi topilmadi")

        courseAccessService.requireManage(session.course.id, userId, mayManageAll)
        require(session.status == AttestationSessionStatus.DRAFT) { "Komissiya faqat DRAFT sessiyada o'zgartiriladi" }

        val user = userRepository.findById(request.userId)
            .orElseThrow { IllegalArgumentException("Foydalanuvchi topilmadi") }

        val role = try {
            CommissionRole.valueOf(request.role)
        } catch (e: IllegalArgumentException) {
            throw IllegalArgumentException("Noto'g'ri rol: ${request.role}")
        }

        val existing = memberRepository.findBySessionIdAndUserIdAndDeletedFalse(sessionId, request.userId)
        require(existing == null) { "Bu foydalanuvchi allaqachon komissiyada mavjud" }

        val member = AttestationCommissionMember(
            session = session,
            user = user,
            role = role,
            appointedBy = userRepository.findById(userId).orElseThrow(),
            appointedAt = Instant.now(),
        )

        memberRepository.save(member)
        auditService.logAction("COMMISSION_MEMBER_ADDED", userId, "Komissiya azo qo'shildi: $role - ${user.fullName}")
    }

    @Transactional
    fun removeCommissionMember(
        sessionId: Long,
        request: RemoveCommissionMemberRequest,
        userId: Long,
        mayManageAll: Boolean,
    ) {
        val session = sessionRepository.findByIdAndDeletedFalse(sessionId)
            ?: throw IllegalArgumentException("Attestatsiya sessiyasi topilmadi")

        courseAccessService.requireManage(session.course.id, userId, mayManageAll)
        require(session.status == AttestationSessionStatus.DRAFT) { "Komissiya faqat DRAFT sessiyada o'zgartiriladi" }

        val member = memberRepository.findByIdAndDeletedFalse(request.memberId)
            ?: throw IllegalArgumentException("Komissiya azosi topilmadi")

        require(member.session.id == sessionId) { "Komissiya azosi bu sessiyaga mas" }
        require(member.role != CommissionRole.CHAIR) { "Komissiya raisini o'chira olmaysiz" }

        member.deleted = true
        memberRepository.save(member)
        auditService.logAction("COMMISSION_MEMBER_REMOVED", userId, "Komissiya azosi o'chirildi: ${member.user.fullName}")
    }

    @Transactional(readOnly = true)
    fun getSessionDetails(
        sessionId: Long,
        userId: Long,
        mayManageAll: Boolean,
    ): AttestationSessionDetailDto {
        val session = sessionRepository.findByIdAndDeletedFalse(sessionId)
            ?: throw IllegalArgumentException("Attestatsiya sessiyasi topilmadi")

        courseAccessService.requireView(session.course.id, userId, mayManageAll)

        val members = memberRepository.findAllBySessionIdAndDeletedFalseOrderByRoleAsc(sessionId)
        val defenses = defenseRepository.findAllByAttestationSessionIdAndDeletedFalseOrderByDefenseDateAsc(sessionId)
        val stats = getSessionStats(sessionId)

        return AttestationSessionDetailDto(
            sessionId = session.id.toString(),
            courseId = session.course.id.toString(),
            courseTitle = session.course.name,
            title = session.title,
            examDate = session.examDate,
            examTime = session.examTime,
            location = session.location,
            defenseType = session.defenseType.name,
            status = session.status.name,
            commission = uz.scorm.lms.app.v1.attestation.dto.CommissionDetailsDto(
                sessionId = session.id.toString(),
                chairName = session.commissionChair.fullName ?: session.commissionChair.username,
                chairEmail = session.commissionChair.email.orEmpty(),
                members = members.map {
                    uz.scorm.lms.app.v1.attestation.dto.CommissionMemberDto(
                        id = it.id.toString(),
                        userId = it.user.id.toString(),
                        userName = it.user.fullName ?: it.user.username,
                        userEmail = it.user.email.orEmpty(),
                        role = it.role.name,
                        appointedBy = it.appointedBy.fullName ?: it.appointedBy.username,
                        appointedAt = it.appointedAt,
                    )
                },
                totalMembers = members.size,
                membersByRole = members.groupingBy { it.role.name }.eachCount(),
            ),
            statistics = stats,
            defenseList = defenses.map {
                uz.scorm.lms.app.v1.attestation.dto.StudentDefenseForSessionDto(
                    defenseId = it.id.toString(),
                    studentId = it.enrollment.student.id.toString(),
                    studentName = it.enrollment.student.fullName ?: it.enrollment.student.username,
                    studentEmail = it.enrollment.student.email.orEmpty(),
                    defenseStatus = it.defenseStatus.name,
                    defenseDate = it.defenseDate,
                    defenseTime = it.defenseTime,
                    commissionDecision = it.commissionDecision?.name,
                    averageScore = it.commissionScore.toDouble(),
                    certificateIssued = certificateRepository.findByStudentDefenseIdAndDeletedFalse(it.id!!) != null,
                )
            },
        )
    }

    @Transactional(readOnly = true)
    fun getTeacherSessions(userId: Long, mayManageAll: Boolean): List<TeacherAttestationSessionDto> {
        val sessions = if (mayManageAll) {
            sessionRepository.findAllByStatusAndDeletedFalseOrderByExamDateAsc(AttestationSessionStatus.PUBLISHED)
        } else {
            sessionRepository.findAllByCommissionChairIdAndDeletedFalseOrderByExamDateDesc(userId)
        }

        return sessions.map { session ->
            val stats = getSessionStats(session.id!!)
            toTeacherDto(session, stats.passedCount, stats.failedCount, stats.retakeCount)
        }
    }

    @Transactional(readOnly = true)
    fun deleteSession(
        sessionId: Long,
        userId: Long,
        mayManageAll: Boolean,
    ) {
        val session = sessionRepository.findByIdAndDeletedFalse(sessionId)
            ?: throw IllegalArgumentException("Attestatsiya sessiyasi topilmadi")

        courseAccessService.requireManage(session.course.id, userId, mayManageAll)
        require(session.status == AttestationSessionStatus.DRAFT) { "Faqat DRAFT sessiyalar o'chirilishi mumkin" }

        session.deleted = true
        sessionRepository.save(session)
        auditService.logAction("ATTESTATION_SESSION_DELETED", userId, "Attestatsiya sessiyasi o'chirildi: ${session.title}")
    }

    private fun getSessionStats(sessionId: Long): AttestationSessionStatsDto {
        val defenses = defenseRepository.findAllByAttestationSessionIdAndDeletedFalseOrderByDefenseDateAsc(sessionId)
        val passedCount = defenses.count { it.commissionDecision == DefenseDecision.PASS }
        val failedCount = defenses.count { it.commissionDecision == DefenseDecision.FAIL }
        val retakeCount = defenses.count { it.commissionDecision == DefenseDecision.RETAKE }
        val certificatesIssued = certificateRepository.findAllByAttestationSessionId(sessionId).size
        val certificatesPending = defenses.filter { it.commissionDecision == DefenseDecision.PASS }.size - certificatesIssued

        val averageScore = if (defenses.isNotEmpty()) {
            defenses.map { it.commissionScore.toDouble() }.average()
        } else {
            null
        }

        val highestScore = if (defenses.isNotEmpty()) {
            defenses.maxOfOrNull { it.commissionScore.toDouble() }
        } else {
            null
        }

        val lowestScore = if (defenses.isNotEmpty()) {
            defenses.minOfOrNull { it.commissionScore.toDouble() }
        } else {
            null
        }

        return AttestationSessionStatsDto(
            sessionId = sessionId.toString(),
            totalEnrolled = defenses.size,
            defenseScheduled = defenses.count { it.defenseStatus == DefenseStatus.SCHEDULED },
            defenseCompleted = defenses.count { it.defenseStatus == DefenseStatus.DEFENDED },
            defenceCancelled = defenses.count { it.defenseStatus == DefenseStatus.CANCELLED },
            passedCount = passedCount,
            failedCount = failedCount,
            retakeCount = retakeCount,
            passPercentage = if (defenses.isNotEmpty()) (passedCount.toDouble() / defenses.size) * 100 else 0.0,
            averageScore = averageScore,
            highestScore = highestScore,
            lowestScore = lowestScore,
            certificatesIssued = certificatesIssued,
            certificatesPending = certificatesPending,
            protocolApproved = false, // Will be updated by protocol service
            resultPublished = false, // Will be updated when results published
        )
    }

    private fun toTeacherDto(
        session: StateAttestationSession,
        passedCount: Int,
        failedCount: Int,
        retakeCount: Int,
    ): TeacherAttestationSessionDto {
        val memberCount = memberRepository.countBySessionIdAndDeletedFalse(session.id!!)
        val sessionId = requireNotNull(session.id)
        val defenseCount = defenseRepository.countByAttestationSessionIdAndDefenseStatusAndDeletedFalse(
            sessionId,
            DefenseStatus.DEFENDED,
        )
        val certificateCount = certificateRepository.countByAttestationSessionId(sessionId)

        return TeacherAttestationSessionDto(
            id = session.id.toString(),
            courseId = session.course.id.toString(),
            courseTitle = session.course.name,
            title = session.title,
            description = session.description,
            examDate = session.examDate,
            examTime = session.examTime,
            location = session.location,
            defenseType = session.defenseType.name,
            commissionChairId = session.commissionChair.id.toString(),
            chairName = session.commissionChair.fullName ?: session.commissionChair.username,
            status = session.status.name,
            minCommissionMembers = session.minCommissionMembers,
            currentMemberCount = memberCount.toInt(),
            minPassScore = session.minPassScore,
            totalEnrolled = defenseRepository.findAllByAttestationSessionIdAndDeletedFalseOrderByDefenseDateAsc(session.id!!).size,
            defenseCount = defenseCount.toInt(),
            passedCount = passedCount,
            failedCount = failedCount,
            retakeCount = retakeCount,
            publishedAt = session.publishedAt,
            heldAt = session.heldAt,
            resultPublishedAt = session.resultPublishedAt,
            createdAt = session.createdAt!!,
            updatedAt = session.updatedAt!!,
        )
    }
}
