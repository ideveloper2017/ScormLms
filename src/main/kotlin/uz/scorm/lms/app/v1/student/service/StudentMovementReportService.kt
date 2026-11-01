package uz.scorm.lms.app.v1.student.service

import org.springframework.data.domain.Page
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.courses.repository.CourseEnrollmentRepository
import uz.scorm.lms.app.v1.group.repository.GroupRepository
import uz.scorm.lms.app.v1.student.dto.ReinstatementSubjectDto
import uz.scorm.lms.app.v1.student.dto.ReinstatementSubjectReportItemDto
import uz.scorm.lms.app.v1.student.dto.ReinstatementSubjectReportPageDto
import uz.scorm.lms.app.v1.student.dto.StudentMovementItemDto
import uz.scorm.lms.app.v1.student.dto.StudentMovementPageDto
import uz.scorm.lms.app.v1.student.model.StudentLifecycleEvent
import uz.scorm.lms.app.v1.student.model.StudentLifecycleEventType
import uz.scorm.lms.app.v1.student.repository.StudentLifecycleEventRepository

@Service
class StudentMovementReportService(
    private val eventRepository: StudentLifecycleEventRepository,
    private val enrollmentRepository: CourseEnrollmentRepository,
    private val groupRepository: GroupRepository,
) {
    @Transactional(readOnly = true)
    fun reinstatementSubjects(
        search: String?,
        academicYear: String?,
        page: Int,
        size: Int,
    ): ReinstatementSubjectReportPageDto {
        val events = latestEvents(StudentLifecycleEventType.REINSTATEMENT, search, academicYear, page, size)
        val studentIds = events.content.map { requireNotNull(it.student.id) }
        val subjectsByStudent = if (studentIds.isEmpty()) emptyMap() else {
            enrollmentRepository
                .findAllByStudentIdInAndDeletedFalseOrderByStudentIdAscAcademicYearAscSemesterAscEnrolledAtAsc(studentIds)
                .groupBy { requireNotNull(it.student.id) }
        }
        val groupIds = events.content.mapNotNull { it.toGroupId }.distinct()
        val groupNames = groupRepository.findAllById(groupIds).associate { requireNotNull(it.id) to it.name }

        val items = events.content.map { event ->
            val student = event.student
            val studentId = requireNotNull(student.id)
            ReinstatementSubjectReportItemDto(
                reinstatementEventId = requireNotNull(event.id),
                studentId = studentId,
                studentNumber = student.studentNumber,
                studentName = listOf(student.lastName, student.firstName, student.middleName)
                    .filterNotNull().joinToString(" "),
                studentStatus = student.studentStatus,
                programId = event.toProgram?.id,
                programName = event.toProgramNameSnapshot,
                groupId = event.toGroupId,
                groupName = event.toGroupId?.let(groupNames::get),
                academicYear = student.academicYear,
                semesterNumber = student.semesterNumber,
                orderNumber = event.orderNumber,
                orderDate = event.orderDate,
                effectiveDate = event.effectiveDate,
                reason = event.reason,
                subjects = subjectsByStudent[studentId].orEmpty().map { enrollment ->
                    val course = enrollment.course
                    ReinstatementSubjectDto(
                        enrollmentId = requireNotNull(enrollment.id),
                        courseId = requireNotNull(course.id),
                        courseTitle = course.title.orEmpty(),
                        subjectCode = course.subject?.code,
                        subjectName = course.subject?.name
                            ?: course.subjectName?.takeIf(String::isNotBlank)
                            ?: course.title.orEmpty(),
                        academicYear = enrollment.academicYear,
                        semester = enrollment.semester,
                        credits = enrollment.credits,
                        required = enrollment.required,
                        status = enrollment.status,
                        progress = enrollment.progress,
                        enrolledAt = enrollment.enrolledAt,
                        completedAt = enrollment.completedAt,
                    )
                },
            )
        }
        return ReinstatementSubjectReportPageDto(
            items = items,
            page = events.number,
            size = events.size,
            totalElements = events.totalElements,
            totalPages = events.totalPages,
        )
    }

    /** Shu turdagi buyruqlar reyestri: har talabaning oxirgi buyrug'i, yangilari avval */
    @Transactional(readOnly = true)
    fun movements(eventType: StudentLifecycleEventType, search: String?, page: Int, size: Int): StudentMovementPageDto {
        val events = latestEvents(eventType, search, null, page, size)
        val groupIds = events.content.mapNotNull { it.toGroupId ?: it.student.groupId }.distinct()
        val groupNames = groupRepository.findAllById(groupIds).associate { requireNotNull(it.id) to it.name }
        return StudentMovementPageDto(
            items = events.content.map { event ->
                val student = event.student
                StudentMovementItemDto(
                    eventId = requireNotNull(event.id),
                    eventType = event.eventType,
                    studentId = requireNotNull(student.id),
                    studentNumber = student.studentNumber,
                    studentName = listOf(student.lastName, student.firstName, student.middleName).filterNotNull().joinToString(" "),
                    studentStatus = student.studentStatus,
                    groupName = (event.toGroupId ?: student.groupId)?.let(groupNames::get),
                    orderNumber = event.orderNumber,
                    orderDate = event.orderDate,
                    effectiveDate = event.effectiveDate,
                    reason = event.reason,
                )
            },
            page = events.number,
            size = events.size,
            totalElements = events.totalElements,
            totalPages = events.totalPages,
        )
    }

    private fun latestEvents(eventType: StudentLifecycleEventType, search: String?, academicYear: String?, page: Int, size: Int): Page<StudentLifecycleEvent> {
        require(page >= 0) { "Sahifa manfiy bo'lishi mumkin emas" }
        require(size in 10..100) { "Sahifa hajmi 10-100 oralig'ida bo'lishi shart" }
        val normalizedSearch = search?.trim()?.lowercase().orEmpty()
        require(normalizedSearch.length <= 100) { "Qidiruv matni 100 belgidan oshmasligi kerak" }
        val normalizedYear = academicYear?.trim()?.takeIf(String::isNotBlank)
        normalizedYear?.let {
            require(it.matches(Regex("\\d{4}-\\d{4}"))) { "O'quv yili YYYY-YYYY formatida bo'lishi kerak" }
            require(it.substring(5).toInt() == it.substring(0, 4).toInt() + 1) {
                "O'quv yili ketma-ket ikki yil bo'lishi kerak"
            }
        }
        return eventRepository.findLatestByEventType(
            eventType,
            normalizedSearch,
            normalizedYear,
            PageRequest.of(page, size, Sort.by(Sort.Order.desc("effectiveDate"), Sort.Order.desc("id"))),
        )
    }
}
