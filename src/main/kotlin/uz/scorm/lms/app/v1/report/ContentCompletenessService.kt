package uz.scorm.lms.app.v1.report

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.assignment.model.AssignmentStatus
import uz.scorm.lms.app.v1.assignment.repository.CourseAssignmentRepository
import uz.scorm.lms.app.v1.courses.model.ContentReviewStatus
import uz.scorm.lms.app.v1.courses.model.CourseEnrollmentStatus
import uz.scorm.lms.app.v1.courses.model.CourseStatus
import uz.scorm.lms.app.v1.courses.model.LearningItemStatus
import uz.scorm.lms.app.v1.courses.repository.CourseContentRepository
import uz.scorm.lms.app.v1.courses.repository.CourseEnrollmentRepository
import uz.scorm.lms.app.v1.courses.repository.CourseModuleRepository
import uz.scorm.lms.app.v1.courses.repository.CourseRepository
import uz.scorm.lms.app.v1.courses.service.ContentCompatibilityService
import uz.scorm.lms.app.v1.quiz.model.QuizStatus
import uz.scorm.lms.app.v1.quiz.repository.CourseQuizRepository
import uz.scorm.lms.app.v1.scorm.model.ScormPackageStatus
import uz.scorm.lms.app.v1.scorm.repository.ScormPackageRepository
import uz.scorm.lms.app.v1.session.model.LearningSessionFormat
import uz.scorm.lms.app.v1.session.model.LearningSessionStatus
import uz.scorm.lms.app.v1.session.repository.CourseLearningSessionRepository
import uz.scorm.lms.app.v1.user.repository.UserRepository
import java.math.RoundingMode
import java.time.LocalDate
import java.time.ZoneId

@Service
class ContentCompletenessService(
    private val courseRepository: CourseRepository,
    private val enrollmentRepository: CourseEnrollmentRepository,
    private val moduleRepository: CourseModuleRepository,
    private val contentRepository: CourseContentRepository,
    private val assignmentRepository: CourseAssignmentRepository,
    private val quizRepository: CourseQuizRepository,
    private val sessionRepository: CourseLearningSessionRepository,
    private val scormRepository: ScormPackageRepository,
    private val userRepository: UserRepository,
    private val compatibilityService: ContentCompatibilityService,
) {
    @Transactional(readOnly = true)
    fun report(actorId: Long, institutionScope: Boolean, academicYear: String?): ContentCompletenessReportDto {
        val year = parseAcademicYear(academicYear ?: currentAcademicYear())
        val courses = if (institutionScope) courseRepository.findAllByDeletedFalseOrderByCreatedAtDesc()
        else courseRepository.findAllByUserIdAndDeletedFalseOrderByCreatedAtDesc(actorId)
        val ids = courses.mapNotNull { it.id }
        val owners = userRepository.findAllById(courses.mapNotNull { it.userId }.distinct()).associateBy { it.id }
        if (ids.isEmpty()) return ContentCompletenessReportDto(
            scope = scope(institutionScope), academicYear = year.label, coverageFrom = year.from,
            coverageTo = year.to, totalCourses = 0, completeCourses = 0, averageCompleteness = 0.0, courses = emptyList(),
        )
        val modules = moduleRepository.findAllByCourseIdInAndDeletedFalseOrderByCourseIdAscPositionAsc(ids).groupBy { it.course.id }
        val contents = contentRepository.findAllByModuleCourseIdInAndDeletedFalseOrderByModuleCourseIdAscModulePositionAscPositionAsc(ids).groupBy { it.module.course.id }
        val enrollments = enrollmentRepository.findAllByCourseIdInAndAcademicYearAndStatusInAndDeletedFalse(
            ids, year.label, setOf(CourseEnrollmentStatus.ACTIVE, CourseEnrollmentStatus.COMPLETED),
        ).groupBy { it.course.id }
        val assignments = assignmentRepository.findAllByCourseIdInAndStatusInAndDeletedFalseOrderByDueAtAsc(
            ids, setOf(AssignmentStatus.PUBLISHED, AssignmentStatus.CLOSED),
        ).groupBy { it.course.id }
        val quizzes = quizRepository.findAllByCourseIdInAndStatusInAndDeletedFalseOrderByOpensAtAsc(
            ids, setOf(QuizStatus.PUBLISHED, QuizStatus.CLOSED),
        ).groupBy { it.course.id }
        val sessions = sessionRepository.findAllByCourseIdInAndStatusInAndDeletedFalseOrderByStartsAtAsc(
            ids, setOf(LearningSessionStatus.PUBLISHED, LearningSessionStatus.COMPLETED),
        ).groupBy { it.course.id }
        val scorm = scormRepository.findAllByCourseIdInAndStatusAndDeletedFalse(ids, ScormPackageStatus.READY).groupBy { it.course.id }

        val rows = courses.map { course ->
            val courseId = requireNotNull(course.id)
            val courseModules = modules[courseId].orEmpty()
            val courseContents = contents[courseId].orEmpty()
            val courseAssignments = assignments[courseId].orEmpty().filter { it.dueAt.toLocalDate() in year.from..year.to }
            val courseQuizzes = quizzes[courseId].orEmpty().filter {
                !it.closesAt.toLocalDate().isBefore(year.from) && !it.opensAt.toLocalDate().isAfter(year.to)
            }
            val courseSessions = sessions[courseId].orEmpty().filter {
                !it.endsAt.toLocalDate().isBefore(year.from) && !it.startsAt.toLocalDate().isAfter(year.to)
            }
            val publishedModules = courseModules.filter { it.status == LearningItemStatus.PUBLISHED.name }
            val approvedPublished = courseContents.filter {
                it.status == LearningItemStatus.PUBLISHED.name && it.reviewStatus == ContentReviewStatus.APPROVED.name
            }
            val compatibility = compatibilityService.evaluateAll(course, approvedPublished.map { it.languageCode })
            val annual = approvedPublished.filter {
                !it.validFrom.isAfter(year.from) && (it.validUntil == null || !it.validUntil!!.isBefore(year.to)) &&
                    compatibility.getValue(it.languageCode).compatible
            }
            val modulesWithoutCoverage = courseModules.filter { module -> annual.none { it.module.id == module.id } }
            val enrollmentCount = enrollments[courseId].orEmpty().size
            val gaps = buildList {
                if (course.status != CourseStatus.PUBLISHED.name) add(gap("COURSE_NOT_PUBLISHED", "Kurs nashr qilinmagan"))
                if (enrollmentCount == 0) add(gap("NO_ACADEMIC_YEAR_ENROLLMENT", "O'quv yiliga enrollment yo'q"))
                if (courseModules.isEmpty()) add(gap("NO_MODULES", "Kurs modullari mavjud emas"))
                else if (publishedModules.size != courseModules.size) add(gap(
                    "UNPUBLISHED_MODULES", "Barcha modullar nashr qilinmagan",
                    courseModules.filter { it.status != LearningItemStatus.PUBLISHED.name }.map { it.title },
                ))
                if (courseModules.isEmpty() || modulesWithoutCoverage.isNotEmpty()) add(gap(
                    "MODULE_WITHOUT_ANNUAL_APPROVED_CONTENT",
                    "Modulda yilni to'liq qoplaydigan, til va dasturga mos tasdiqlangan kontent yo'q",
                    modulesWithoutCoverage.map { it.title },
                ))
                if (courseAssignments.isEmpty()) add(gap("NO_PUBLISHED_ASSIGNMENT", "O'quv yilida nashrdagi topshiriq yo'q"))
                if (courseQuizzes.isEmpty()) add(gap("NO_PUBLISHED_QUIZ", "O'quv yilida nashrdagi test yo'q"))
                if (courseSessions.none { it.format == LearningSessionFormat.SYNCHRONOUS }) add(gap("NO_SYNCHRONOUS_SESSION", "Sinxron mashg'ulot yo'q"))
                if (courseSessions.none { it.format == LearningSessionFormat.ASYNCHRONOUS }) add(gap("NO_ASYNCHRONOUS_SESSION", "Asinxron mashg'ulot yo'q"))
            }
            val passed = TOTAL_CRITERIA - gaps.size
            CourseContentCompletenessDto(
                courseId = courseId,
                courseTitle = course.title.orEmpty(),
                ownerName = course.userId?.let { owners[it]?.fullName ?: owners[it]?.username }.orEmpty(),
                courseStatus = course.status.orEmpty().lowercase(),
                academicYearEnrollmentCount = enrollmentCount,
                totalModules = courseModules.size,
                publishedModules = publishedModules.size,
                totalContents = courseContents.size,
                approvedPublishedContents = approvedPublished.size,
                annualCoverageContents = annual.size,
                publishedAssignments = courseAssignments.size,
                publishedQuizzes = courseQuizzes.size,
                synchronousSessions = courseSessions.count { it.format == LearningSessionFormat.SYNCHRONOUS },
                asynchronousSessions = courseSessions.count { it.format == LearningSessionFormat.ASYNCHRONOUS },
                readyScormPackages = scorm[courseId].orEmpty().size,
                completenessPercentage = passed.coerceAtLeast(0) * 100 / TOTAL_CRITERIA,
                complete = gaps.isEmpty(),
                gaps = gaps,
            )
        }
        return ContentCompletenessReportDto(
            scope = scope(institutionScope), academicYear = year.label, coverageFrom = year.from, coverageTo = year.to,
            totalCourses = rows.size, completeCourses = rows.count { it.complete },
            averageCompleteness = if (rows.isEmpty()) 0.0 else rows.map { it.completenessPercentage }.average()
                .toBigDecimal().setScale(2, RoundingMode.HALF_UP).toDouble(),
            courses = rows,
        )
    }

    private fun gap(code: String, label: String, details: List<String> = emptyList()) =
        ContentCompletenessGapDto(code, label, details)

    private fun parseAcademicYear(value: String): AcademicYear {
        val match = ACADEMIC_YEAR.matchEntire(value.trim())
            ?: throw IllegalArgumentException("O'quv yili YYYY-YYYY formatida bo'lishi kerak")
        val first = match.groupValues[1].toInt()
        val second = match.groupValues[2].toInt()
        require(second == first + 1) { "O'quv yili ketma-ket ikki yildan iborat bo'lishi kerak" }
        return AcademicYear("$first-$second", LocalDate.of(first, 9, 1), LocalDate.of(second, 8, 31))
    }

    private fun currentAcademicYear(): String {
        val now = LocalDate.now()
        val first = if (now.monthValue >= 9) now.year else now.year - 1
        return "$first-${first + 1}"
    }

    private fun scope(institutionScope: Boolean) = if (institutionScope) "INSTITUTION" else "TEACHER"
    private fun java.time.Instant.toLocalDate(): LocalDate = atZone(REPORT_ZONE).toLocalDate()
    private data class AcademicYear(val label: String, val from: LocalDate, val to: LocalDate)

    companion object {
        private const val TOTAL_CRITERIA = 8
        private val ACADEMIC_YEAR = Regex("(\\d{4})-(\\d{4})")
        private val REPORT_ZONE = ZoneId.of("Asia/Tashkent")
    }
}
