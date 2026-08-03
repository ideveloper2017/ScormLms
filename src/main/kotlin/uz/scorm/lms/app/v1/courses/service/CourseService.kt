package uz.scorm.lms.app.v1.courses.service

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.courses.dto.CourseCreateRequest
import uz.scorm.lms.app.v1.courses.dto.CourseDto
import uz.scorm.lms.app.v1.courses.dto.CourseUpdateRequest
import uz.scorm.lms.app.v1.courses.model.Course
import uz.scorm.lms.app.v1.courses.model.CourseEnrollmentStatus
import uz.scorm.lms.app.v1.courses.model.CourseStatus
import uz.scorm.lms.app.v1.courses.repository.CourseEnrollmentRepository
import uz.scorm.lms.app.v1.courses.repository.CourseRepository
import java.time.Instant

@Service
class CourseService(
    private val courseRepository: CourseRepository,
    private val enrollmentRepository: CourseEnrollmentRepository,
    private val accessService: CourseAccessService,
) {
    @Transactional(readOnly = true)
    fun owned(userId: Long, mayManageAll: Boolean): List<CourseDto> =
        (if (mayManageAll) courseRepository.findAllByDeletedFalseOrderByCreatedAtDesc()
        else courseRepository.findAllByUserIdAndDeletedFalseOrderByCreatedAtDesc(userId)).map(::toDto)

    @Transactional(readOnly = true)
    fun get(courseId: Long, userId: Long, mayManageAll: Boolean): CourseDto =
        toDto(accessService.requireRead(courseId, userId, mayManageAll))

    @Transactional
    fun create(request: CourseCreateRequest, ownerUserId: Long): CourseDto {
        validate(request.title, request.startDate, request.endDate)
        val course = Course(
            title = request.title.trim(),
            slug = slug(request.title),
            shortDescription = request.description?.trim(),
            description = request.description?.trim(),
            userId = ownerUserId,
            status = CourseStatus.DRAFT.name,
            subjectName = request.subjectName?.trim(),
            groupName = request.groupName?.trim(),
            startDate = request.startDate,
            endDate = request.endDate,
            language = request.language?.trim()?.lowercase(),
            level = request.level?.trim(),
        )
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
        request.description?.let { course.description = it.trim(); course.shortDescription = it.trim() }
        request.subjectName?.let { course.subjectName = it.trim() }
        request.groupName?.let { course.groupName = it.trim() }
        request.startDate?.let { course.startDate = it }
        request.endDate?.let { course.endDate = it }
        request.language?.let { course.language = it.trim().lowercase() }
        request.level?.let { course.level = it.trim() }
        return toDto(courseRepository.save(course))
    }

    @Transactional
    fun changeStatus(courseId: Long, target: CourseStatus, userId: Long, mayManageAll: Boolean): CourseDto {
        val course = accessService.requireManage(courseId, userId, mayManageAll)
        when (target) {
            CourseStatus.PUBLISHED -> {
                validate(course.title.orEmpty(), course.startDate, course.endDate)
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
        description = course.description ?: course.shortDescription.orEmpty(),
        subjectName = course.subjectName,
        groupName = course.groupName,
        status = course.status?.lowercase() ?: "draft",
        startDate = course.startDate,
        endDate = course.endDate,
        language = course.language,
        level = course.level,
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

    private fun slug(value: String): String = value.trim().lowercase()
        .replace(Regex("[^a-z0-9\\p{L}]+"), "-")
        .trim('-')
        .take(220) + "-" + System.nanoTime().toString(36).takeLast(6)
}
