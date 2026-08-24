package uz.scorm.lms.app.v1.academicresult.dto

import java.time.Instant
import java.time.LocalDate

data class RatingSystemDto(
    val id: Long,
    val name: String,
    val shortName: String,
    val minScore: Int,
    val maxScore: Int,
    val passScore: Int,
    val active: Boolean,
)

data class SaveRatingSystemRequest(
    val name: String,
    val shortName: String,
    val minScore: Int = 0,
    val maxScore: Int = 100,
    val passScore: Int = 60,
    val active: Boolean = true,
)

data class AcademicStatementRowDto(
    val id: Long,
    val topic: String,
    val subjectId: Long?,
    val subject: String,
    val group: String,
    val academicYear: String,
    val semester: Int?,
    val controlType: String,
    val statement: String,
    val status: String,
    val finalStatement: Boolean,
    val addedDate: LocalDate,
    val resultCount: Int,
    val passedCount: Int,
    val averageScore: Double?,
)

data class StudentAcademicResultDto(
    val enrollmentId: Long,
    val studentId: Long,
    val fullName: String,
    val studentNumber: String,
    val group: String,
    val program: String,
    val courseNumber: Int,
    val academicYear: String,
    val semester: Int,
    val courseId: Long,
    val subjectId: Long?,
    val subject: String,
    val credits: Int,
    val assessed: Boolean,
    val interimScore: Double?,
    val finalScore: Double?,
    val totalScore: Double?,
    val mark: Int?,
    val letterGrade: String?,
    val gpaPoint: Double?,
    val passed: Boolean,
    val hemisStatus: String,
    val assessedAt: Instant?,
)

data class StudentGpaDto(
    val studentId: Long,
    val fullName: String,
    val studentNumber: String,
    val group: String,
    val program: String,
    val semester: Int,
    val totalCredits: Int,
    val assessedSubjects: Int,
    val gpa: Double,
)

data class TestResultRowDto(
    val attemptId: Long,
    val studentId: Long,
    val fullName: String,
    val group: String,
    val academicYear: String,
    val semester: Int,
    val subject: String,
    val methodology: String,
    val totalQuestions: Int,
    val correct: Int,
    val incorrect: Int,
    val attempts: Int,
    val percentage: Double,
    val mark: Int,
    val passed: Boolean,
    val testDate: Instant,
)

data class SubjectReportRowDto(
    val courseId: Long,
    val academicYears: List<String>,
    val program: String,
    val semesters: List<Int>,
    val subject: String,
    val contentName: String,
    val teacher: String,
    val groups: List<String>,
    val studentCount: Int,
    val modules: Int,
    val totalContent: Int,
    val approvedContent: Int,
    val uncheckedContent: Int,
    val resources: Int,
    val assignments: Int,
    val videos: Int,
    val tests: Int,
)

data class StudentTaskReportRowDto(
    val submissionId: Long,
    val status: String,
    val academicYear: String,
    val semester: Int,
    val statement: String,
    val subject: String,
    val assignment: String,
    val student: String,
    val group: String,
    val submittedAt: Instant,
    val gradedAt: Instant?,
    val turnaroundDays: Long,
    val score: Int?,
)

data class ProgramAppropriationDto(
    val program: String,
    val studentCount: Int,
    val assessedCount: Int,
    val averageScore: Double,
    val mark5Count: Int,
    val mark4Count: Int,
    val mark3Count: Int,
    val mark2Count: Int,
    val mark5Percent: Double,
    val mark4Percent: Double,
    val mark3Percent: Double,
    val mark2Percent: Double,
)

data class SubjectGradeDistributionDto(
    val subject: String,
    val program: String,
    val semester: Int,
    val mark2: Int,
    val mark3: Int,
    val mark4: Int,
    val mark5: Int,
    val students: Int,
    val averageScore: Double,
)

data class FailedStudentSummaryDto(
    val courseNumber: Int,
    val semester: Int,
    val failedEnrollments: Int,
    val students: Int,
)

data class DegreeGenderStatsDto(
    val degree: String,
    val male: Int,
    val female: Int,
    val total: Int,
    val byCourse: Map<Int, Int>,
)

data class AcademicDashboardDto(
    val students: List<DegreeGenderStatsDto>,
    val totalStudents: Int,
    val totalTeachers: Int,
    val activeAcademicYears: List<String>,
)
