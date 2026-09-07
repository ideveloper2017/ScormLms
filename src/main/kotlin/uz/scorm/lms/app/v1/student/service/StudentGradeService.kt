package uz.scorm.lms.app.v1.student.service

import jakarta.persistence.EntityManager
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.academicresult.service.GradeCalculation
import uz.scorm.lms.app.v1.assignment.model.AssignmentSubmission
import uz.scorm.lms.app.v1.assignment.model.SubmissionStatus
import uz.scorm.lms.app.v1.courses.model.CourseEnrollment
import uz.scorm.lms.app.v1.courses.model.CourseEnrollmentStatus
import uz.scorm.lms.app.v1.exam.model.ExamResult
import uz.scorm.lms.app.v1.exam.model.ExamSessionStatus
import uz.scorm.lms.app.v1.quiz.model.QuizAttempt
import uz.scorm.lms.app.v1.quiz.model.QuizAttemptStatus
import uz.scorm.lms.app.v1.student.dto.*
import uz.scorm.lms.app.v1.student.model.StudentProfile
import uz.scorm.lms.app.v1.user.model.User
import java.time.Instant
import kotlin.math.round

@Service
@Transactional(readOnly = true)
class StudentGradeService(private val em: EntityManager, private val passingPolicy: uz.scorm.lms.app.v1.academicresult.service.AcademicPassingPolicy) {
    private data class Mark(val enrollment: CourseEnrollment, val dto: StudentGradeDto, val kind: String)

    private fun marks(userId: Long): List<Mark> {
        // Scope in the database, including lifecycle checks, before exposing results.
        val scope = "r.enrollment.student.user.id = :userId and r.deleted = false " +
            "and r.enrollment.deleted = false and r.enrollment.course.deleted = false " +
            "and r.enrollment.status in :statuses"
        fun <T : Any> rows(type: Class<T>, extra: String): List<T> = em.createQuery(
            "select r from ${type.simpleName} r where $scope $extra", type,
        ).setParameter("userId", userId)
            .setParameter("statuses", setOf(CourseEnrollmentStatus.ACTIVE, CourseEnrollmentStatus.COMPLETED))
            .resultList

        val assignments = rows(AssignmentSubmission::class.java, "and r.assignment.deleted = false")
            .filter { it.status == SubmissionStatus.GRADED && it.score != null }
            .groupBy { it.assignment.id to it.enrollment.id }
            .values.map { attempts -> attempts.maxBy { it.attemptNumber } }
            .map { row -> mark(row.enrollment, "assignment-${row.id}", "assignment", row.assignment.title,
                row.assignment.id.toString(), row.score!!.toDouble(), row.assignment.maxScore.toDouble(),
                row.gradedAt ?: row.submittedAt, row.feedback) }
        val tests = rows(QuizAttempt::class.java, "and r.quiz.deleted = false")
            .filter { it.status != QuizAttemptStatus.IN_PROGRESS }
            .map { row -> mark(row.enrollment, "test-${row.id}", "test", row.quiz.title,
                row.quiz.id.toString(), row.score.toDouble(), row.totalPoints.toDouble(),
                row.submittedAt ?: row.startedAt, null) }
        val exams = rows(ExamResult::class.java, "and r.examSession.deleted = false")
            .filter { it.examSession.status == ExamSessionStatus.COMPLETED }
            .map { row -> mark(row.enrollment, "exam-${row.id}", "exam", row.examSession.title,
                row.examSession.id.toString(), row.score.toDouble(), row.totalScore.toDouble(),
                row.gradingDate, row.comments) }
        return (assignments + tests + exams).sortedByDescending { it.dto.date }
    }

    private fun mark(enrollment: CourseEnrollment, id: String, kind: String, title: String, sourceId: String,
                     earned: Double, maximum: Double, date: Instant, feedback: String?): Mark {
        val percentage = if (maximum > 0) rounded(earned * 100 / maximum) else 0.0
        return Mark(enrollment, StudentGradeDto(
            id = id, courseId = enrollment.course.id.toString(), courseName = enrollment.course.title.orEmpty(),
            assignmentId = sourceId.takeIf { kind == "assignment" },
            assignmentName = title.takeIf { kind == "assignment" },
            testId = sourceId.takeIf { kind == "test" }, testName = title.takeIf { kind != "assignment" },
            gradeLetter = GradeCalculation.letterGrade(percentage, passingPolicy.threshold(enrollment)), gradePoints = GradeCalculation.gpaPoint(percentage, passingPolicy.threshold(enrollment)),
            scorePercentage = percentage, maxScore = maximum, earnedScore = earned, date = date.toString(), feedback = feedback,
        ), kind)
    }

    fun grades(userId: Long, courseId: String? = null, semester: String? = null, academicYear: String? = null): List<StudentGradeDto> {
        val course = courseId?.let { requireNotNull(it.toLongOrNull()?.takeIf { id -> id > 0 }) { "Kurs identifikatori noto'g'ri" } }
        val term = semester?.let { requireNotNull(it.toIntOrNull()?.takeIf { value -> value > 0 }) { "Semestr noto'g'ri" } }
        return marks(userId).filter {
            (course == null || it.enrollment.course.id == course) &&
                (term == null || it.enrollment.semester == term) &&
                (academicYear == null || it.enrollment.academicYear == academicYear)
        }.map { it.dto }
    }

    fun summary(userId: Long): StudentGradeSummaryDto {
        val grades = grades(userId)
        val scores = grades.map { it.scorePercentage }
        fun count(letter: Char) = grades.count { it.gradeLetter.first() == letter }
        return StudentGradeSummaryDto(grades.size, if (scores.isEmpty()) 0.0 else rounded(scores.average()),
            scores.maxOrNull() ?: 0.0, scores.minOrNull() ?: 0.0,
            StudentGradeDistributionDto(count('A'), count('B'), count('C'), count('D'), count('F')), grades.take(5))
    }

    private data class CourseResult(val enrollment: CourseEnrollment, val score: Double)
    private fun courseResults(userId: Long) = marks(userId).groupBy { it.enrollment.id }.values.mapNotNull { rows ->
        val tests = rows.filter { it.kind == "test" }.map { it.dto.scorePercentage }
        val exam = rows.firstOrNull { it.kind == "exam" }?.dto?.scorePercentage
        GradeCalculation.total(tests.takeIf { it.isNotEmpty() }?.average(), exam)
            ?.let { CourseResult(rows.first().enrollment, it) }
    }
    private fun credits(row: CourseResult) = row.enrollment.credits.coerceAtLeast(row.enrollment.course.subject?.credits ?: 0)
    private fun weighted(rows: List<CourseResult>): Double {
        val credits = rows.sumOf { credits(it) }
        return if (credits == 0) 0.0 else rounded(rows.sumOf { GradeCalculation.gpaPoint(it.score, passingPolicy.threshold(it.enrollment)) * credits(it) } / credits)
    }
    fun gpa(userId: Long, courseId: Long? = null): StudentGPADto {
        val rows = courseResults(userId).filter { courseId == null || it.enrollment.course.id == courseId }
        val latest = rows.maxWithOrNull(compareBy<CourseResult> { it.enrollment.academicYear }.thenBy { it.enrollment.semester })
        val current = rows.filter { it.enrollment.academicYear == latest?.enrollment?.academicYear && it.enrollment.semester == latest?.enrollment?.semester }
        return StudentGPADto(currentGPA = weighted(current), cumulativeGPA = weighted(rows),
            totalCredits = rows.sumOf { credits(it) }, completedCredits = rows.filter { passingPolicy.passed(it.enrollment, it.score) }.sumOf { credits(it) },
            gradePoints = rounded(rows.sumOf { GradeCalculation.gpaPoint(it.score, passingPolicy.threshold(it.enrollment)) * credits(it) }), semesterGPA = weighted(current))
    }

    fun enrollments(userId: Long): List<CourseEnrollment> = em.createQuery(
        "select e from CourseEnrollment e where e.student.user.id = :userId and e.deleted = false " +
            "and e.course.deleted = false and e.status in :statuses order by e.academicYear, e.semester, e.course.title",
        CourseEnrollment::class.java,
    ).setParameter("userId", userId)
        .setParameter("statuses", setOf(CourseEnrollmentStatus.ACTIVE, CourseEnrollmentStatus.COMPLETED)).resultList

    fun transcript(userId: Long, student: StudentProfile): StudentTranscriptDto {
        val results = courseResults(userId)
        val byEnrollment = results.associateBy { it.enrollment.id }
        val enrollments = enrollments(userId)
        val ownerIds = enrollments.mapNotNull { it.course.userId }.distinct()
        val owners = if (ownerIds.isEmpty()) emptyMap() else em.createQuery(
            "select u from User u where u.id in :ids", User::class.java,
        ).setParameter("ids", ownerIds).resultList.associateBy { it.id }
        val semesters = enrollments.groupBy { it.academicYear to it.semester }.map { (term, rows) ->
            val assessed = rows.mapNotNull { byEnrollment[it.id] }
            TranscriptSemesterDto(term.second.toString(), term.first, rows.map { enrollment ->
                val score = byEnrollment[enrollment.id]?.score
                TranscriptCourseDto(enrollment.course.id.toString(), "COURSE-${enrollment.course.id}",
                    enrollment.course.title.orEmpty(), enrollment.credits.coerceAtLeast(enrollment.course.subject?.credits ?: 0),
                    score?.let { GradeCalculation.letterGrade(it, passingPolicy.threshold(enrollment)) } ?: "N/A", score?.let { GradeCalculation.gpaPoint(it, passingPolicy.threshold(enrollment)) } ?: 0.0,
                    owners[enrollment.course.userId]?.let { it.fullName?.takeIf(String::isNotBlank) ?: it.username }.orEmpty(),
                    score?.let(::rounded), enrollment.status.name.lowercase())
            }, weighted(assessed), assessed.filter { passingPolicy.passed(it.enrollment, it.score) }.sumOf(::credits), assessed.sumOf(::credits))
        }
        val total = semesters.sumOf { term -> term.courses.sumOf { it.credits } }
        val earned = semesters.sumOf { it.creditsEarned }
        return StudentTranscriptDto(student.id.toString(), student.fullName, student.academicYear.orEmpty(),
            semesters, weighted(results), total, if (total == 0) 0.0 else rounded(earned * 100.0 / total),
            results.sumOf(::credits), earned)
    }

    private fun rounded(value: Double) = round(value * 100) / 100
}
