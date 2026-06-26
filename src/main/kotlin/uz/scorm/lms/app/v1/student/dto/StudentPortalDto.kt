package uz.scorm.lms.app.v1.student.dto

import uz.scorm.lms.app.v1.student.model.*
import java.math.BigDecimal
import java.time.LocalDate
import java.time.Instant

// ─── Profile ─────────────────────────────────────────────────────────────────

data class StudentProfileResponse(
    val id: Long?,
    val pinfl: String,
    val lastName: String,
    val firstName: String,
    val middleName: String?,
    val fullName: String,
    val birthDate: LocalDate?,
    val gender: Gender?,
    val citizenship: Citizenship?,
    val photoUrl: String?,
    val phoneNumber: String?,
    val email: String?,
    val permanentRegion: String?,
    val permanentDistrict: String?,
    val permanentAddress: String?,
    val currentRegion: String?,
    val currentDistrict: String?,
    val currentAddress: String?,
    val studentNumber: String,
    val degreeLevel: DegreeLevel?,
    val educationForm: EducationForm?,
    val educationLanguage: String?,
    val courseNumber: Int?,
    val groupId: Long?,
    val academicYear: String?,
    val studentStatus: StudentStatus?,
    val paymentType: PaymentType?,
    val username: String,
    val lastLoginAt: Instant?,
)

data class UpdateStudentProfileRequest(
    val phoneNumber: String? = null,
    val email: String? = null,
    val currentRegion: String? = null,
    val currentDistrict: String? = null,
    val currentAddress: String? = null,
    val photoUrl: String? = null,
)

// ─── Dashboard ───────────────────────────────────────────────────────────────

data class StudentDashboardStatsDto(
    val activeCourses: Int = 0,
    val completedCourses: Int = 0,
    val pendingAssignments: Int = 0,
    val upcomingTests: Int = 0,
    val averageGrade: Double = 0.0,
    val attendancePercentage: Double = 0.0,
    val gpa: Double = 0.0,
    val totalCredits: Int = 0,
    val learningStreak: Int = 0,
)

data class StudentActivityItemDto(
    val id: String,
    val type: String,       // "course" | "assignment" | "test" | "grade"
    val title: String,
    val description: String,
    val timestamp: String,  // ISO-8601
)

data class StudentNotificationSummaryDto(
    val unreadCount: Int = 0,
    val urgent: Int = 0,
    val recent: List<StudentNotificationDto> = emptyList(),
)

// ─── Course ──────────────────────────────────────────────────────────────────

data class StudentCourseDto(
    val id: String,
    val title: String,
    val description: String = "",
    val instructor: String = "",
    val progress: Int = 0,
    val grade: String? = null,
    val status: String = "active",
    val credits: Int = 0,
    val imageUrl: String? = null,
)

// ─── Schedule ────────────────────────────────────────────────────────────────

data class StudentScheduleItemDto(
    val id: String,
    val courseId: String,
    val courseName: String,
    val instructor: String = "",
    val room: String = "",
    val building: String? = null,
    val dayOfWeek: Int,      // 0=Sunday
    val startTime: String,   // "09:00"
    val endTime: String,     // "10:30"
    val type: String = "lecture",
    val isOnline: Boolean = false,
    val meetingLink: String? = null,
)

// ─── Attendance ──────────────────────────────────────────────────────────────

data class StudentAttendanceRecordDto(
    val id: String,
    val courseId: String,
    val courseName: String,
    val date: String,       // ISO date "2024-01-15"
    val status: String,     // "present" | "absent" | "late" | "excused"
    val reason: String? = null,
    val checkInTime: String? = null,
    val checkOutTime: String? = null,
)

data class StudentCourseAttendanceDto(
    val courseId: String,
    val courseName: String,
    val totalClasses: Int,
    val attended: Int,
    val percentage: Double,
)

data class StudentAttendanceStatsDto(
    val totalClasses: Int = 0,
    val attended: Int = 0,
    val absent: Int = 0,
    val late: Int = 0,
    val excused: Int = 0,
    val attendancePercentage: Double = 0.0,
    val byCourse: List<StudentCourseAttendanceDto> = emptyList(),
)

data class StudentAttendanceSummaryDto(
    val totalClasses: Int = 0,
    val attended: Int = 0,
    val absent: Int = 0,
    val late: Int = 0,
    val excused: Int = 0,
    val attendancePercentage: Double = 0.0,
    val byCourse: List<StudentCourseAttendanceDto> = emptyList(),
    val recentRecords: List<StudentAttendanceRecordDto> = emptyList(),
)

data class AttendancePercentageDto(val percentage: Double = 0.0)

// ─── Grade ───────────────────────────────────────────────────────────────────

data class StudentGradeDto(
    val id: String,
    val courseId: String,
    val courseName: String,
    val assignmentId: String? = null,
    val assignmentName: String? = null,
    val testId: String? = null,
    val testName: String? = null,
    val gradeLetter: String = "N/A",
    val gradePoints: Double = 0.0,
    val scorePercentage: Double = 0.0,
    val maxScore: Double = 100.0,
    val earnedScore: Double = 0.0,
    val date: String,        // ISO date
    val feedback: String? = null,
)

data class StudentGradeDistributionDto(
    val A: Int = 0,
    val B: Int = 0,
    val C: Int = 0,
    val D: Int = 0,
    val F: Int = 0,
)

data class StudentGradeSummaryDto(
    val totalGrades: Int = 0,
    val averageScore: Double = 0.0,
    val highestScore: Double = 0.0,
    val lowestScore: Double = 0.0,
    val distribution: StudentGradeDistributionDto = StudentGradeDistributionDto(),
    val recentGrades: List<StudentGradeDto> = emptyList(),
)

data class StudentGPADto(
    val currentGPA: Double = 0.0,
    val cumulativeGPA: Double = 0.0,
    val totalCredits: Int = 0,
    val completedCredits: Int = 0,
    val gradePoints: Double = 0.0,
    val semesterGPA: Double? = null,
)

// ─── Transcript ──────────────────────────────────────────────────────────────

data class TranscriptCourseDto(
    val courseId: String,
    val courseCode: String,
    val courseName: String,
    val credits: Int,
    val gradeLetter: String,
    val gradePoints: Double,
    val instructor: String,
)

data class TranscriptSemesterDto(
    val semester: String,
    val academicYear: String,
    val courses: List<TranscriptCourseDto> = emptyList(),
    val semesterGPA: Double = 0.0,
    val creditsEarned: Int = 0,
)

data class StudentTranscriptDto(
    val studentId: String,
    val studentName: String,
    val academicYear: String = "2024-2025",
    val semesters: List<TranscriptSemesterDto> = emptyList(),
    val cumulativeGPA: Double = 0.0,
    val totalCredits: Int = 0,
    val degreeProgress: Double = 0.0,
)

// ─── Assignment ──────────────────────────────────────────────────────────────

data class StudentAssignmentDto(
    val id: String,
    val title: String,
    val description: String = "",
    val courseId: String = "",
    val courseName: String = "",
    val dueDate: String,      // ISO date
    val status: String = "pending",
    val priority: String = "medium",
    val maxScore: Int = 100,
    val submittedAt: String? = null,
    val grade: Int? = null,
)

// ─── Test (for dashboard) ────────────────────────────────────────────────────

data class StudentTestDto(
    val id: String,
    val title: String,
    val courseId: String,
    val courseName: String,
    val date: String,
    val startTime: String = "09:00",
    val endTime: String = "11:00",
    val duration: Int = 120,
    val questionCount: Int = 0,
    val totalPoints: Int = 100,
    val proctoring: Boolean = false,
    val status: String = "upcoming",
    val score: Int? = null,
)

// ─── Exam (for /exams endpoint) ──────────────────────────────────────────────

data class StudentExamDto(
    val id: String,
    val title: String,
    val course: String,
    val courseId: String,
    val date: String,
    val duration: Int,
    val totalQuestions: Int = 0,
    val maxScore: Int = 100,
    val status: String = "upcoming",
    val type: String = "test",
    val participants: Int? = null,
    val avgScore: Double? = null,
    val passRate: Double? = null,
)

data class StudentExamResultDto(
    val id: String,
    val examId: String,
    val examTitle: String,
    val course: String,
    val date: String,
    val score: Int,
    val maxScore: Int,
    val percentage: Double,
    val passed: Boolean,
    val duration: Int,
    val rank: Int? = null,
)

data class StudentExamStatsDto(
    val total: Int = 0,
    val upcoming: Int = 0,
    val completed: Int = 0,
    val avgScore: Double = 0.0,
    val passRate: Double = 0.0,
)

// ─── Notification ────────────────────────────────────────────────────────────

data class StudentNotificationDto(
    val id: String,
    val title: String,
    val message: String,
    val createdAt: String,
    val read: Boolean = false,
    val type: String = "info",
)

data class UnreadCountDto(val count: Int = 0)

// ─── Reports ─────────────────────────────────────────────────────────────────

data class ReportSummaryDto(
    val id: String,
    val title: String,
    val type: String,
    val generatedAt: String,
    val period: String,
    val status: String = "ready",
    val downloadUrl: String? = null,
)

data class AcademicStatsDto(
    val gpa: Double = 0.0,
    val totalCredits: Int = 0,
    val completedCredits: Int = 0,
    val coursesCompleted: Int = 0,
    val coursesActive: Int = 0,
    val avgScore: Double = 0.0,
)

data class MonthlyDataDto(
    val month: String,
    val avgScore: Double = 0.0,
    val attendance: Double = 0.0,
    val completedCourses: Int = 0,
)

data class CourseCompletionDto(
    val courseTitle: String,
    val completion: Double = 0.0,
    val avgScore: Double = 0.0,
    val students: Int = 0,
)

// ─── Resource ────────────────────────────────────────────────────────────────

data class StudentResourceDto(
    val id: String,
    val title: String,
    val type: String,        // "video" | "document" | "link"
    val url: String,
    val courseId: String? = null,
    val courseName: String? = null,
    val uploadedAt: String,
    val size: Long? = null,
)

data class ResourceCategoryDto(
    val id: String,
    val name: String,
    val count: Int = 0,
)
