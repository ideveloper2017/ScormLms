package uz.scorm.lms.app.v1.report

import java.time.Instant
import java.time.LocalDate

data class ContentCompletenessGapDto(
    val code: String,
    val label: String,
    val details: List<String> = emptyList(),
)

data class CourseContentCompletenessDto(
    val courseId: Long,
    val courseTitle: String,
    val ownerName: String,
    val courseStatus: String,
    val academicYearEnrollmentCount: Int,
    val totalModules: Int,
    val publishedModules: Int,
    val totalContents: Int,
    val approvedPublishedContents: Int,
    val annualCoverageContents: Int,
    val publishedAssignments: Int,
    val publishedQuizzes: Int,
    val synchronousSessions: Int,
    val asynchronousSessions: Int,
    val readyScormPackages: Int,
    val completenessPercentage: Int,
    val complete: Boolean,
    val gaps: List<ContentCompletenessGapDto>,
)

data class ContentCompletenessReportDto(
    val generatedAt: Instant = Instant.now(),
    val scope: String,
    val academicYear: String,
    val coverageFrom: LocalDate,
    val coverageTo: LocalDate,
    val totalCourses: Int,
    val completeCourses: Int,
    val averageCompleteness: Double,
    val courses: List<CourseContentCompletenessDto>,
)
