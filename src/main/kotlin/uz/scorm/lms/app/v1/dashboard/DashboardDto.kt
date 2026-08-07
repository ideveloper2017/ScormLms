package uz.scorm.lms.app.v1.dashboard

import java.time.Instant

data class AdminSystemStatsDto(
    val totalUsers: Long,
    val activeUsers: Long,
    val totalStudents: Long,
    val totalTeachers: Long,
    val totalCourses: Long,
    val activeCourses: Long,
    val totalExams: Long,
    val activeExams: Long,
    val scormPackages: Long,
    val systemUptime: Long,
    val serverLoad: Double,
    val contentCompletion: Double,
    val avgAchievement: Double,
    val passRate: Double,
)

data class AdminActivityDto(
    val id: Long,
    val username: String,
    val action: String,
    val details: String?,
    val timestamp: Instant,
    val type: String,
)

data class AdminMonthlyMetricDto(
    val name: String,
    val users: Long,
    val courses: Long,
    val exams: Long,
)

data class AdminTopInstructorDto(
    val id: String,
    val fullName: String,
    val departmentName: String?,
    val totalStudents: Long,
    val totalCourses: Long,
    val rating: Double,
)

data class InstructorStatsDto(
    val totalStudents: Long,
    val activeCourses: Long,
    val completedCourses: Long,
    val pendingAssignments: Long,
    val newSubmissions: Long,
    val avgRating: Double,
    val todayLessons: Long,
    val unreadMessages: Long,
)

data class InstructorCourseDto(
    val id: String,
    val title: String,
    val description: String?,
    val students: Long,
    val progress: Double,
    val status: String,
    val startDate: String,
    val endDate: String,
    val avgGrade: Double,
    val completionRate: Double,
)

data class InstructorSubmissionDto(
    val id: String,
    val studentName: String,
    val assignmentTitle: String,
    val courseTitle: String,
    val submittedAt: Instant,
    val status: String,
)

data class InstructorLessonDto(
    val id: String,
    val time: String,
    val subject: String,
    val room: String,
    val group: String,
    val students: Long,
    val type: String,
)

data class InstructorWeeklyActivityDto(
    val day: String,
    val submissions: Long,
    val tests: Long,
)

data class TeacherProfileDto(
    val id: String,
    val fullName: String,
    val username: String,
    val email: String?,
    val phone: String?,
    val position: String?,
    val academicDegree: String?,
    val academicRank: String?,
    val departmentName: String?,
    val photoUrl: String?,
)

data class TeacherDashboardStatsDto(
    val activeCourses: Long,
    val totalStudents: Long,
    val pendingSubmissions: Long,
    val todayLessons: Long,
    val avgTestScore: Double,
    val newSubmissions: Long,
    val unreadMessages: Long,
)

data class TeacherStudentDto(
    val id: String,
    val fullName: String,
    val studentNumber: String,
    val groupName: String?,
    val attendance: Double,
    val avgScore: Double,
    val status: String,
)

data class TeacherGradebookEntryDto(
    val studentId: String,
    val studentName: String,
    val assignments: Double,
    val tests: Double,
    val attendance: Double,
    val finalGrade: Double,
    val letterGrade: String,
)

data class TeacherTodayScheduleDto(
    val id: String,
    val startTime: String,
    val endTime: String,
    val subject: String,
    val group: String,
    val room: String,
    val type: String,
    val students: Long,
)

data class MonitoringStatsDto(
    val cpuUsage: Double,
    val memoryUsage: Double,
    val activeUsers: Long,
    val totalRequests: Long,
    val errorRate: Double,
    val uptime: Long,
    val avgResponseTime: Double,
    val dbConnections: Long,
)

data class MonitoringAlertDto(
    val id: String,
    val type: String,
    val message: String,
    val timestamp: Instant,
    val resolved: Boolean,
)
