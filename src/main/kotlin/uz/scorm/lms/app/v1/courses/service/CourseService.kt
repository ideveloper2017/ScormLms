package uz.scorm.lms.app.v1.courses.service

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.courses.dto.CourseCreateRequest
import uz.scorm.lms.app.v1.courses.dto.CourseDto
import uz.scorm.lms.app.v1.courses.dto.CourseUpdateRequest
import uz.scorm.lms.app.v1.courses.model.Course
import uz.scorm.lms.app.v1.courses.model.CourseEnrollmentStatus
import uz.scorm.lms.app.v1.courses.model.CourseExpiryPeriodType
import uz.scorm.lms.app.v1.courses.model.CourseStatus
import uz.scorm.lms.app.v1.courses.repository.CourseEnrollmentRepository
import uz.scorm.lms.app.v1.courses.repository.CourseRepository
import uz.scorm.lms.app.v1.subject.repository.SubjectRepository
import uz.scorm.lms.app.v1.subjectgroup.service.AcademicSubjectGroupService
import uz.scorm.lms.app.v1.teacher.repository.TeacherRepository
import java.time.Instant

@Service
class CourseService(
    private val courseRepository: CourseRepository,
    private val enrollmentRepository: CourseEnrollmentRepository,
    private val accessService: CourseAccessService,
    private val subjectRepository: SubjectRepository,
    private val compatibilityService: ContentCompatibilityService,
    private val subjectGroupService: AcademicSubjectGroupService,
    private val teacherRepository: TeacherRepository,
) {
    @Transactional(readOnly = true)
    fun owned(userId: Long, mayManageAll: Boolean): List<CourseDto> =
        (if (mayManageAll) courseRepository.findAllByDeletedFalseOrderByCreatedAtDesc()
        else courseRepository.findAllByUserIdAndDeletedFalseOrderByCreatedAtDesc(userId)).map(::toDto)

    @Transactional(readOnly = true)
    fun get(courseId: Long, userId: Long, mayManageAll: Boolean): CourseDto =
        toDto(accessService.requireRead(courseId, userId, mayManageAll))

    @Transactional
    fun create(request: CourseCreateRequest, ownerUserId: Long, enforceTeachingScope: Boolean = false): CourseDto {
        validate(request.title, request.startDate, request.endDate)
        val teacher = teacherRepository.findByUserId(ownerUserId)
        require(!enforceTeachingScope || teacher != null) {
            "O'qituvchi LMS profili va fan vakolati sozlanmagan"
        }
        require(teacher?.active != false) { "Nofaol o'qituvchi kurs yarata olmaydi" }
        val subjectGroup = request.subjectGroupId?.let { groupId ->
            if (enforceTeachingScope) subjectGroupService.requireTeachingAssignment(groupId, ownerUserId)
            else subjectGroupService.requireOperationalGroup(groupId)
        }
        val curriculumItem = subjectGroup?.curriculumSubject
        val subject = curriculumItem?.subject ?: request.subjectId?.let(::subject)
        if (subjectGroup != null && request.subjectId != null) {
            require(request.subjectId == subject?.id) { "Tanlangan fan fan guruhidagi curriculum faniga mos emas" }
        }
        if (enforceTeachingScope && subjectGroup == null) {
            val subjectId = requireNotNull(subject?.id) {
                "Kurs uchun sizga biriktirilgan fan yoki faol fan guruhini tanlang"
            }
            require(teacher!!.subjects.any { it.id == subjectId && it.active && !it.deleted }) {
                "O'qituvchiga ushbu fan biriktirilmagan"
            }
        }
        val curriculum = curriculumItem?.curriculumVersion
        val shortDescription = request.shortDescription.clean() ?: request.description.clean()
        val course = Course(
            title = request.title.trim(),
            slug = slug(request.title),
            shortDescription = shortDescription,
            description = request.description.clean(),
            userId = ownerUserId,
            categoryId = subject?.subjectCategory?.id,
            status = CourseStatus.DRAFT.name,
            subjectName = curriculumItem?.subjectNameSnapshot ?: subject?.name ?: request.subjectName?.trim(),
            subject = subject,
            groupName = subjectGroup?.code ?: request.groupName?.trim(),
            subjectGroup = subjectGroup,
            startDate = request.startDate,
            endDate = request.endDate,
            language = curriculum?.program?.educationLanguage ?: request.language?.trim()?.lowercase(),
            level = request.level?.trim(),
            isPaid = if (request.paid) 1 else 0,
            price = request.price,
            discountFlag = if (request.discountEnabled) 1 else 0,
            discountedPrice = request.discountedPrice,
            expiryPeriodType = request.expiryPeriodType.name,
            dripContent = request.dripContent,
            requirements = request.requirements.clean(),
            outcomes = request.outcomes.clean(),
            faqs = request.faqs.clean(),
            metaKeywords = request.metaKeywords.clean(),
            metaDescription = request.metaDescription.clean(),
        )
        validateMetadata(course)
        return toDto(courseRepository.save(course))
    }

    @Transactional
    fun update(courseId: Long, request: CourseUpdateRequest, userId: Long, mayManageAll: Boolean): CourseDto {
        val course = accessService.requireManage(courseId, userId, mayManageAll)
        require(course.status != CourseStatus.ARCHIVED.name) { "Arxivlangan kursni avval qoralamaga qaytaring" }
        val title = request.title?.trim()?.also { require(it.isNotBlank()) { "Kurs nomi bo'sh bo'lmaydi" } }
        val start = request.startDate ?: course.startDate
        val end = request.endDate ?: course.endDate
        validate(title ?: course.title.orEmpty(), start, end)
        title?.let { course.title = it; course.slug = slug(it) }
        request.shortDescription?.let { course.shortDescription = it.clean() }
        request.description?.let { course.description = it.clean() }
        request.subjectId?.let {
            require(course.subjectGroup == null) { "Curriculumga bog'langan kurs fanini almashtirib bo'lmaydi" }
            val subject = subject(it)
            course.subject = subject
            course.subjectName = subject.name
        }
        if (request.subjectId == null) request.subjectName?.let {
            require(course.subjectGroup == null) { "Curriculumga bog'langan kurs fan nomini almashtirib bo'lmaydi" }
            course.subjectName = it.trim()
        }
        request.groupName?.let {
            require(course.subjectGroup == null) { "Curriculumga bog'langan kurs guruhini almashtirib bo'lmaydi" }
            course.groupName = it.trim()
        }
        request.startDate?.let { course.startDate = it }
        request.endDate?.let { course.endDate = it }
        request.language?.let {
            val curriculumLanguage = course.subjectGroup?.curriculumSubject?.curriculumVersion?.program?.educationLanguage
            require(curriculumLanguage == null || it.equals(curriculumLanguage, ignoreCase = true)) {
                "Kurs tili curriculum dasturi tiliga mos bo'lishi kerak"
            }
            course.language = it.trim().lowercase()
        }
        request.level?.let { course.level = it.trim() }
        val paid = request.paid ?: (course.isPaid == 1)
        val discountEnabled = request.discountEnabled ?: (course.discountFlag == 1)
        course.isPaid = if (paid) 1 else 0
        course.price = if (paid) request.price ?: course.price else null
        course.discountFlag = if (paid && discountEnabled) 1 else 0
        course.discountedPrice = if (paid && discountEnabled) request.discountedPrice ?: course.discountedPrice else null
        request.expiryPeriodType?.let { course.expiryPeriodType = it.name }
        request.dripContent?.let { course.dripContent = it }
        request.requirements?.let { course.requirements = it.clean() }
        request.outcomes?.let { course.outcomes = it.clean() }
        request.faqs?.let { course.faqs = it.clean() }
        request.metaKeywords?.let { course.metaKeywords = it.clean() }
        request.metaDescription?.let { course.metaDescription = it.clean() }
        course.categoryId = course.subject?.subjectCategory?.id
        validateMetadata(course)
        compatibilityService.requirePublishedContentsCompatible(course)
        return toDto(courseRepository.save(course))
    }

    @Transactional
    fun changeStatus(courseId: Long, target: CourseStatus, userId: Long, mayManageAll: Boolean): CourseDto {
        val course = accessService.requireManage(courseId, userId, mayManageAll)
        when (target) {
            CourseStatus.PUBLISHED -> {
                validate(course.title.orEmpty(), course.startDate, course.endDate)
                validateOperationalBinding(course)
                course.publishedAt = course.publishedAt ?: Instant.now()
                course.archivedAt = null
            }
            CourseStatus.ARCHIVED -> course.archivedAt = Instant.now()
            CourseStatus.DRAFT -> course.archivedAt = null
        }
        course.status = target.name
        return toDto(courseRepository.save(course))
    }

    @Transactional
    fun delete(courseId: Long, userId: Long, mayManageAll: Boolean) {
        val course = accessService.requireManage(courseId, userId, mayManageAll)
        require(course.status != CourseStatus.PUBLISHED.name) { "Faol kursni o'chirishdan oldin arxivlang" }
        course.deleted = true
        courseRepository.save(course)
    }

    private fun toDto(course: Course): CourseDto = CourseDto(
        id = requireNotNull(course.id),
        title = course.title.orEmpty(),
        shortDescription = course.shortDescription,
        description = course.description ?: course.shortDescription.orEmpty(),
        categoryId = course.subject?.subjectCategory?.id ?: course.categoryId,
        categoryName = course.subject?.subjectCategory?.name,
        subjectName = course.subject?.name ?: course.subjectName,
        subjectId = course.subject?.id,
        programId = course.subject?.program?.id,
        programName = course.subject?.program?.name,
        programLanguage = course.subject?.program?.educationLanguage,
        groupName = course.groupName,
        subjectGroupId = course.subjectGroup?.id,
        curriculumSubjectId = course.subjectGroup?.curriculumSubject?.id,
        academicYear = course.subjectGroup?.curriculumSubject?.curriculumVersion?.academicYear,
        semester = course.subjectGroup?.curriculumSubject?.semester,
        credits = course.subjectGroup?.curriculumSubject?.creditsSnapshot,
        status = course.status?.lowercase() ?: "draft",
        startDate = course.startDate,
        endDate = course.endDate,
        language = course.language,
        level = course.level,
        paid = course.isPaid == 1,
        price = course.price,
        discountEnabled = course.discountFlag == 1,
        discountedPrice = course.discountedPrice,
        expiryPeriodType = course.expiryPeriodType.lowercase(),
        dripContent = course.dripContent,
        thumbnailAvailable = !course.thumbnail.isNullOrBlank(),
        requirements = course.requirements,
        outcomes = course.outcomes,
        faqs = course.faqs,
        metaKeywords = course.metaKeywords,
        metaDescription = course.metaDescription,
        ownerUserId = requireNotNull(course.userId),
        students = enrollmentRepository.countByCourseIdAndStatusAndDeletedFalse(
            requireNotNull(course.id), CourseEnrollmentStatus.ACTIVE,
        ),
        publishedAt = course.publishedAt,
        archivedAt = course.archivedAt,
        createdAt = course.createdAt,
        updatedAt = course.updatedAt,
    )

    private fun validate(title: String, start: java.time.LocalDate?, end: java.time.LocalDate?) {
        require(title.isNotBlank()) { "Kurs nomi majburiy" }
        require(title.length <= 255) { "Kurs nomi 255 belgidan oshmasligi kerak" }
        require(start == null || end == null || !end.isBefore(start)) { "Tugash sanasi boshlanish sanasidan oldin bo'lmaydi" }
    }

    private fun validateMetadata(course: Course) {
        val paid = course.isPaid == 1
        val discountEnabled = course.discountFlag == 1
        if (paid) {
            require(course.price != null && course.price!!.isFinite() && course.price!! > 0) {
                "Pullik kurs narxi 0 dan katta bo'lishi kerak"
            }
        } else {
            course.price = null
            course.discountFlag = 0
            course.discountedPrice = null
        }
        if (discountEnabled) {
            require(paid) { "Chegirma faqat pullik kurs uchun yoqiladi" }
            require(
                course.discountedPrice != null &&
                    course.discountedPrice!!.isFinite() &&
                    course.discountedPrice!! > 0 &&
                    course.discountedPrice!! < requireNotNull(course.price)
            ) { "Chegirmali narx 0 dan katta va asosiy narxdan kichik bo'lishi kerak" }
        } else {
            course.discountedPrice = null
        }
        val expiry = runCatching { CourseExpiryPeriodType.valueOf(course.expiryPeriodType) }
            .getOrElse { throw IllegalArgumentException("Kurs amal qilish turi noto'g'ri") }
        require(expiry != CourseExpiryPeriodType.LIMITED_TIME || course.endDate != null) {
            "Cheklangan muddatli kurs uchun tugash sanasi majburiy"
        }
        require(course.shortDescription == null || course.shortDescription!!.length <= 2000) {
            "Qisqa tavsif 2000 belgidan oshmasligi kerak"
        }
    }

    private fun subject(id: Long) = subjectRepository.findById(id)
        .filter { it.active && !it.deleted }
        .orElseThrow { IllegalArgumentException("Fan topilmadi: $id") }

    private fun validateOperationalBinding(course: Course) {
        val ownerId = requireNotNull(course.userId)
        val teacher = teacherRepository.findByUserId(ownerId) ?: return
        require(teacher.active) { "Nofaol o'qituvchi kursi nashr qilinmaydi" }
        course.subjectGroup?.id?.let { groupId ->
            subjectGroupService.requireTeachingAssignment(groupId, ownerId)
            return
        }
        val subjectId = requireNotNull(course.subject?.id) {
            "O'qituvchi kursiga fan yoki tasdiqlangan curriculum fan guruhi biriktirilmagan"
        }
        require(teacher.subjects.any { it.id == subjectId && it.active && !it.deleted }) {
            "O'qituvchiga kurs fani biriktirilmagan"
        }
    }

    private fun slug(value: String): String = value.trim().lowercase()
        .replace(Regex("[^a-z0-9\\p{L}]+"), "-")
        .trim('-')
        .take(220) + "-" + System.nanoTime().toString(36).takeLast(6)

    private fun String?.clean(): String? = this?.trim()?.takeIf(String::isNotBlank)
}
