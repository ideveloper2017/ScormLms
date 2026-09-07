package uz.scorm.lms.app.v1.student.service

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.attendance.service.AttendanceService
import uz.scorm.lms.app.v1.courses.model.CourseEnrollmentStatus
import uz.scorm.lms.app.v1.courses.service.StudyPlanService
import uz.scorm.lms.app.v1.student.dto.*
import java.time.*
import java.time.temporal.ChronoUnit
import kotlin.math.round

@Service
class StudentReportService(
    private val grades: StudentGradeService,
    private val attendance: AttendanceService,
    private val studyPlan: StudyPlanService,
) {
    // Progress refreshes enrollment completion, so this operation needs a write transaction.
    @Transactional
    fun report(userId: Long, from: LocalDate? = null, to: LocalDate? = null, courseId: Long? = null): StudentReportDto {
        val end = to ?: LocalDate.now(zone)
        val start = from ?: end.withDayOfMonth(1).minusMonths(5)
        require(!start.isAfter(end)) { "Boshlanish sanasi tugash sanasidan keyin bo'lishi mumkin emas" }
        require(ChronoUnit.DAYS.between(start, end) <= 731) { "Hisobot davri 2 yildan oshmasligi kerak" }
        require(courseId == null || courseId > 0) { "Kurs identifikatori noto'g'ri" }
        val enrollments = grades.enrollments(userId).filter { courseId == null || it.course.id == courseId }
        val progress = enrollments.associate { it.course.id to studyPlan.courseProgress(requireNotNull(it.course.id), userId) }
        val marks = grades.grades(userId, courseId?.toString()).filter { date(it.date) in start..end }
        val records = attendance.studentRecords(userId, courseId, start, end)
        val allGpa = grades.gpa(userId, courseId)
        val months = generateSequence(YearMonth.from(start)) { it.plusMonths(1) }.takeWhile { it <= YearMonth.from(end) }.map { month ->
            val scores = marks.filter { YearMonth.from(date(it.date)) == month }
            val sessions = records.filter { YearMonth.from(LocalDate.parse(it.date.take(10))) == month }
            MonthlyDataDto(month.toString(), average(scores.map { it.scorePercentage }),
                if (sessions.isEmpty()) 0.0 else rounded(sessions.count { it.status in setOf("present", "late") } * 100.0 / sessions.size),
                enrollments.count { it.status == CourseEnrollmentStatus.COMPLETED && it.completedAt?.let { time ->
                    time.atZone(zone).toLocalDate() in start..end && YearMonth.from(time.atZone(zone)) == month
                } == true }, scores.size, sessions.size)
        }.toList()
        val courses = enrollments.map { enrollment ->
            val scores = marks.filter { it.courseId == enrollment.course.id.toString() }
            CourseCompletionDto(enrollment.course.title.orEmpty(), progress[enrollment.course.id]?.progress?.toDouble() ?: 0.0,
                average(scores.map { it.scorePercentage }), 1, enrollment.course.id.toString(), scores.size)
        }
        return StudentReportDto(start, end, AcademicStatsDto(
            // GPA and academic credits are cumulative; only scores and monthly activity use the date range.
            gpa = allGpa.cumulativeGPA, totalCredits = enrollments.sumOf { it.credits.coerceAtLeast(it.course.subject?.credits ?: 0) },
            completedCredits = allGpa.completedCredits,
            coursesCompleted = progress.values.count { it.status == "completed" },
            coursesActive = progress.values.count { it.status == "active" }, avgScore = average(marks.map { it.scorePercentage }),
        ), marks.size, allGpa.totalCredits, months, courses)
    }

    companion object {
        private val zone = ZoneId.of("Asia/Tashkent")
        private fun date(value: String) = Instant.parse(value).atZone(zone).toLocalDate()
        private fun rounded(value: Double) = round(value * 100) / 100
        private fun average(values: List<Double>) = if (values.isEmpty()) 0.0 else rounded(values.average())
    }
}
