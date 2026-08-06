package uz.scorm.lms.app.v1.report

import org.apache.poi.xssf.usermodel.XSSFWorkbook
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.attendance.service.AttendanceService
import uz.scorm.lms.app.v1.attendance.repository.LearningActivityEventRepository
import uz.scorm.lms.app.v1.audit.service.AuditService
import uz.scorm.lms.app.v1.courses.model.CourseEnrollmentStatus
import uz.scorm.lms.app.v1.courses.model.CourseStatus
import uz.scorm.lms.app.v1.courses.repository.CourseContentRepository
import uz.scorm.lms.app.v1.courses.repository.CourseEnrollmentRepository
import uz.scorm.lms.app.v1.courses.repository.CourseRepository
import uz.scorm.lms.app.v1.exam.repository.ExamResultRepository
import uz.scorm.lms.app.v1.scorm.repository.ScormPackageRepository
import uz.scorm.lms.app.v1.student.model.StudentStatus
import uz.scorm.lms.app.v1.student.repository.StudentRepository
import uz.scorm.lms.app.v1.teacher.repository.TeacherRepository
import uz.scorm.lms.app.v1.user.repository.UserRepository
import java.io.ByteArrayOutputStream
import java.math.RoundingMode
import java.nio.charset.StandardCharsets
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneOffset

@Service
class InstitutionReportService(
    private val courseRepository: CourseRepository,
    private val enrollmentRepository: CourseEnrollmentRepository,
    private val contentRepository: CourseContentRepository,
    private val scormRepository: ScormPackageRepository,
    private val activityRepository: LearningActivityEventRepository,
    private val examResultRepository: ExamResultRepository,
    private val studentRepository: StudentRepository,
    private val teacherRepository: TeacherRepository,
    private val userRepository: UserRepository,
    private val attendanceService: AttendanceService,
    private val auditService: AuditService,
) {
    @Transactional(readOnly = true)
    fun report(actorId: Long, institutionScope: Boolean, from: LocalDate?, to: LocalDate?): InstitutionReportDto {
        val range = range(from, to)
        val courses = if (institutionScope) courseRepository.findAllByDeletedFalseOrderByCreatedAtDesc()
        else courseRepository.findAllByUserIdAndDeletedFalseOrderByCreatedAtDesc(actorId)
        val owners = userRepository.findAllById(courses.mapNotNull { it.userId }.distinct()).associateBy { it.id }
        val attendanceByCourse = attendanceService.teacherSessions(actorId, institutionScope)
            .filter { it.status == "closed" && localDate(it.date) in range.first..range.second }
            .groupBy { it.courseId }
        val fromInstant = range.first.atStartOfDay(ZoneOffset.UTC).toInstant()
        val toInstant = range.second.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant().minusNanos(1)
        val allScores = mutableListOf<Double>()

        val rows = courses.map { course ->
            val courseId = requireNotNull(course.id)
            val enrollments = enrollmentRepository.findAllByCourseIdAndDeletedFalseOrderByEnrolledAtDesc(courseId)
                .filter { it.status in setOf(CourseEnrollmentStatus.ACTIVE, CourseEnrollmentStatus.COMPLETED) }
            val completed = enrollments.count { it.status == CourseEnrollmentStatus.COMPLETED && it.completedAt?.let { date -> !date.isBefore(fromInstant) && !date.isAfter(toInstant) } == true }
            val results = examResultRepository.findAllByEnrollmentCourseIdAndDeletedFalseOrderByGradingDateDesc(courseId)
                .filter { !it.gradingDate.isBefore(fromInstant) && !it.gradingDate.isAfter(toInstant) }
            allScores += results.map { it.percentage }
            val sessions = attendanceByCourse[courseId].orEmpty()
            val attendanceTotal = sessions.sumOf { it.total }
            val attendancePresent = sessions.sumOf { it.present + it.late }
            CourseReportRowDto(
                courseId = courseId,
                courseTitle = course.title.orEmpty(),
                ownerName = course.userId?.let { owners[it]?.fullName ?: owners[it]?.username }.orEmpty(),
                status = course.status.orEmpty(),
                enrolledStudents = enrollments.size.toLong(),
                completedStudents = completed.toLong(),
                completionRate = percentage(completed.toLong(), enrollments.size.toLong()),
                averageScore = average(results.map { it.percentage }),
                attendanceRate = percentage(attendancePresent.toLong(), attendanceTotal.toLong()),
                contentCount = contentRepository.countByModuleCourseIdAndDeletedFalse(courseId),
                scormPackageCount = scormRepository.countByCourseIdAndDeletedFalse(courseId),
                activityEventCount = enrollments.sumOf { enrollment -> activityRepository.countByEnrollmentIdAndOccurredAtBetweenAndDeletedFalse(requireNotNull(enrollment.id), fromInstant, toInstant) },
            )
        }
        val scopedStudentIds = if (institutionScope) emptySet() else courses.flatMap { course ->
            enrollmentRepository.findAllByCourseIdAndDeletedFalseOrderByEnrolledAtDesc(requireNotNull(course.id)).mapNotNull { it.student.id }
        }.toSet()
        val scopedStudents = if (institutionScope) emptyList() else studentRepository.findAllById(scopedStudentIds)
        val enrollments = rows.sumOf { it.enrolledStudents }
        val completed = rows.sumOf { it.completedStudents }
        val attendanceSessions = attendanceByCourse.values.flatten()
        val attendanceTotal = attendanceSessions.sumOf { it.total }.toLong()
        val attendancePresent = attendanceSessions.sumOf { it.present + it.late }.toLong()
        val metrics = listOf(
            ReportMetricDto("STUDENTS", "Talabalar", if (institutionScope) studentRepository.count().toDouble() else scopedStudents.size.toDouble(), "talaba"),
            ReportMetricDto("ACTIVE_STUDENTS", "Faol talabalar", if (institutionScope) studentRepository.countByStudentStatus(StudentStatus.ACTIVE).toDouble() else scopedStudents.count { it.studentStatus == StudentStatus.ACTIVE }.toDouble(), "talaba"),
            ReportMetricDto("TEACHERS", "Pedagoglar", if (institutionScope) teacherRepository.countByActiveTrue().toDouble() else 1.0, "pedagog"),
            ReportMetricDto("COURSES", "Kurslar", rows.size.toDouble(), "kurs"),
            ReportMetricDto("PUBLISHED_COURSES", "Nashrdagi kurslar", courses.count { it.status == CourseStatus.PUBLISHED.name }.toDouble(), "kurs"),
            ReportMetricDto("ENROLLMENTS", "Biriktirishlar", enrollments.toDouble(), "biriktirish"),
            ReportMetricDto("COMPLETION_RATE", "Yakunlash", percentage(completed, enrollments), "%"),
            ReportMetricDto("AVERAGE_SCORE", "O'rtacha ball", average(allScores), "%"),
            ReportMetricDto("ATTENDANCE_RATE", "Davomat", percentage(attendancePresent, attendanceTotal), "%"),
            ReportMetricDto("CONTENTS", "Kontentlar", rows.sumOf { it.contentCount }.toDouble(), "kontent"),
            ReportMetricDto("SCORM_PACKAGES", "SCORM paketlari", rows.sumOf { it.scormPackageCount }.toDouble(), "paket"),
            ReportMetricDto("ACTIVITY_EVENTS", "Faollik hodisalari", rows.sumOf { it.activityEventCount }.toDouble(), "hodisa"),
        )
        return InstitutionReportDto(scope = if (institutionScope) "INSTITUTION" else "TEACHER", from = range.first, to = range.second, metrics = metrics, courses = rows)
    }

    @Transactional(readOnly = true)
    fun export(actorId: Long, institutionScope: Boolean, from: LocalDate?, to: LocalDate?, format: ReportExportFormat): ReportExport {
        val report = report(actorId, institutionScope, from, to)
        val export = when (format) {
            ReportExportFormat.CSV -> ReportExport(csv(report), "text/csv; charset=UTF-8", "lms-report-${report.from}-${report.to}.csv")
            ReportExportFormat.XLSX -> ReportExport(xlsx(report), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "lms-report-${report.from}-${report.to}.xlsx")
        }
        auditService.logAction("INSTITUTION_REPORT_EXPORTED", actorId, "scope=${report.scope}; format=$format; from=${report.from}; to=${report.to}")
        return export
    }

    private fun csv(report: InstitutionReportDto): ByteArray {
        val lines = mutableListOf("Kurs ID,Kurs,Mas'ul,Holat,Talabalar,Yakunlagan,Yakunlash %,O'rtacha ball,Davomat %,Kontent,SCORM,Faollik")
        report.courses.forEach { row -> lines += listOf(row.courseId, row.courseTitle, row.ownerName, row.status, row.enrolledStudents, row.completedStudents, row.completionRate, row.averageScore, row.attendanceRate, row.contentCount, row.scormPackageCount, row.activityEventCount).joinToString(",") { csvCell(it.toString()) } }
        return ("\uFEFF" + lines.joinToString("\r\n")).toByteArray(StandardCharsets.UTF_8)
    }

    private fun xlsx(report: InstitutionReportDto): ByteArray = ByteArrayOutputStream().use { output ->
        XSSFWorkbook().use { workbook ->
            val metrics = workbook.createSheet("Ko'rsatkichlar")
            metrics.createRow(0).apply { createCell(0).setCellValue("Ko'rsatkich"); createCell(1).setCellValue("Qiymat"); createCell(2).setCellValue("Birlik") }
            report.metrics.forEachIndexed { index, metric -> metrics.createRow(index + 1).apply { createCell(0).setCellValue(metric.label); createCell(1).setCellValue(metric.value); createCell(2).setCellValue(metric.unit) } }
            val courses = workbook.createSheet("Kurslar")
            val headers = listOf("Kurs ID", "Kurs", "Mas'ul", "Holat", "Talabalar", "Yakunlagan", "Yakunlash %", "O'rtacha ball", "Davomat %", "Kontent", "SCORM", "Faollik")
            courses.createRow(0).also { row -> headers.forEachIndexed { index, value -> row.createCell(index).setCellValue(value) } }
            report.courses.forEachIndexed { index, item -> courses.createRow(index + 1).apply {
                createCell(0).setCellValue(item.courseId.toDouble()); createCell(1).setCellValue(item.courseTitle); createCell(2).setCellValue(item.ownerName); createCell(3).setCellValue(item.status)
                createCell(4).setCellValue(item.enrolledStudents.toDouble()); createCell(5).setCellValue(item.completedStudents.toDouble()); createCell(6).setCellValue(item.completionRate); createCell(7).setCellValue(item.averageScore); createCell(8).setCellValue(item.attendanceRate); createCell(9).setCellValue(item.contentCount.toDouble()); createCell(10).setCellValue(item.scormPackageCount.toDouble()); createCell(11).setCellValue(item.activityEventCount.toDouble())
            } }
            headers.indices.forEach { courses.autoSizeColumn(it) }
            workbook.write(output)
        }
        output.toByteArray()
    }

    private fun range(from: LocalDate?, to: LocalDate?): Pair<LocalDate, LocalDate> {
        val end = to ?: LocalDate.now()
        val start = from ?: end.minusMonths(6).withDayOfMonth(1)
        require(!start.isAfter(end)) { "Hisobot boshlanish sanasi tugash sanasidan keyin bo'lishi mumkin emas" }
        require(!start.isBefore(end.minusYears(5))) { "Hisobot oralig'i 5 yildan oshmasligi kerak" }
        return start to end
    }
    private fun localDate(value: Instant) = value.atZone(ZoneOffset.UTC).toLocalDate()
    private fun percentage(value: Long, total: Long) = if (total == 0L) 0.0 else round(value * 100.0 / total)
    private fun average(values: List<Double>) = if (values.isEmpty()) 0.0 else round(values.average())
    private fun round(value: Double) = value.toBigDecimal().setScale(2, RoundingMode.HALF_UP).toDouble()
    private fun csvCell(value: String): String { val safe = if (value.firstOrNull() in setOf('=', '+', '-', '@')) "'$value" else value; return if (safe.any { it == ',' || it == '"' || it == '\n' || it == '\r' }) "\"${safe.replace("\"", "\"\"")}\"" else safe }
}
