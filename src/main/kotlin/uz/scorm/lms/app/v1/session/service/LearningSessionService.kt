package uz.scorm.lms.app.v1.session.service

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.attendance.model.LearningActivitySource
import uz.scorm.lms.app.v1.attendance.model.LearningActivityType
import uz.scorm.lms.app.v1.attendance.service.LearningActivityService
import uz.scorm.lms.app.v1.courses.model.CourseEnrollmentStatus
import uz.scorm.lms.app.v1.courses.model.CourseStatus
import uz.scorm.lms.app.v1.courses.repository.CourseEnrollmentRepository
import uz.scorm.lms.app.v1.courses.service.CourseAccessService
import uz.scorm.lms.app.v1.session.dto.LearningSessionAccessResponse
import uz.scorm.lms.app.v1.session.dto.LearningSessionRequest
import uz.scorm.lms.app.v1.session.dto.StudentLearningSessionDto
import uz.scorm.lms.app.v1.session.dto.TeacherLearningSessionDto
import uz.scorm.lms.app.v1.session.model.CourseLearningSession
import uz.scorm.lms.app.v1.session.model.LearningSessionAccess
import uz.scorm.lms.app.v1.session.model.LearningSessionAccessType
import uz.scorm.lms.app.v1.session.model.LearningSessionFormat
import uz.scorm.lms.app.v1.session.model.LearningSessionStatus
import uz.scorm.lms.app.v1.session.repository.CourseLearningSessionRepository
import uz.scorm.lms.app.v1.session.repository.LearningSessionAccessRepository
import uz.scorm.lms.app.v1.student.repository.StudentRepository
import uz.scorm.lms.app.v1.user.repository.UserRepository
import uz.scorm.lms.app.v1.videoconference.model.VideoConferenceMeetingStatus
import uz.scorm.lms.app.v1.videoconference.repository.VideoConferenceMeetingRepository
import uz.scorm.lms.app.v1.videoconference.service.VideoConferenceService
import java.net.URI
import java.time.Duration
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.time.format.DateTimeFormatter

@Service
class LearningSessionService(
    private val sessionRepository: CourseLearningSessionRepository,
    private val accessRepository: LearningSessionAccessRepository,
    private val enrollmentRepository: CourseEnrollmentRepository,
    private val studentRepository: StudentRepository,
    private val userRepository: UserRepository,
    private val courseAccessService: CourseAccessService,
    private val learningActivityService: LearningActivityService,
    private val meetingRepository: VideoConferenceMeetingRepository,
    private val videoConferenceService: VideoConferenceService,
) {
    private val enrolledStatuses = setOf(CourseEnrollmentStatus.ACTIVE, CourseEnrollmentStatus.COMPLETED)
    private val visibleStatuses = setOf(LearningSessionStatus.PUBLISHED, LearningSessionStatus.COMPLETED)
    private val timeFormatter = DateTimeFormatter.ofPattern("HH:mm")

    @Transactional
    fun create(request: LearningSessionRequest, userId: Long, mayManageAll: Boolean): TeacherLearningSessionDto {
        val course = courseAccessService.requireManage(request.courseId, userId, mayManageAll)
        require(course.status != CourseStatus.ARCHIVED.name) { "Arxivlangan kurs uchun mashg'ulot yaratilmaydi" }
        validate(request, requireDelivery = request.status == LearningSessionStatus.PUBLISHED)
        require(request.status in setOf(LearningSessionStatus.DRAFT, LearningSessionStatus.PUBLISHED)) {
            "Yangi mashg'ulot faqat draft yoki published holatida yaratiladi"
        }
        val now = Instant.now()
        val session = sessionRepository.save(CourseLearningSession(
            course = course,
            title = request.title.trim(),
            description = request.description.trim(),
            format = request.format,
            sessionType = request.sessionType,
            startsAt = request.startsAt,
            endsAt = request.endsAt,
            room = clean(request.room),
            building = clean(request.building),
            liveUrl = clean(request.liveUrl),
            recordingUrl = clean(request.recordingUrl),
            resourceUrl = clean(request.resourceUrl),
            status = request.status,
            publishedAt = if (request.status == LearningSessionStatus.PUBLISHED) now else null,
        ))
        return teacherDto(session)
    }

    @Transactional
    fun update(
        sessionId: Long,
        request: LearningSessionRequest,
        userId: Long,
        mayManageAll: Boolean,
    ): TeacherLearningSessionDto {
        val session = managed(sessionId, userId, mayManageAll)
        require(session.status !in setOf(LearningSessionStatus.CANCELLED, LearningSessionStatus.COMPLETED)) {
            "Yakunlangan yoki bekor qilingan mashg'ulot tahrirlanmaydi"
        }
        require(session.status == LearningSessionStatus.DRAFT || session.startsAt.isAfter(Instant.now())) {
            "Boshlangan published mashg'ulot tahrirlanmaydi"
        }
        require(request.courseId == session.course.id) { "Mashg'ulot kursini almashtirish mumkin emas" }
        require(meetingRepository.findBySessionIdAndDeletedFalse(sessionId)?.status != VideoConferenceMeetingStatus.READY) {
            "READY provider meetingi bor mashg'ulot tahrirlanmaydi"
        }
        validate(request, requireDelivery = session.status == LearningSessionStatus.PUBLISHED)
        session.title = request.title.trim()
        session.description = request.description.trim()
        session.format = request.format
        session.sessionType = request.sessionType
        session.startsAt = request.startsAt
        session.endsAt = request.endsAt
        session.room = clean(request.room)
        session.building = clean(request.building)
        session.liveUrl = clean(request.liveUrl)
        session.recordingUrl = clean(request.recordingUrl)
        session.resourceUrl = clean(request.resourceUrl)
        return teacherDto(sessionRepository.save(session))
    }

    @Transactional
    fun changeStatus(
        sessionId: Long,
        status: LearningSessionStatus,
        userId: Long,
        mayManageAll: Boolean,
    ): TeacherLearningSessionDto {
        val session = managed(sessionId, userId, mayManageAll)
        val allowed = when (session.status) {
            LearningSessionStatus.DRAFT -> setOf(LearningSessionStatus.PUBLISHED, LearningSessionStatus.CANCELLED)
            LearningSessionStatus.PUBLISHED -> setOf(LearningSessionStatus.COMPLETED, LearningSessionStatus.CANCELLED)
            LearningSessionStatus.CANCELLED, LearningSessionStatus.COMPLETED -> emptySet()
        }
        require(status in allowed) { "${session.status} holatidan $status holatiga o'tib bo'lmaydi" }
        if (status == LearningSessionStatus.PUBLISHED) {
            validate(entityRequest(session), requireDelivery = false)
            require(hasSynchronousDelivery(session) || session.format == LearningSessionFormat.ASYNCHRONOUS && hasAsynchronousDelivery(session)) {
                "Mashg'ulotni nashr qilish uchun READY provider meetingi, jonli havola/xona yoki asinxron resurs kerak"
            }
            session.publishedAt = Instant.now()
        }
        if (status == LearningSessionStatus.CANCELLED) videoConferenceService.cancelIfReady(session, userId)
        session.status = status
        return teacherDto(sessionRepository.save(session))
    }

    @Transactional
    fun delete(sessionId: Long, userId: Long, mayManageAll: Boolean) {
        val session = managed(sessionId, userId, mayManageAll)
        require(session.status == LearningSessionStatus.DRAFT) { "Faqat draft mashg'ulot o'chiriladi" }
        require(accessRepository.countBySessionIdAndDeletedFalse(sessionId) == 0L) {
            "Kirish auditi mavjud mashg'ulot o'chirilmaydi"
        }
        videoConferenceService.cancelIfReady(session, userId)
        session.deleted = true
        sessionRepository.save(session)
    }

    @Transactional(readOnly = true)
    fun teacherSessions(userId: Long, mayManageAll: Boolean, courseId: Long? = null): List<TeacherLearningSessionDto> {
        val sessions = if (mayManageAll) sessionRepository.findAllByDeletedFalseOrderByStartsAtDesc()
        else sessionRepository.findAllByCourseUserIdAndDeletedFalseOrderByStartsAtDesc(userId)
        return sessions.filter { courseId == null || it.course.id == courseId }.map(::teacherDto)
    }

    @Transactional(readOnly = true)
    fun studentSessions(
        userId: Long,
        startDate: LocalDate? = null,
        endDate: LocalDate? = null,
        courseId: Long? = null,
        dayOfWeek: Int? = null,
    ): List<StudentLearningSessionDto> {
        val student = studentRepository.findByUserId(userId)
            ?: throw NoSuchElementException("Talaba profili topilmadi")
        val enrollments = enrollmentRepository.findAllByStudentIdAndStatusInAndDeletedFalseOrderByEnrolledAtDesc(
            requireNotNull(student.id), enrolledStatuses,
        ).filter { courseId == null || it.course.id == courseId }
        if (enrollments.isEmpty()) return emptyList()
        val enrollmentByCourse = enrollments.associateBy { requireNotNull(it.course.id) }
        val zone = ZoneId.systemDefault()
        val from = startDate?.atStartOfDay(zone)?.toInstant()
        val to = endDate?.plusDays(1)?.atStartOfDay(zone)?.toInstant()
        return sessionRepository.findAllByCourseIdInAndStatusInAndDeletedFalseOrderByStartsAtAsc(
            enrollmentByCourse.keys, visibleStatuses,
        ).asSequence()
            .filter { from == null || !it.startsAt.isBefore(from) }
            .filter { to == null || it.startsAt.isBefore(to) }
            .filter { dayOfWeek == null || it.startsAt.atZone(zone).dayOfWeek.value % 7 == dayOfWeek }
            .map { session ->
                val enrollment = requireNotNull(enrollmentByCourse[session.course.id])
                studentDto(session, requireNotNull(enrollment.id))
            }
            .toList()
    }

    @Transactional
    fun access(
        sessionId: Long,
        userId: Long,
        type: LearningSessionAccessType,
    ): LearningSessionAccessResponse {
        val session = sessionRepository.findByIdAndDeletedFalse(sessionId)
            ?: throw NoSuchElementException("Mashg'ulot topilmadi: $sessionId")
        require(session.status in visibleStatuses) { "Mashg'ulot studentlar uchun nashr qilinmagan" }
        val enrollment = enrollmentRepository.findByCourseIdAndStudentUserIdAndStatusInAndDeletedFalse(
            requireNotNull(session.course.id), userId, enrolledStatuses,
        ) ?: throw IllegalArgumentException("Mashg'ulotga kirish uchun faol biriktirish talab qilinadi")
        val now = Instant.now()
        val url = when (type) {
            LearningSessionAccessType.LIVE_JOIN -> {
                require(session.format == LearningSessionFormat.SYNCHRONOUS) { "Bu sinxron mashg'ulot emas" }
                require(canJoin(session, now)) { "Jonli mashg'ulotga kirish oynasi yopiq" }
                effectiveLiveUrl(session) ?: throw IllegalArgumentException("READY provider meetingi yoki jonli dars havolasi mavjud emas")
            }
            LearningSessionAccessType.RECORDING_OPEN -> {
                require(canOpenResources(session, now)) { "Yozuv hali ochilmagan" }
                session.recordingUrl ?: throw IllegalArgumentException("Mashg'ulot yozuvi mavjud emas")
            }
            LearningSessionAccessType.RESOURCE_OPEN -> {
                require(canOpenResources(session, now)) { "Resurs hali ochilmagan" }
                session.resourceUrl ?: throw IllegalArgumentException("Mashg'ulot resursi mavjud emas")
            }
        }
        accessRepository.save(LearningSessionAccess(
            session = session,
            enrollment = enrollment,
            accessType = type,
            occurredAt = now,
            durationSeconds = 0,
        ))
        learningActivityService.recordIfEnrolled(
            courseId = requireNotNull(session.course.id),
            userId = userId,
            eventType = when (type) {
                LearningSessionAccessType.LIVE_JOIN -> LearningActivityType.LIVE_SESSION_JOINED
                LearningSessionAccessType.RECORDING_OPEN -> LearningActivityType.SESSION_RECORDING_OPENED
                LearningSessionAccessType.RESOURCE_OPEN -> LearningActivityType.SESSION_RESOURCE_OPENED
            },
            sourceType = LearningActivitySource.LEARNING_SESSION,
            sourceId = sessionId,
            occurredAt = now,
        )
        return LearningSessionAccessResponse(url, type.name.lowercase(), now)
    }

    private fun managed(sessionId: Long, userId: Long, mayManageAll: Boolean): CourseLearningSession {
        val session = sessionRepository.findByIdAndDeletedFalse(sessionId)
            ?: throw NoSuchElementException("Mashg'ulot topilmadi: $sessionId")
        courseAccessService.requireManage(requireNotNull(session.course.id), userId, mayManageAll)
        return session
    }

    private fun validate(request: LearningSessionRequest, requireDelivery: Boolean) {
        require(request.title.isNotBlank()) { "Mashg'ulot nomi majburiy" }
        require(request.title.length <= 255) { "Mashg'ulot nomi 255 belgidan oshmasligi kerak" }
        require(request.startsAt.isBefore(request.endsAt)) { "Boshlanish vaqti tugashidan oldin bo'lishi kerak" }
        require(Duration.between(request.startsAt, request.endsAt) <= Duration.ofDays(180)) {
            "Mashg'ulot yoki resurs oynasi 180 kundan oshmasligi kerak"
        }
        listOf(request.liveUrl, request.recordingUrl, request.resourceUrl).filterNotNull()
            .filter { it.isNotBlank() }.forEach(::requireSafeUrl)
        if (requireDelivery && request.format == LearningSessionFormat.SYNCHRONOUS) {
            require(!request.liveUrl.isNullOrBlank() || !request.room.isNullOrBlank()) {
                "Sinxron mashg'ulot uchun jonli havola yoki xona majburiy"
            }
        } else if (requireDelivery) {
            require(!request.recordingUrl.isNullOrBlank() || !request.resourceUrl.isNullOrBlank()) {
                "Asinxron mashg'ulot uchun yozuv yoki resurs havolasi majburiy"
            }
        }
    }

    private fun requireSafeUrl(value: String) {
        val uri = runCatching { URI(value.trim()) }.getOrNull()
        require(uri != null && uri.scheme?.lowercase() in setOf("http", "https") && !uri.host.isNullOrBlank()) {
            "Faqat to'liq HTTP/HTTPS havolaga ruxsat beriladi"
        }
    }

    private fun teacherDto(session: CourseLearningSession): TeacherLearningSessionDto = TeacherLearningSessionDto(
        id = requireNotNull(session.id).toString(),
        courseId = requireNotNull(session.course.id).toString(),
        courseTitle = session.course.title.orEmpty(),
        title = session.title,
        description = session.description,
        format = session.format.name.lowercase(),
        sessionType = session.sessionType.name.lowercase(),
        startsAt = session.startsAt,
        endsAt = session.endsAt,
        room = session.room,
        building = session.building,
        liveUrl = session.liveUrl,
        recordingUrl = session.recordingUrl,
        resourceUrl = session.resourceUrl,
        status = session.status.name.lowercase(),
        accessCount = accessRepository.countBySessionIdAndDeletedFalse(requireNotNull(session.id)),
        videoConference = videoConferenceService.meetingForSession(requireNotNull(session.id)),
    )

    private fun studentDto(session: CourseLearningSession, enrollmentId: Long): StudentLearningSessionDto {
        val now = Instant.now()
        val local = session.startsAt.atZone(ZoneId.systemDefault())
        val owner = session.course.userId?.let { userRepository.findById(it).orElse(null) }
        val liveUrl = effectiveLiveUrl(session)
        val resourcesOpen = canOpenResources(session, now) &&
            (!session.recordingUrl.isNullOrBlank() || !session.resourceUrl.isNullOrBlank())
        return StudentLearningSessionDto(
            id = requireNotNull(session.id).toString(),
            courseId = requireNotNull(session.course.id).toString(),
            courseName = session.course.title.orEmpty(),
            instructor = owner?.fullName?.takeIf(String::isNotBlank) ?: owner?.username ?: "O'qituvchi",
            title = session.title,
            description = session.description,
            room = session.room.orEmpty(),
            building = session.building,
            date = local.toLocalDate().toString(),
            startsAt = session.startsAt,
            endsAt = session.endsAt,
            dayOfWeek = local.dayOfWeek.value % 7,
            startTime = local.toLocalTime().format(timeFormatter),
            endTime = session.endsAt.atZone(ZoneId.systemDefault()).toLocalTime().format(timeFormatter),
            type = session.sessionType.name.lowercase(),
            format = session.format.name.lowercase(),
            status = session.status.name.lowercase(),
            isOnline = !liveUrl.isNullOrBlank() || !session.recordingUrl.isNullOrBlank() || !session.resourceUrl.isNullOrBlank(),
            meetingLink = null,
            recordingUrl = null,
            resourceUrl = null,
            hasRecording = resourcesOpen && !session.recordingUrl.isNullOrBlank(),
            hasResource = resourcesOpen && !session.resourceUrl.isNullOrBlank(),
            canJoin = liveUrl != null && canJoin(session, now),
            canOpenResources = resourcesOpen,
            accessed = accessRepository.existsBySessionIdAndEnrollmentIdAndDeletedFalse(requireNotNull(session.id), enrollmentId),
        )
    }

    private fun canJoin(session: CourseLearningSession, now: Instant): Boolean =
        session.status == LearningSessionStatus.PUBLISHED &&
            !now.isBefore(session.startsAt.minus(Duration.ofMinutes(15))) &&
            !now.isAfter(session.endsAt.plus(Duration.ofMinutes(30)))

    private fun canOpenResources(session: CourseLearningSession, now: Instant): Boolean =
        session.status in visibleStatuses && !now.isBefore(session.startsAt)

    private fun effectiveLiveUrl(session: CourseLearningSession): String? =
        videoConferenceService.readyJoinUrl(requireNotNull(session.id)) ?: session.liveUrl

    private fun hasSynchronousDelivery(session: CourseLearningSession) =
        !session.room.isNullOrBlank() || effectiveLiveUrl(session) != null

    private fun hasAsynchronousDelivery(session: CourseLearningSession) =
        !session.recordingUrl.isNullOrBlank() || !session.resourceUrl.isNullOrBlank()

    private fun clean(value: String?): String? = value?.trim()?.takeIf(String::isNotBlank)

    private fun entityRequest(session: CourseLearningSession) = LearningSessionRequest(
        courseId = requireNotNull(session.course.id),
        title = session.title,
        description = session.description,
        format = session.format,
        sessionType = session.sessionType,
        startsAt = session.startsAt,
        endsAt = session.endsAt,
        room = session.room,
        building = session.building,
        liveUrl = session.liveUrl,
        recordingUrl = session.recordingUrl,
        resourceUrl = session.resourceUrl,
        status = session.status,
    )
}
