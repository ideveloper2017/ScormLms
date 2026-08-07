package uz.scorm.lms.app.v1.orientation.service

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.audit.service.AuditService
import uz.scorm.lms.app.v1.orientation.dto.CreateLmsOrientationRequest
import uz.scorm.lms.app.v1.orientation.dto.LmsOrientationAttendeeDto
import uz.scorm.lms.app.v1.orientation.dto.LmsOrientationSessionDto
import uz.scorm.lms.app.v1.orientation.dto.StudentLmsOrientationDto
import uz.scorm.lms.app.v1.orientation.model.LmsOrientationAttendanceStatus
import uz.scorm.lms.app.v1.orientation.model.LmsOrientationAttendee
import uz.scorm.lms.app.v1.orientation.model.LmsOrientationSession
import uz.scorm.lms.app.v1.orientation.model.LmsOrientationSessionStatus
import uz.scorm.lms.app.v1.orientation.repository.LmsOrientationAttendeeRepository
import uz.scorm.lms.app.v1.orientation.repository.LmsOrientationSessionRepository
import uz.scorm.lms.app.v1.student.model.EducationForm
import uz.scorm.lms.app.v1.student.model.StudentStatus
import uz.scorm.lms.app.v1.student.repository.StudentRepository
import uz.scorm.lms.app.v1.user.repository.UserRepository
import java.time.Instant

@Service
class LmsOrientationService(
    private val sessionRepository: LmsOrientationSessionRepository,
    private val attendeeRepository: LmsOrientationAttendeeRepository,
    private val studentRepository: StudentRepository,
    private val userRepository: UserRepository,
    private val auditService: AuditService,
) {
    companion object {
        const val ACKNOWLEDGEMENT_VERSION = "decision-559-clause-21-v1"
    }

    @Transactional(readOnly = true)
    fun list(): List<LmsOrientationSessionDto> =
        sessionRepository.findAllByDeletedFalseOrderByStartsAtDesc().map(::toSessionDto)

    @Transactional(readOnly = true)
    fun attendees(sessionId: Long): List<LmsOrientationAttendeeDto> {
        requireSession(sessionId)
        return attendeeRepository.findAllBySessionIdAndDeletedFalseOrderByStudentLastNameAsc(sessionId)
            .map(::toAttendeeDto)
    }

    @Transactional
    fun create(request: CreateLmsOrientationRequest, actorId: Long): LmsOrientationSessionDto {
        require(request.title.isNotBlank()) { "Orientatsiya nomi majburiy" }
        require(request.venue.isNotBlank()) { "Shaxsan o'tkaziladigan joy majburiy" }
        require(request.academicYear.matches(Regex("\\d{4}-\\d{4}"))) { "O'quv yili YYYY-YYYY formatida bo'lishi kerak" }
        require(request.endsAt.isAfter(request.startsAt)) { "Tugash vaqti boshlanish vaqtidan keyin bo'lishi kerak" }
        val actor = requireUser(actorId)
        val saved = sessionRepository.save(LmsOrientationSession(
            title = request.title.trim(),
            venue = request.venue.trim(),
            academicYear = request.academicYear,
            startsAt = request.startsAt,
            endsAt = request.endsAt,
            instructions = request.instructions?.trim()?.takeIf(String::isNotEmpty),
            programId = request.programId,
            groupId = request.groupId,
            createdByUser = actor,
        ))
        auditService.logAction("LMS_ORIENTATION_CREATED", actorId, "session=${saved.id}; venue=${saved.venue}")
        return toSessionDto(saved)
    }

    @Transactional
    fun publish(sessionId: Long, actorId: Long): LmsOrientationSessionDto {
        val session = requireSession(sessionId)
        require(session.status == LmsOrientationSessionStatus.DRAFT) { "Faqat DRAFT orientatsiya e'lon qilinadi" }
        val eligible = studentRepository.findAllByEducationFormAndStudentStatusAndLmsOrientationRequiredTrue(
            EducationForm.DISTANCE,
            StudentStatus.ACTIVE,
        ).filter { student ->
            (session.programId == null || student.programId == session.programId) &&
                (session.groupId == null || student.groupId == session.groupId)
        }
        require(eligible.isNotEmpty()) { "Orientatsiyaga biriktiriladigan faol masofaviy talaba topilmadi" }
        eligible.forEach { student ->
            if (attendeeRepository.findBySessionIdAndStudentIdAndDeletedFalse(sessionId, requireNotNull(student.id)) == null) {
                attendeeRepository.save(LmsOrientationAttendee(session = session, student = student))
            }
        }
        val now = Instant.now()
        session.status = LmsOrientationSessionStatus.PUBLISHED
        session.publishedAt = now
        session.publishedByUser = requireUser(actorId)
        sessionRepository.save(session)
        auditService.logAction("LMS_ORIENTATION_PUBLISHED", actorId, "session=$sessionId; attendees=${eligible.size}")
        return toSessionDto(session)
    }

    @Transactional
    fun recordAttendance(
        sessionId: Long,
        studentId: Long,
        status: LmsOrientationAttendanceStatus,
        actorId: Long,
    ): LmsOrientationAttendeeDto {
        require(status != LmsOrientationAttendanceStatus.INVITED) { "Davomat yakuniy holat bilan qayd etilishi kerak" }
        val session = requireSession(sessionId)
        require(session.status == LmsOrientationSessionStatus.PUBLISHED) { "Davomat faqat e'lon qilingan orientatsiyada qayd etiladi" }
        require(!session.startsAt.isAfter(Instant.now())) { "Davomat orientatsiya boshlanganidan keyin qayd etiladi" }
        val attendee = attendeeRepository.findBySessionIdAndStudentIdAndDeletedFalse(sessionId, studentId)
            ?: throw NoSuchElementException("Talaba ushbu orientatsiyaga biriktirilmagan")
        require(attendee.acknowledgementAt == null || status == LmsOrientationAttendanceStatus.PRESENT) {
            "Yo'riqnomani tasdiqlagan talabaning qatnashuvi PRESENT holatidan o'zgartirilmaydi"
        }
        attendee.attendanceStatus = status
        attendee.checkedInAt = Instant.now()
        attendee.checkedInByUser = requireUser(actorId)
        val saved = attendeeRepository.save(attendee)
        auditService.logAction("LMS_ORIENTATION_ATTENDANCE_RECORDED", actorId, "session=$sessionId; student=$studentId; status=$status")
        return toAttendeeDto(saved)
    }

    @Transactional
    fun complete(sessionId: Long, actorId: Long): LmsOrientationSessionDto {
        val session = requireSession(sessionId)
        require(session.status == LmsOrientationSessionStatus.PUBLISHED) { "Faqat e'lon qilingan orientatsiya yakunlanadi" }
        val attendees = attendeeRepository.findAllBySessionIdAndDeletedFalseOrderByStudentLastNameAsc(sessionId)
        require(attendees.isNotEmpty()) { "Orientatsiyada talabalar yo'q" }
        require(attendees.none { it.attendanceStatus == LmsOrientationAttendanceStatus.INVITED }) {
            "Barcha talabalar davomati qayd etilishi kerak"
        }
        session.status = LmsOrientationSessionStatus.COMPLETED
        session.completedAt = Instant.now()
        session.completedByUser = requireUser(actorId)
        sessionRepository.save(session)
        auditService.logAction("LMS_ORIENTATION_COMPLETED", actorId, "session=$sessionId; attendees=${attendees.size}")
        return toSessionDto(session)
    }

    @Transactional
    fun cancel(sessionId: Long, actorId: Long): LmsOrientationSessionDto {
        val session = requireSession(sessionId)
        require(session.status in setOf(LmsOrientationSessionStatus.DRAFT, LmsOrientationSessionStatus.PUBLISHED)) {
            "Yakunlangan yoki bekor qilingan orientatsiya o'zgartirilmaydi"
        }
        require(attendeeRepository.findAllBySessionIdAndDeletedFalseOrderByStudentLastNameAsc(sessionId)
            .none { it.acknowledgementAt != null }) { "Talaba tasdiqlagan orientatsiyani bekor qilib bo'lmaydi" }
        session.status = LmsOrientationSessionStatus.CANCELLED
        session.cancelledAt = Instant.now()
        session.cancelledByUser = requireUser(actorId)
        sessionRepository.save(session)
        auditService.logAction("LMS_ORIENTATION_CANCELLED", actorId, "session=$sessionId")
        return toSessionDto(session)
    }

    @Transactional(readOnly = true)
    fun mine(userId: Long): StudentLmsOrientationDto {
        val student = studentRepository.findByUserId(userId)
            ?: throw NoSuchElementException("Talaba profili topilmadi")
        val sessions = attendeeRepository.findAllByStudentIdAndDeletedFalseOrderBySessionStartsAtDesc(requireNotNull(student.id))
            .filter { it.session.status != LmsOrientationSessionStatus.DRAFT && it.session.status != LmsOrientationSessionStatus.CANCELLED }
            .map(::toAttendeeDto)
        return StudentLmsOrientationDto(
            orientationRequired = student.lmsOrientationRequired,
            orientationCompletedAt = student.lmsOrientationCompletedAt,
            sessions = sessions,
        )
    }

    @Transactional
    fun acknowledge(sessionId: Long, userId: Long): StudentLmsOrientationDto {
        val student = studentRepository.findByUserId(userId)
            ?: throw NoSuchElementException("Talaba profili topilmadi")
        val attendee = attendeeRepository.findBySessionIdAndStudentIdAndDeletedFalse(sessionId, requireNotNull(student.id))
            ?: throw NoSuchElementException("Siz ushbu orientatsiyaga biriktirilmagansiz")
        require(attendee.session.status in setOf(LmsOrientationSessionStatus.PUBLISHED, LmsOrientationSessionStatus.COMPLETED)) {
            "Orientatsiya tasdiqlash uchun ochiq emas"
        }
        require(attendee.attendanceStatus == LmsOrientationAttendanceStatus.PRESENT) {
            "Yo'riqnomani faqat shaxsan qatnashuv xodim tomonidan tasdiqlangandan keyin qabul qilish mumkin"
        }
        if (attendee.acknowledgementAt == null) {
            val now = Instant.now()
            attendee.acknowledgementAt = now
            attendee.acknowledgementVersion = ACKNOWLEDGEMENT_VERSION
            attendeeRepository.save(attendee)
            student.lmsOrientationRequired = false
            student.lmsOrientationCompletedAt = now
            studentRepository.save(student)
            auditService.logAction("LMS_ORIENTATION_ACKNOWLEDGED", userId, "session=$sessionId; student=${student.id}; version=$ACKNOWLEDGEMENT_VERSION")
        }
        return mine(userId)
    }

    private fun requireSession(id: Long) = sessionRepository.findByIdAndDeletedFalse(id)
        ?: throw NoSuchElementException("LMS orientatsiyasi topilmadi: $id")

    private fun requireUser(id: Long) = userRepository.findById(id)
        .orElseThrow { NoSuchElementException("Foydalanuvchi topilmadi: $id") }

    private fun toSessionDto(session: LmsOrientationSession): LmsOrientationSessionDto {
        val attendees = session.id?.let(attendeeRepository::findAllBySessionIdAndDeletedFalseOrderByStudentLastNameAsc).orEmpty()
        return LmsOrientationSessionDto(
            id = requireNotNull(session.id), title = session.title, venue = session.venue,
            academicYear = session.academicYear, startsAt = session.startsAt, endsAt = session.endsAt,
            instructions = session.instructions, programId = session.programId, groupId = session.groupId,
            status = session.status.name, attendeeCount = attendees.size,
            presentCount = attendees.count { it.attendanceStatus == LmsOrientationAttendanceStatus.PRESENT },
            acknowledgedCount = attendees.count { it.acknowledgementAt != null },
            publishedAt = session.publishedAt, completedAt = session.completedAt, cancelledAt = session.cancelledAt,
        )
    }

    private fun toAttendeeDto(attendee: LmsOrientationAttendee) = LmsOrientationAttendeeDto(
        id = requireNotNull(attendee.id), sessionId = requireNotNull(attendee.session.id),
        sessionTitle = attendee.session.title, venue = attendee.session.venue,
        startsAt = attendee.session.startsAt, endsAt = attendee.session.endsAt,
        instructions = attendee.session.instructions, sessionStatus = attendee.session.status.name,
        studentId = requireNotNull(attendee.student.id), studentNumber = attendee.student.studentNumber,
        studentName = attendee.student.fullName, attendanceStatus = attendee.attendanceStatus.name,
        checkedInAt = attendee.checkedInAt, acknowledgementAt = attendee.acknowledgementAt,
    )
}
