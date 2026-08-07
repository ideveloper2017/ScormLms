package uz.scorm.lms.app.v1.exam.dto

import uz.scorm.lms.app.v1.exam.model.AttendanceStatus
import java.time.Instant

data class RecordAttendanceRequest(
    val attendanceStatus: AttendanceStatus,
    val arrivalTime: Instant? = null,
    val departureTime: Instant? = null,
    val specialConditions: String? = null,
    val proctorNotes: String? = null,
)

data class BulkRecordAttendanceRequest(
    val enrollmentIds: List<Long>,
    val attendanceStatus: AttendanceStatus,
    val arrivalTime: Instant? = null,
    val specialConditions: String? = null,
)

data class VerifyAttendanceRequest(
    val verificationTime: Instant? = null,
)

data class TeacherAttendanceSheetDto(
    val examSessionId: String,
    val examTitle: String,
    val examDate: String,
    val examTime: String,
    val location: String,
    val totalEnrolled: Int,
    val attendanceRecords: List<AttendanceRecordDto>,
)

data class AttendanceRecordDto(
    val id: String,
    val enrollmentId: String,
    val studentId: String,
    val studentName: String,
    val studentEmail: String,
    val status: String,
    val arrivalTime: Instant?,
    val departureTime: Instant?,
    val specialConditions: String?,
    val proctorNotes: String?,
    val verifiedBy: String?,
    val verificationTime: Instant?,
    val onsiteAttendanceRequired: Boolean,
)

data class StudentAttendanceDto(
    val id: String,
    val examSessionId: String,
    val examTitle: String,
    val examDate: String,
    val location: String,
    val attendanceStatus: String,
    val arrivalTime: Instant?,
    val departureTime: Instant?,
    val specialConditions: String?,
)
