package uz.scorm.lms.app.v1.report

import java.time.Instant
import java.time.LocalDate

data class ReportMetricDto(val code: String, val label: String, val value: Double, val unit: String)

data class CourseReportRowDto(
    val courseId: Long,
    val courseTitle: String,
    val ownerName: String,
    val status: String,
    val enrolledStudents: Long,
    val completedStudents: Long,
    val completionRate: Double,
    val averageScore: Double,
    val attendanceRate: Double,
    val contentCount: Long,
    val scormPackageCount: Long,
    val activityEventCount: Long,
)

data class InstitutionReportDto(
    val generatedAt: Instant = Instant.now(),
    val scope: String,
    val from: LocalDate,
    val to: LocalDate,
    val metrics: List<ReportMetricDto>,
    val courses: List<CourseReportRowDto>,
)

enum class ReportExportFormat { CSV, XLSX }
data class ReportExport(val bytes: ByteArray, val contentType: String, val filename: String)
