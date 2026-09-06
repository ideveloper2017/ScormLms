package uz.scorm.lms.app.v1.academicresult.service

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.academicresult.dto.AcademicDashboardDto
import uz.scorm.lms.app.v1.academicresult.dto.AcademicStatementRowDto
import uz.scorm.lms.app.v1.academicresult.dto.DegreeGenderStatsDto
import uz.scorm.lms.app.v1.academicresult.dto.FailedStudentSummaryDto
import uz.scorm.lms.app.v1.academicresult.dto.ProgramAppropriationDto
import uz.scorm.lms.app.v1.academicresult.dto.StudentAcademicResultDto
import uz.scorm.lms.app.v1.academicresult.dto.StudentGpaDto
import uz.scorm.lms.app.v1.academicresult.dto.StudentTaskReportRowDto
import uz.scorm.lms.app.v1.academicresult.dto.SubjectGradeDistributionDto
import uz.scorm.lms.app.v1.academicresult.dto.SubjectReportRowDto
import uz.scorm.lms.app.v1.academicresult.dto.TestResultRowDto
import uz.scorm.lms.app.v1.assignment.model.SubmissionStatus
import uz.scorm.lms.app.v1.assignment.repository.AssignmentSubmissionRepository
import uz.scorm.lms.app.v1.assignment.repository.CourseAssignmentRepository
import uz.scorm.lms.app.v1.courses.model.ContentReviewStatus
import uz.scorm.lms.app.v1.courses.model.CourseContentType
import uz.scorm.lms.app.v1.courses.repository.CourseContentRepository
import uz.scorm.lms.app.v1.courses.repository.CourseEnrollmentRepository
import uz.scorm.lms.app.v1.courses.repository.CourseModuleRepository
import uz.scorm.lms.app.v1.courses.repository.CourseRepository
import uz.scorm.lms.app.v1.exam.model.ExamSessionStatus
import uz.scorm.lms.app.v1.exam.repository.ExamResultRepository
import uz.scorm.lms.app.v1.exam.repository.ExamSessionRepository
import uz.scorm.lms.app.v1.group.repository.GroupRepository
import uz.scorm.lms.app.v1.program.repository.ProgramRepository
import uz.scorm.lms.app.v1.quiz.model.QuizAttemptStatus
import uz.scorm.lms.app.v1.quiz.repository.CourseQuizRepository
import uz.scorm.lms.app.v1.quiz.repository.QuizAnswerRepository
import uz.scorm.lms.app.v1.quiz.repository.QuizAttemptRepository
import uz.scorm.lms.app.v1.student.model.DegreeLevel
import uz.scorm.lms.app.v1.student.model.Gender
import uz.scorm.lms.app.v1.student.repository.StudentRepository
import uz.scorm.lms.app.v1.user.repository.UserRepository
import java.time.Instant
import java.time.ZoneId
import java.time.temporal.ChronoUnit
import kotlin.math.round

@Service
class AcademicAnalyticsService(
    private val enrollments: CourseEnrollmentRepository,
    private val examSessions: ExamSessionRepository,
    private val examResults: ExamResultRepository,
    private val quizAttempts: QuizAttemptRepository,
    private val quizAnswers: QuizAnswerRepository,
    private val courses: CourseRepository,
    private val modules: CourseModuleRepository,
    private val contents: CourseContentRepository,
    private val assignments: CourseAssignmentRepository,
    private val quizzes: CourseQuizRepository,
    private val submissions: AssignmentSubmissionRepository,
    private val students: StudentRepository,
    private val programs: ProgramRepository,
    private val groups: GroupRepository,
    private val users: UserRepository,
) {
    private val zone = ZoneId.of("Asia/Tashkent")

    @Transactional(readOnly = true)
    fun statements(finalStatement: Boolean? = null): List<AcademicStatementRowDto> {
        val enrollmentRows = enrollments.findAllByDeletedFalseOrderByAcademicYearDescSemesterDescEnrolledAtDesc()
        val byCourse = enrollmentRows.groupBy { requireNotNull(it.course.id) }
        val resultsBySession = examResults.findAllByDeletedFalseOrderByGradingDateDesc()
            .groupBy { requireNotNull(it.examSession.id) }

        return examSessions.findAllByDeletedFalseOrderByExamDateDesc().asSequence()
            .map { session ->
                val isFinal = session.status == ExamSessionStatus.COMPLETED
                val course = session.course
                val courseEnrollments = byCourse[requireNotNull(course.id)].orEmpty()
                val results = resultsBySession[requireNotNull(session.id)].orEmpty()
                AcademicStatementRowDto(
                    id = requireNotNull(session.id),
                    topic = session.title,
                    subjectId = course.subject?.id,
                    subject = course.subject?.name ?: course.subjectName ?: course.title.orEmpty(),
                    group = course.groupName ?: course.subjectGroup?.name.orEmpty(),
                    academicYear = courseEnrollments.firstOrNull()?.academicYear.orEmpty(),
                    semester = courseEnrollments.firstOrNull()?.semester ?: session.semesterId?.toInt(),
                    controlType = if (isFinal) "YAKUNIY" else "ORALIQ",
                    statement = if (isFinal) "Yakuniy qaydnoma" else "1-qaydnoma",
                    status = session.status.name,
                    finalStatement = isFinal,
                    addedDate = (session.createdAt?.atZone(zone)?.toLocalDate() ?: session.examDate),
                    resultCount = results.size,
                    passedCount = results.count { it.passed },
                    averageScore = results.map { it.percentage }.averageOrNull()?.let(::twoDecimals),
                )
            }
            .filter { finalStatement == null || it.finalStatement == finalStatement }
            .toList()
    }

    @Transactional(readOnly = true)
    fun studentResults(): List<StudentAcademicResultDto> {
        val resultByEnrollment = examResults.findAllByDeletedFalseOrderByGradingDateDesc()
            .groupBy { requireNotNull(it.enrollment.id) }
            .mapValues { (_, rows) -> rows.maxByOrNull { it.gradingDate } }
        val attemptsByEnrollment = quizAttempts.findAllByDeletedFalseOrderByStartedAtDesc()
            .filter { it.status != QuizAttemptStatus.IN_PROGRESS }
            .groupBy { requireNotNull(it.enrollment.id) }
        val programNames = programs.findAll().filter { !it.deleted }.associate { requireNotNull(it.id) to it.name }
        val groupNames = groups.findAll().filter { !it.deleted }.associate { requireNotNull(it.id) to it.name }

        return enrollments.findAllByDeletedFalseOrderByAcademicYearDescSemesterDescEnrolledAtDesc().map { enrollment ->
            val enrollmentId = requireNotNull(enrollment.id)
            val exam = resultByEnrollment[enrollmentId]
            val attempts = attemptsByEnrollment[enrollmentId].orEmpty()
            val interim = attempts.map { it.percentage }.averageOrNull()?.let(::twoDecimals)
            val final = exam?.percentage?.let(::twoDecimals)
            val total = GradeCalculation.total(interim, final)
            val assessed = total != null
            val student = enrollment.student
            val course = enrollment.course
            val mark = total?.let(::mark)
            val lastQuiz = attempts.mapNotNull { it.submittedAt ?: it.startedAt }.maxOrNull()
            val assessedAt = listOfNotNull(exam?.gradingDate, lastQuiz).maxOrNull()
            StudentAcademicResultDto(
                enrollmentId = enrollmentId,
                studentId = requireNotNull(student.id),
                fullName = student.fullName,
                studentNumber = student.studentNumber,
                group = student.groupId?.let(groupNames::get) ?: course.groupName.orEmpty(),
                program = student.programId?.let(programNames::get) ?: course.subject?.program?.name.orEmpty(),
                courseNumber = student.courseNumber,
                academicYear = enrollment.academicYear,
                semester = enrollment.semester,
                courseId = requireNotNull(course.id),
                subjectId = course.subject?.id,
                subject = course.subject?.name ?: course.subjectName ?: course.title.orEmpty(),
                credits = enrollment.credits.coerceAtLeast(course.subject?.credits ?: 0),
                assessed = assessed,
                interimScore = interim,
                finalScore = final,
                totalScore = total,
                mark = mark,
                letterGrade = total?.let(::letterGrade),
                gpaPoint = total?.let(::gpaPoint),
                passed = assessed && requireNotNull(total) >= 60.0,
                hemisStatus = when {
                    student.hemisId == null -> "NOT_LINKED"
                    student.hemisSyncedAt == null -> "PENDING"
                    else -> "SYNCED"
                },
                assessedAt = assessedAt,
            )
        }.sortedWith(compareBy<StudentAcademicResultDto> { it.fullName }.thenBy { it.semester }.thenBy { it.subject })
    }

    @Transactional(readOnly = true)
    fun gpa(): List<StudentGpaDto> = studentResults().filter { it.assessed }.groupBy { it.studentId }.map { (_, rows) ->
        val first = rows.first()
        val weighted = rows.sumOf { (it.gpaPoint ?: 0.0) * it.credits.coerceAtLeast(1) }
        val credits = rows.sumOf { it.credits.coerceAtLeast(1) }
        StudentGpaDto(
            studentId = first.studentId,
            fullName = first.fullName,
            studentNumber = first.studentNumber,
            group = first.group,
            program = first.program,
            semester = rows.maxOf { it.semester },
            totalCredits = credits,
            assessedSubjects = rows.size,
            gpa = if (credits == 0) 0.0 else twoDecimals(weighted / credits),
        )
    }.sortedWith(compareByDescending<StudentGpaDto> { it.gpa }.thenBy { it.fullName })

    @Transactional(readOnly = true)
    fun testResults(): List<TestResultRowDto> {
        val groupNames = groups.findAll().filter { !it.deleted }.associate { requireNotNull(it.id) to it.name }
        return quizAttempts.findAllByDeletedFalseOrderByStartedAtDesc()
            .filter { it.status != QuizAttemptStatus.IN_PROGRESS }
            .groupBy { requireNotNull(it.quiz.id) to requireNotNull(it.enrollment.id) }
            .map { (_, attempts) ->
                val latest = attempts.maxBy { it.submittedAt ?: it.startedAt }
                val answers = quizAnswers.findAllByAttemptIdAndDeletedFalseOrderByIdAsc(requireNotNull(latest.id))
                val enrollment = latest.enrollment
                val student = enrollment.student
                val course = latest.quiz.course
                TestResultRowDto(
                    attemptId = requireNotNull(latest.id),
                    studentId = requireNotNull(student.id),
                    fullName = student.fullName,
                    group = student.groupId?.let(groupNames::get) ?: course.groupName.orEmpty(),
                    academicYear = enrollment.academicYear,
                    semester = enrollment.semester,
                    subject = course.subject?.name ?: course.subjectName ?: course.title.orEmpty(),
                    methodology = latest.quiz.title,
                    totalQuestions = answers.size,
                    correct = answers.count { it.correct },
                    incorrect = answers.count { !it.correct },
                    attempts = attempts.size,
                    percentage = twoDecimals(latest.percentage),
                    mark = mark(latest.percentage),
                    passed = latest.passed,
                    testDate = latest.submittedAt ?: latest.startedAt,
                )
            }
            .sortedByDescending { it.testDate }
    }

    @Transactional(readOnly = true)
    fun subjectReports(): List<SubjectReportRowDto> {
        val courseRows = courses.findAllByDeletedFalseOrderByCreatedAtDesc()
        val ids = courseRows.mapNotNull { it.id }
        if (ids.isEmpty()) return emptyList()
        val enrollmentRows = enrollments.findAllByDeletedFalseOrderByAcademicYearDescSemesterDescEnrolledAtDesc().groupBy { requireNotNull(it.course.id) }
        val moduleRows = modules.findAllByCourseIdInAndDeletedFalseOrderByCourseIdAscPositionAsc(ids).groupBy { requireNotNull(it.course.id) }
        val contentRows = contents.findAllByModuleCourseIdInAndDeletedFalseOrderByModuleCourseIdAscModulePositionAscPositionAsc(ids).groupBy { requireNotNull(it.module.course.id) }
        val assignmentRows = assignments.findAllByDeletedFalseOrderByDueAtDesc().groupBy { requireNotNull(it.course.id) }
        val quizRows = quizzes.findAllByDeletedFalseOrderByOpensAtDesc().groupBy { requireNotNull(it.course.id) }
        val groupNames = groups.findAll().filter { !it.deleted }.associate { requireNotNull(it.id) to it.name }
        val userNames = users.findAll().filter { !it.deleted }.associate { requireNotNull(it.id) to (it.fullName ?: it.username) }

        return courseRows.map { course ->
            val id = requireNotNull(course.id)
            val courseEnrollments = enrollmentRows[id].orEmpty()
            val courseModules = moduleRows[id].orEmpty()
            val courseContents = contentRows[id].orEmpty()
            val approved = courseContents.count { it.reviewStatus == ContentReviewStatus.APPROVED.name }
            val rowGroups = buildSet {
                course.groupName?.takeIf(String::isNotBlank)?.let(::add)
                courseEnrollments.mapNotNullTo(this) { it.student.groupId?.let(groupNames::get) }
            }.sorted()
            SubjectReportRowDto(
                courseId = id,
                academicYears = courseEnrollments.map { it.academicYear }.filter(String::isNotBlank).distinct().sortedDescending(),
                program = course.subject?.program?.name.orEmpty(),
                semesters = courseEnrollments.map { it.semester }.distinct().sorted(),
                subject = course.subject?.name ?: course.subjectName ?: course.title.orEmpty(),
                contentName = courseModules.joinToString(", ") { it.title }.ifBlank { course.title.orEmpty() },
                teacher = course.userId?.let(userNames::get).orEmpty(),
                groups = rowGroups,
                studentCount = courseEnrollments.mapNotNull { it.student.id }.distinct().size,
                modules = courseModules.size,
                totalContent = courseContents.size,
                approvedContent = approved,
                uncheckedContent = courseContents.size - approved,
                resources = courseContents.count { it.contentType != CourseContentType.VIDEO },
                assignments = assignmentRows[id].orEmpty().size,
                videos = courseContents.count { it.contentType == CourseContentType.VIDEO },
                tests = quizRows[id].orEmpty().size,
            )
        }
    }

    @Transactional(readOnly = true)
    fun studentTasks(): List<StudentTaskReportRowDto> {
        val groupNames = groups.findAll().filter { !it.deleted }.associate { requireNotNull(it.id) to it.name }
        val now = Instant.now()
        return submissions.findAllByDeletedFalseOrderBySubmittedAtDesc().map { submission ->
            val enrollment = submission.enrollment
            val student = enrollment.student
            StudentTaskReportRowDto(
                submissionId = requireNotNull(submission.id),
                status = when (submission.status) {
                    SubmissionStatus.GRADED -> "Tekshirilgan"
                    SubmissionStatus.RETURNED -> "Qaytarilgan"
                    SubmissionStatus.SUBMITTED -> "Tekshirilmagan"
                },
                academicYear = enrollment.academicYear,
                semester = enrollment.semester,
                statement = "1-qaydnoma",
                subject = submission.assignment.course.subject?.name
                    ?: submission.assignment.course.subjectName
                    ?: submission.assignment.course.title.orEmpty(),
                assignment = submission.assignment.title,
                student = student.fullName,
                group = student.groupId?.let(groupNames::get) ?: submission.assignment.course.groupName.orEmpty(),
                submittedAt = submission.submittedAt,
                gradedAt = submission.gradedAt,
                turnaroundDays = ChronoUnit.DAYS.between(submission.submittedAt, submission.gradedAt ?: now).coerceAtLeast(0),
                score = submission.score,
            )
        }
    }

    @Transactional(readOnly = true)
    fun appropriation(): List<ProgramAppropriationDto> = studentResults().groupBy { it.program.ifBlank { "Biriktirilmagan" } }.map { (program, rows) ->
        val assessed = rows.filter { it.assessed }
        val count = assessed.size
        fun markCount(value: Int) = assessed.count { it.mark == value }
        fun percent(value: Int) = if (count == 0) 0.0 else twoDecimals(value.toDouble() * 100 / count)
        val m5 = markCount(5); val m4 = markCount(4); val m3 = markCount(3); val m2 = markCount(2)
        ProgramAppropriationDto(
            program = program,
            studentCount = rows.map { it.studentId }.distinct().size,
            assessedCount = count,
            averageScore = assessed.mapNotNull { it.totalScore }.averageOrNull()?.let(::twoDecimals) ?: 0.0,
            mark5Count = m5, mark4Count = m4, mark3Count = m3, mark2Count = m2,
            mark5Percent = percent(m5), mark4Percent = percent(m4), mark3Percent = percent(m3), mark2Percent = percent(m2),
        )
    }.sortedBy { it.program }

    @Transactional(readOnly = true)
    fun gradeDistribution(): List<SubjectGradeDistributionDto> = studentResults().filter { it.assessed }
        .groupBy { Triple(it.subject, it.program, it.semester) }
        .map { (key, rows) -> SubjectGradeDistributionDto(
            subject = key.first,
            program = key.second,
            semester = key.third,
            mark2 = rows.count { it.mark == 2 },
            mark3 = rows.count { it.mark == 3 },
            mark4 = rows.count { it.mark == 4 },
            mark5 = rows.count { it.mark == 5 },
            students = rows.map { it.studentId }.distinct().size,
            averageScore = rows.mapNotNull { it.totalScore }.averageOrNull()?.let(::twoDecimals) ?: 0.0,
        ) }.sortedWith(compareBy<SubjectGradeDistributionDto> { it.subject }.thenBy { it.semester })

    @Transactional(readOnly = true)
    fun failedSummary(): List<FailedStudentSummaryDto> = studentResults().filter { it.assessed && !it.passed }
        .groupBy { it.courseNumber to it.semester }
        .map { (key, rows) -> FailedStudentSummaryDto(
            courseNumber = key.first,
            semester = key.second,
            failedEnrollments = rows.size,
            students = rows.map { it.studentId }.distinct().size,
        ) }.sortedWith(compareBy<FailedStudentSummaryDto> { it.courseNumber }.thenBy { it.semester })

    @Transactional(readOnly = true)
    fun dashboard(): AcademicDashboardDto {
        val studentRows = students.findAll()
        val degreeRows = listOf(DegreeLevel.BACHELOR, DegreeLevel.MASTER).map { degree ->
            val rows = studentRows.filter { it.degreeLevel == degree }
            DegreeGenderStatsDto(
                degree = degree.name,
                male = rows.count { it.gender == Gender.MALE },
                female = rows.count { it.gender == Gender.FEMALE },
                total = rows.size,
                byCourse = rows.groupingBy { it.courseNumber }.eachCount().toSortedMap(),
            )
        }
        return AcademicDashboardDto(
            students = degreeRows,
            totalStudents = studentRows.size,
            totalTeachers = users.findAll().count { !it.deleted && it.role?.name.equals("teacher", ignoreCase = true) },
            activeAcademicYears = buildSet {
                studentRows.mapNotNullTo(this) { it.academicYear?.takeIf(String::isNotBlank) }
                enrollments.findAllByDeletedFalseOrderByAcademicYearDescSemesterDescEnrolledAtDesc()
                    .mapTo(this) { it.academicYear }
            }.filter(String::isNotBlank).sortedDescending(),
        )
    }

    private fun mark(score: Double): Int = when {
        score >= 86 -> 5
        score >= 71 -> 4
        score >= 60 -> 3
        else -> 2
    }

    private fun letterGrade(score: Double): String = when {
        score >= 90 -> "A"
        score >= 85 -> "B+"
        score >= 80 -> "B"
        score >= 75 -> "C+"
        score >= 70 -> "C"
        score >= 65 -> "D+"
        score >= 60 -> "D"
        else -> "F"
    }

    private fun gpaPoint(score: Double): Double = when {
        score >= 90 -> 4.0
        score >= 85 -> 3.7
        score >= 80 -> 3.3
        score >= 75 -> 3.0
        score >= 70 -> 2.7
        score >= 65 -> 2.3
        score >= 60 -> 2.0
        else -> 0.0
    }

    private fun twoDecimals(value: Double): Double = round(value * 100.0) / 100.0
    private fun List<Double>.averageOrNull(): Double? = if (isEmpty()) null else average()
}
