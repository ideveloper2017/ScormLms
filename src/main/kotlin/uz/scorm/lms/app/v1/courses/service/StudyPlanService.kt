package uz.scorm.lms.app.v1.courses.service

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.courses.model.CourseContentProgress
import uz.scorm.lms.app.v1.courses.model.CourseEnrollment
import uz.scorm.lms.app.v1.courses.model.CourseEnrollmentStatus
import uz.scorm.lms.app.v1.courses.model.LearningItemStatus
import uz.scorm.lms.app.v1.courses.repository.CourseContentProgressRepository
import uz.scorm.lms.app.v1.courses.repository.CourseContentRepository
import uz.scorm.lms.app.v1.courses.repository.CourseEnrollmentRepository
import uz.scorm.lms.app.v1.scorm.model.ScormAttemptStatus
import uz.scorm.lms.app.v1.scorm.model.ScormPackageStatus
import uz.scorm.lms.app.v1.scorm.repository.ScormAttemptRepository
import uz.scorm.lms.app.v1.scorm.repository.ScormPackageRepository
import uz.scorm.lms.app.v1.student.dto.StudentCourseProgressDto
import uz.scorm.lms.app.v1.student.dto.StudentStudyPlanCourseDto
import uz.scorm.lms.app.v1.student.dto.StudentStudyPlanDto
import uz.scorm.lms.app.v1.student.repository.StudentRepository
import uz.scorm.lms.app.v1.user.repository.UserRepository
import uz.scorm.lms.app.v1.attendance.model.LearningActivitySource
import uz.scorm.lms.app.v1.attendance.model.LearningActivityType
import uz.scorm.lms.app.v1.attendance.service.LearningActivityService
import java.time.Instant
import kotlin.math.roundToInt

@Service
class StudyPlanService(
    private val enrollmentRepository: CourseEnrollmentRepository,
    private val contentRepository: CourseContentRepository,
    private val contentProgressRepository: CourseContentProgressRepository,
    private val packageRepository: ScormPackageRepository,
    private val attemptRepository: ScormAttemptRepository,
    private val studentRepository: StudentRepository,
    private val userRepository: UserRepository,
    private val learningActivityService: LearningActivityService,
) {
    @Transactional
    fun studyPlan(userId: Long, academicYear: String?): StudentStudyPlanDto {
        val student = studentRepository.findByUserId(userId)
            ?: throw NoSuchElementException("Talaba profili topilmadi")
        val enrollments = enrollmentRepository
            .findAllByStudentIdAndStatusInAndDeletedFalseOrderByEnrolledAtDesc(
                requireNotNull(student.id),
                setOf(CourseEnrollmentStatus.ACTIVE, CourseEnrollmentStatus.COMPLETED),
            )
        val defaultYear = enrollments.firstOrNull()?.academicYear?.takeIf(String::isNotBlank)
            ?: student.academicYear?.takeIf(String::isNotBlank)
            ?: currentAcademicYear()
        val selectedYear = academicYear?.takeIf(String::isNotBlank) ?: defaultYear
        require(selectedYear.matches(Regex("\\d{4}-\\d{4}"))) {
            "O'quv yili YYYY-YYYY formatida bo'lishi kerak"
        }

        val courses = enrollments
            .filter {
                if (it.academicYear.isBlank()) {
                    it.academicYear = defaultYear
                    enrollmentRepository.save(it)
                    defaultYear == selectedYear
                } else {
                    it.academicYear == selectedYear
                }
            }
            .sortedWith(compareBy<CourseEnrollment> { it.semester }.thenBy { it.course.title })
            .map { enrollment ->
                val progress = refresh(enrollment)
                val course = enrollment.course
                StudentStudyPlanCourseDto(
                    enrollmentId = requireNotNull(enrollment.id),
                    courseId = requireNotNull(course.id),
                    title = course.title.orEmpty(),
                    subjectName = course.subjectName?.takeIf(String::isNotBlank) ?: course.title.orEmpty(),
                    instructor = course.userId?.let { ownerId ->
                        userRepository.findById(ownerId).orElse(null)?.let { owner ->
                            owner.fullName?.takeIf(String::isNotBlank) ?: owner.username
                        }
                    } ?: "O'qituvchi",
                    academicYear = enrollment.academicYear,
                    semester = enrollment.semester,
                    credits = enrollment.credits,
                    required = enrollment.required,
                    status = enrollment.status.name.lowercase(),
                    progress = progress.progress,
                    completedContents = progress.completedContents,
                    totalContents = progress.totalContents,
                    completedScormPackages = progress.completedScormPackages,
                    totalScormPackages = progress.totalScormPackages,
                    startDate = course.startDate,
                    endDate = course.endDate,
                )
            }
        val totalCredits = courses.sumOf { it.credits }
        val completedCredits = courses.filter { it.status == "completed" }.sumOf { it.credits }
        val overallProgress = when {
            courses.isEmpty() -> 0
            totalCredits > 0 -> (courses.sumOf { it.progress * it.credits }.toDouble() / totalCredits).roundToInt()
            else -> courses.map { it.progress }.average().roundToInt()
        }
        return StudentStudyPlanDto(
            studentId = requireNotNull(student.id),
            studentNumber = student.studentNumber,
            studentName = listOf(student.lastName, student.firstName, student.middleName)
                .filterNotNull().joinToString(" "),
            academicYear = selectedYear,
            totalCredits = totalCredits,
            completedCredits = completedCredits,
            overallProgress = overallProgress,
            courses = courses,
        )
    }

    @Transactional
    fun courseProgress(courseId: Long, userId: Long): StudentCourseProgressDto =
        refresh(activeEnrollment(courseId, userId))

    @Transactional
    fun recordContentProgress(courseId: Long, contentId: Long, progress: Int, userId: Long): StudentCourseProgressDto {
        require(progress in 0..100) { "Progress 0 dan 100 gacha bo'lishi kerak" }
        val enrollment = activeEnrollment(courseId, userId)
        val content = contentRepository.findById(contentId)
            .filter {
                !it.deleted && it.module.course.id == courseId &&
                    it.status == LearningItemStatus.PUBLISHED.name &&
                    it.module.status == LearningItemStatus.PUBLISHED.name
            }
            .orElseThrow { NoSuchElementException("Nashr qilingan kontent topilmadi: $contentId") }
        val now = Instant.now()
        val item = contentProgressRepository.findByEnrollmentIdAndContentIdAndDeletedFalse(
            requireNotNull(enrollment.id), contentId,
        ) ?: CourseContentProgress(enrollment = enrollment, content = content, firstAccessedAt = now)
        val previousProgress = item.progress
        item.progress = progress
        item.lastAccessedAt = now
        item.completedAt = if (progress == 100) item.completedAt ?: now else null
        item.deleted = false
        contentProgressRepository.save(item)
        learningActivityService.recordIfEnrolled(
            courseId = courseId,
            userId = userId,
            eventType = if (progress == 100 && previousProgress < 100) {
                LearningActivityType.CONTENT_COMPLETED
            } else {
                LearningActivityType.CONTENT_VIEWED
            },
            sourceType = LearningActivitySource.COURSE_CONTENT,
            sourceId = contentId,
            occurredAt = now,
        )
        return refresh(enrollment)
    }

    private fun activeEnrollment(courseId: Long, userId: Long): CourseEnrollment = enrollmentRepository
        .findByCourseIdAndStudentUserIdAndStatusInAndDeletedFalse(
            courseId,
            userId,
            setOf(CourseEnrollmentStatus.ACTIVE, CourseEnrollmentStatus.COMPLETED),
        ) ?: throw IllegalArgumentException("Talaba kursga biriktirilmagan")

    private fun refresh(enrollment: CourseEnrollment): StudentCourseProgressDto {
        val courseId = requireNotNull(enrollment.course.id)
        val userId = requireNotNull(enrollment.student.user.id)
        val contents = contentRepository
            .findAllByModuleCourseIdAndDeletedFalseOrderByModulePositionAscPositionAsc(courseId)
            .filter {
                it.status == LearningItemStatus.PUBLISHED.name &&
                    it.module.status == LearningItemStatus.PUBLISHED.name
            }
        val contentProgress = contentProgressRepository
            .findAllByEnrollmentIdAndDeletedFalse(requireNotNull(enrollment.id))
            .associateBy { requireNotNull(it.content.id) }
        val packages = listOfNotNull(packageRepository
            .findFirstByCourseIdAndStatusAndDeletedFalseOrderByCreatedAtDesc(courseId, ScormPackageStatus.READY))
        val attempts = attemptRepository.findAllByScormPackageCourseIdAndUserIdAndDeletedFalse(courseId, userId)
            .associateBy { requireNotNull(it.scormPackage.id) }
        val contentPoints = contents.sumOf { contentProgress[it.id]?.progress ?: 0 }
        val scormPoints = packages.sumOf { pack ->
            val attempt = attempts[pack.id]
            when (attempt?.status) {
                ScormAttemptStatus.COMPLETED, ScormAttemptStatus.PASSED -> 100
                else -> ((attempt?.progressMeasure ?: 0.0).coerceIn(0.0, 1.0) * 100).roundToInt()
            }
        }
        val totalItems = contents.size + packages.size
        val calculated = if (totalItems == 0) enrollment.progress else
            ((contentPoints + scormPoints).toDouble() / totalItems).roundToInt().coerceIn(0, 100)
        enrollment.progress = calculated
        if (totalItems > 0 && calculated == 100) {
            enrollment.status = CourseEnrollmentStatus.COMPLETED
            enrollment.completedAt = enrollment.completedAt ?: Instant.now()
        } else if (enrollment.status == CourseEnrollmentStatus.COMPLETED) {
            enrollment.status = CourseEnrollmentStatus.ACTIVE
            enrollment.completedAt = null
        }
        enrollmentRepository.save(enrollment)
        return StudentCourseProgressDto(
            courseId = courseId,
            progress = calculated,
            completedContents = contents.count { contentProgress[it.id]?.progress == 100 },
            totalContents = contents.size,
            completedScormPackages = packages.count { pack ->
                attempts[pack.id]?.status in setOf(ScormAttemptStatus.COMPLETED, ScormAttemptStatus.PASSED)
            },
            totalScormPackages = packages.size,
            status = enrollment.status.name.lowercase(),
            updatedAt = enrollment.updatedAt,
        )
    }

    private fun currentAcademicYear(): String {
        val today = java.time.LocalDate.now()
        val start = if (today.monthValue >= 9) today.year else today.year - 1
        return "$start-${start + 1}"
    }
}
