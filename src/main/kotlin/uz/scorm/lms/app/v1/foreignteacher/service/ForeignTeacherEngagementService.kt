package uz.scorm.lms.app.v1.foreignteacher.service

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.audit.service.AuditService
import uz.scorm.lms.app.v1.courses.model.Course
import uz.scorm.lms.app.v1.courses.repository.CourseRepository
import uz.scorm.lms.app.v1.foreignteacher.dto.ForeignTeacherCourseDto
import uz.scorm.lms.app.v1.foreignteacher.dto.ForeignTeacherCourseOptionDto
import uz.scorm.lms.app.v1.foreignteacher.dto.ForeignTeacherEngagementDto
import uz.scorm.lms.app.v1.foreignteacher.dto.ForeignTeacherOptionDto
import uz.scorm.lms.app.v1.foreignteacher.dto.RejectForeignTeacherEngagementRequest
import uz.scorm.lms.app.v1.foreignteacher.dto.SaveForeignTeacherEngagementRequest
import uz.scorm.lms.app.v1.foreignteacher.dto.VerifyForeignTeacherEngagementRequest
import uz.scorm.lms.app.v1.foreignteacher.model.ForeignTeacherEngagement
import uz.scorm.lms.app.v1.foreignteacher.model.ForeignTeacherEngagementStatus
import uz.scorm.lms.app.v1.foreignteacher.repository.ForeignTeacherEngagementRepository
import uz.scorm.lms.app.v1.teacher.model.Teacher
import uz.scorm.lms.app.v1.teacher.repository.TeacherRepository
import uz.scorm.lms.app.v1.user.repository.UserRepository
import java.time.Instant
import java.time.LocalDate

@Service
class ForeignTeacherEngagementService(
    private val repository: ForeignTeacherEngagementRepository,
    private val teacherRepository: TeacherRepository,
    private val courseRepository: CourseRepository,
    private val userRepository: UserRepository,
    private val auditService: AuditService,
) {
    @Transactional(readOnly = true)
    fun list(): List<ForeignTeacherEngagementDto> =
        repository.findAllByDeletedFalseOrderByEngagementStartDateDesc().map(::toDto)

    @Transactional(readOnly = true)
    fun get(id: Long): ForeignTeacherEngagementDto = toDto(requireEngagement(id))

    @Transactional(readOnly = true)
    fun eligibleTeachers(): List<ForeignTeacherOptionDto> =
        teacherRepository.findAllByActiveTrueOrderByFullNameAsc().map {
            ForeignTeacherOptionDto(requireNotNull(it.id), it.fullName, it.academicDegree, it.position)
        }

    @Transactional(readOnly = true)
    fun eligibleCourses(): List<ForeignTeacherCourseOptionDto> =
        courseRepository.findAllByDeletedFalseOrderByCreatedAtDesc()
            .filter(::isDistanceCourse)
            .map {
                ForeignTeacherCourseOptionDto(
                    requireNotNull(it.id), it.title.orEmpty(), it.subject?.name.orEmpty(), it.subject?.program?.name.orEmpty(),
                )
            }

    @Transactional
    fun create(request: SaveForeignTeacherEngagementRequest, actorId: Long): ForeignTeacherEngagementDto {
        val teacher = requireTeacher(request.teacherId)
        val courses = requireCourses(request.courseIds, teacher, request.engagementStartDate, request.engagementEndDate)
        validate(request)
        val contractNumber = request.contractNumber.trim()
        require(!repository.existsByTeacherIdAndAcademicYearAndContractNumberAndDeletedFalseAndStatusNot(
            request.teacherId, request.academicYear, contractNumber, ForeignTeacherEngagementStatus.REJECTED,
        )) { "Pedagogning ushbu shartnoma bo'yicha engagement yozuvi allaqachon mavjud" }
        val saved = repository.save(ForeignTeacherEngagement(
            teacher = teacher,
            academicYear = request.academicYear,
            citizenshipCountryCode = request.citizenshipCountryCode.trim().uppercase(),
            citizenshipEvidenceReference = request.citizenshipEvidenceReference.trim(),
            qualificationReference = request.qualificationReference.trim(),
            contractNumber = contractNumber,
            contractDate = request.contractDate,
            engagementOrderNumber = request.engagementOrderNumber.trim(),
            engagementOrderDate = request.engagementOrderDate,
            engagementStartDate = request.engagementStartDate,
            engagementEndDate = request.engagementEndDate,
            remoteTeachingConfirmed = request.remoteTeachingConfirmed,
            evidenceReference = request.evidenceReference.trim(),
            courses = courses.toMutableSet(),
            createdByUser = requireUser(actorId),
        ))
        auditService.logAction(
            "FOREIGN_TEACHER_ENGAGEMENT_CREATED", actorId,
            "engagement=${saved.id}; teacher=${teacher.id}; country=${saved.citizenshipCountryCode}; courses=${courses.size}",
        )
        return toDto(saved)
    }

    @Transactional
    fun update(id: Long, request: SaveForeignTeacherEngagementRequest, actorId: Long): ForeignTeacherEngagementDto {
        val engagement = requireDraft(id)
        require(request.teacherId == engagement.teacher.id) { "Engagementga biriktirilgan pedagog o'zgartirilmaydi" }
        val courses = requireCourses(request.courseIds, engagement.teacher, request.engagementStartDate, request.engagementEndDate)
        validate(request)
        val contractNumber = request.contractNumber.trim()
        require(!repository.existsByTeacherIdAndAcademicYearAndContractNumberAndDeletedFalseAndStatusNotAndIdNot(
            request.teacherId, request.academicYear, contractNumber, ForeignTeacherEngagementStatus.REJECTED, id,
        )) { "Pedagogning ushbu shartnoma bo'yicha engagement yozuvi allaqachon mavjud" }
        engagement.academicYear = request.academicYear
        engagement.citizenshipCountryCode = request.citizenshipCountryCode.trim().uppercase()
        engagement.citizenshipEvidenceReference = request.citizenshipEvidenceReference.trim()
        engagement.qualificationReference = request.qualificationReference.trim()
        engagement.contractNumber = contractNumber
        engagement.contractDate = request.contractDate
        engagement.engagementOrderNumber = request.engagementOrderNumber.trim()
        engagement.engagementOrderDate = request.engagementOrderDate
        engagement.engagementStartDate = request.engagementStartDate
        engagement.engagementEndDate = request.engagementEndDate
        engagement.remoteTeachingConfirmed = request.remoteTeachingConfirmed
        engagement.evidenceReference = request.evidenceReference.trim()
        engagement.courses.clear()
        engagement.courses.addAll(courses)
        repository.save(engagement)
        auditService.logAction("FOREIGN_TEACHER_ENGAGEMENT_UPDATED", actorId, "engagement=$id; courses=${courses.size}")
        return toDto(engagement)
    }

    @Transactional
    fun verify(id: Long, request: VerifyForeignTeacherEngagementRequest, actorId: Long): ForeignTeacherEngagementDto {
        val engagement = requireDraft(id)
        require(engagement.createdByUser.id != actorId) { "Engagement dalilini kiritgan foydalanuvchi uni o'zi tekshira olmaydi" }
        require(engagement.remoteTeachingConfirmed) { "25-band dalili uchun masofadan dars o'tish tasdiqlanishi shart" }
        validate(toRequest(engagement))
        requireCourses(engagement.courses.mapNotNull { it.id }.toSet(), engagement.teacher, engagement.engagementStartDate, engagement.engagementEndDate)
        require(request.verificationNote.trim().length in 10..2000) { "Tekshiruv izohi 10..2000 belgidan iborat bo'lishi kerak" }
        engagement.status = ForeignTeacherEngagementStatus.VERIFIED
        engagement.verifiedAt = Instant.now()
        engagement.verifiedByUser = requireUser(actorId)
        engagement.verificationNote = request.verificationNote.trim()
        repository.save(engagement)
        auditService.logAction("FOREIGN_TEACHER_ENGAGEMENT_VERIFIED", actorId, "engagement=$id; teacher=${engagement.teacher.id}; courses=${engagement.courses.size}")
        return toDto(engagement)
    }

    @Transactional
    fun reject(id: Long, request: RejectForeignTeacherEngagementRequest, actorId: Long): ForeignTeacherEngagementDto {
        val engagement = requireDraft(id)
        require(engagement.createdByUser.id != actorId) { "Engagement dalilini kiritgan foydalanuvchi uni o'zi rad eta olmaydi" }
        require(request.reason.trim().length in 10..2000) { "Rad etish sababi 10..2000 belgidan iborat bo'lishi kerak" }
        engagement.status = ForeignTeacherEngagementStatus.REJECTED
        engagement.rejectedAt = Instant.now()
        engagement.rejectedByUser = requireUser(actorId)
        engagement.rejectionReason = request.reason.trim()
        repository.save(engagement)
        auditService.logAction("FOREIGN_TEACHER_ENGAGEMENT_REJECTED", actorId, "engagement=$id; reason=${engagement.rejectionReason?.take(120)}")
        return toDto(engagement)
    }

    private fun validate(request: SaveForeignTeacherEngagementRequest) {
        require(request.academicYear.matches(Regex("\\d{4}-\\d{4}"))) { "O'quv yili YYYY-YYYY formatida bo'lishi kerak" }
        val (first, second) = request.academicYear.split("-").map(String::toInt)
        require(second == first + 1) { "O'quv yili ketma-ket ikki yildan iborat bo'lishi kerak" }
        val country = request.citizenshipCountryCode.trim().uppercase()
        require(country.matches(Regex("[A-Z]{2}")) && country != "UZ") { "Xorijiy pedagog uchun UZdan boshqa ISO alpha-2 davlat kodi kerak" }
        require(!request.engagementEndDate.isBefore(request.engagementStartDate)) { "Engagement tugash sanasi boshlanish sanasidan oldin bo'lmasligi kerak" }
        val from = LocalDate.of(first, 9, 1)
        val to = LocalDate.of(second, 8, 31)
        require(!request.engagementStartDate.isBefore(from) && !request.engagementEndDate.isAfter(to)) { "Engagement davri o'quv yili doirasida bo'lishi kerak" }
        require(!request.contractDate.isAfter(LocalDate.now())) { "Shartnoma sanasi kelajakda bo'lmasligi kerak" }
        require(!request.engagementOrderDate.isAfter(LocalDate.now())) { "Jalb qilish buyrug'i sanasi kelajakda bo'lmasligi kerak" }
        require(!request.contractDate.isAfter(request.engagementStartDate)) { "Shartnoma engagement boshlanishidan kech bo'lmasligi kerak" }
        require(!request.engagementOrderDate.isAfter(request.engagementStartDate)) { "Buyruq engagement boshlanishidan kech bo'lmasligi kerak" }
        text(request.citizenshipEvidenceReference, "Fuqarolik dalili", 1000)
        text(request.qualificationReference, "Malaka dalili", 1000)
        text(request.contractNumber, "Shartnoma raqami", 200)
        text(request.engagementOrderNumber, "Jalb qilish buyrug'i raqami", 200)
        text(request.evidenceReference, "Engagement dalili", 1000)
        require(request.courseIds.isNotEmpty() && request.courseIds.size <= 100) { "Kamida bitta va ko'pi bilan 100 ta masofaviy kurs tanlanishi kerak" }
    }

    private fun requireTeacher(id: Long): Teacher = teacherRepository.findById(id)
        .orElseThrow { NoSuchElementException("Pedagog topilmadi: $id") }
        .also { require(it.active && !it.deleted) { "Faqat faol pedagog jalb qilinadi" } }

    private fun requireCourses(ids: Set<Long>, teacher: Teacher, start: LocalDate, end: LocalDate): List<Course> {
        require(ids.isNotEmpty() && ids.size <= 100) { "Kamida bitta va ko'pi bilan 100 ta masofaviy kurs tanlanishi kerak" }
        val courses = courseRepository.findAllById(ids).filter { !it.deleted }
        require(courses.size == ids.size) { "Tanlangan kurslardan biri topilmadi" }
        val teacherSubjectIds = teacher.subjects.mapNotNull { it.id }.toSet()
        courses.forEach { course ->
            require(isDistanceCourse(course)) { "Faqat faol masofaviy dasturga tegishli kurs tanlanadi" }
            require(course.subject?.id in teacherSubjectIds) { "Kurs fani pedagogning fanlar ro'yxatiga biriktirilmagan" }
            require(course.endDate == null || !course.endDate!!.isBefore(start)) { "Kurs engagement davridan oldin tugagan" }
            require(course.startDate == null || !course.startDate!!.isAfter(end)) { "Kurs engagement davridan keyin boshlanadi" }
        }
        return courses
    }

    private fun isDistanceCourse(course: Course): Boolean {
        val subject = course.subject ?: return false
        val program = subject.program ?: return false
        return !course.deleted && !subject.deleted && subject.active && !program.deleted && program.active && program.distanceEnabled && !course.title.isNullOrBlank()
    }

    private fun text(value: String, label: String, max: Int) {
        require(value.trim().isNotEmpty() && value.trim().length <= max) { "$label majburiy va $max belgidan oshmasligi kerak" }
    }

    private fun requireEngagement(id: Long) = repository.findByIdAndDeletedFalse(id)
        ?: throw NoSuchElementException("Xorijiy pedagog engagement dalili topilmadi: $id")
    private fun requireDraft(id: Long) = requireEngagement(id).also {
        require(it.status == ForeignTeacherEngagementStatus.DRAFT) { "Faqat DRAFT engagement o'zgartiriladi" }
    }
    private fun requireUser(id: Long) = userRepository.findById(id).orElseThrow { NoSuchElementException("Foydalanuvchi topilmadi: $id") }

    private fun toRequest(e: ForeignTeacherEngagement) = SaveForeignTeacherEngagementRequest(
        requireNotNull(e.teacher.id), e.academicYear, e.citizenshipCountryCode, e.citizenshipEvidenceReference,
        e.qualificationReference, e.contractNumber, e.contractDate, e.engagementOrderNumber, e.engagementOrderDate,
        e.engagementStartDate, e.engagementEndDate, e.remoteTeachingConfirmed, e.evidenceReference,
        e.courses.mapNotNull { it.id }.toSet(),
    )

    private fun toDto(e: ForeignTeacherEngagement) = ForeignTeacherEngagementDto(
        requireNotNull(e.id), requireNotNull(e.teacher.id), e.teacher.fullName, e.academicYear,
        e.citizenshipCountryCode, e.citizenshipEvidenceReference, e.qualificationReference,
        e.contractNumber, e.contractDate, e.engagementOrderNumber, e.engagementOrderDate,
        e.engagementStartDate, e.engagementEndDate, e.remoteTeachingConfirmed, e.evidenceReference,
        e.courses.sortedBy { it.id }.map {
            ForeignTeacherCourseDto(requireNotNull(it.id), it.title.orEmpty(), it.subject?.name.orEmpty(), it.subject?.program?.name.orEmpty())
        },
        e.status.name, e.createdByUser.fullName ?: e.createdByUser.username, e.verifiedAt,
        e.verifiedByUser?.fullName ?: e.verifiedByUser?.username, e.verificationNote, e.rejectedAt,
        e.rejectedByUser?.fullName ?: e.rejectedByUser?.username, e.rejectionReason,
    )
}
