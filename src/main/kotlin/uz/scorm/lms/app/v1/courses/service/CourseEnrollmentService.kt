package uz.scorm.lms.app.v1.courses.service

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import uz.scorm.lms.app.v1.courses.dto.CourseEnrollmentDto
import uz.scorm.lms.app.v1.courses.dto.CourseEnrollmentRequest
import uz.scorm.lms.app.v1.courses.model.CourseEnrollment
import uz.scorm.lms.app.v1.courses.model.CourseEnrollmentStatus
import uz.scorm.lms.app.v1.courses.model.CourseStatus
import uz.scorm.lms.app.v1.courses.repository.CourseEnrollmentRepository
import uz.scorm.lms.app.v1.student.repository.StudentRepository
import uz.scorm.lms.app.v1.subjectgroup.repository.AcademicSubjectGroupMembershipRepository
import java.time.Instant

@Service
class CourseEnrollmentService(
    private val enrollmentRepository: CourseEnrollmentRepository,
    private val studentRepository: StudentRepository,
    private val accessService: CourseAccessService,
    private val compatibilityService: ContentCompatibilityService,
    private val subjectGroupMemberships: AcademicSubjectGroupMembershipRepository,
) {
    @Transactional(readOnly = true)
    fun list(courseId: Long, userId: Long, mayManageAll: Boolean): List<CourseEnrollmentDto> {
        accessService.requireManage(courseId, userId, mayManageAll)
        return enrollmentRepository.findAllByCourseIdAndDeletedFalseOrderByEnrolledAtDesc(courseId).map(::toDto)
    }

    @Transactional
    fun enroll(courseId: Long, studentIds: Set<Long>, userId: Long, mayManageAll: Boolean): List<CourseEnrollmentDto> {
        return enroll(courseId, CourseEnrollmentRequest(studentIds), userId, mayManageAll)
    }

    @Transactional
    fun enroll(courseId: Long, request: CourseEnrollmentRequest, userId: Long, mayManageAll: Boolean): List<CourseEnrollmentDto> {
        require(request.studentIds.isNotEmpty()) { "Kamida bitta talaba tanlang" }
        require(request.studentIds.size <= 500) { "Bir so'rovda 500 tadan ortiq talaba biriktirilmaydi" }
        require(request.semester in 1..20) { "Semestr 1 dan 20 gacha bo'lishi kerak" }
        require(request.credits in 0..100) { "Kredit 0 dan 100 gacha bo'lishi kerak" }
        request.academicYear?.takeIf(String::isNotBlank)?.let {
            require(it.matches(Regex("\\d{4}-\\d{4}"))) { "O'quv yili YYYY-YYYY formatida bo'lishi kerak" }
        }
        val course = accessService.requireManage(courseId, userId, mayManageAll)
        require(course.status != CourseStatus.ARCHIVED.name) { "Arxivlangan kursga talaba biriktirilmaydi" }

        val saved = request.studentIds.map { studentId ->
            val student = studentRepository.findById(studentId)
                .orElseThrow { NoSuchElementException("Talaba topilmadi: $studentId") }
            require(!student.lmsOrientationRequired) {
                "559-son qarorning 21-bandiga ko'ra talaba LMS bilan shaxsan tanishtirilib, yo'riqnomani tasdiqlamaguncha kursga biriktirilmaydi"
            }
            compatibilityService.requireEnrollmentCompatible(course, student)
            val curriculumItem = course.subjectGroup?.curriculumSubject
            if (course.subjectGroup != null) {
                require(subjectGroupMemberships.findBySubjectGroupIdAndStudentId(
                    requireNotNull(course.subjectGroup?.id), studentId,
                ) != null) { "Talaba kursning fan guruhiga biriktirilmagan" }
            }
            val item = enrollmentRepository.findByCourseIdAndStudentId(courseId, studentId)
                ?: CourseEnrollment(course = course, student = student)
            item.deleted = false
            item.status = CourseEnrollmentStatus.ACTIVE
            item.completedAt = null
            item.academicYear = curriculumItem?.curriculumVersion?.academicYear
                ?: request.academicYear?.takeIf(String::isNotBlank)
                ?: student.academicYear?.takeIf(String::isNotBlank)
                ?: currentAcademicYear()
            item.semester = curriculumItem?.semester ?: request.semester
            item.credits = curriculumItem?.creditsSnapshot ?: request.credits
            item.required = curriculumItem?.planItemType?.name?.let { it == "REQUIRED" } ?: request.required
            if (item.enrolledAt.isAfter(Instant.now())) item.enrolledAt = Instant.now()
            enrollmentRepository.save(item)
        }
        return saved.map(::toDto)
    }

    @Transactional
    fun withdraw(courseId: Long, studentId: Long, userId: Long, mayManageAll: Boolean) {
        accessService.requireManage(courseId, userId, mayManageAll)
        val item = enrollmentRepository.findByCourseIdAndStudentId(courseId, studentId)
            ?: throw NoSuchElementException("Talaba kursga biriktirilmagan")
        item.status = CourseEnrollmentStatus.WITHDRAWN
        enrollmentRepository.save(item)
    }

    private fun toDto(item: CourseEnrollment): CourseEnrollmentDto = CourseEnrollmentDto(
        id = requireNotNull(item.id),
        courseId = requireNotNull(item.course.id),
        studentId = requireNotNull(item.student.id),
        studentNumber = item.student.studentNumber,
        studentName = listOf(item.student.lastName, item.student.firstName, item.student.middleName)
            .filterNotNull().joinToString(" "),
        status = item.status.name.lowercase(),
        progress = item.progress,
        academicYear = item.academicYear,
        semester = item.semester,
        credits = item.credits,
        required = item.required,
        enrolledAt = item.enrolledAt,
        completedAt = item.completedAt,
    )

    private fun currentAcademicYear(): String {
        val today = java.time.LocalDate.now()
        val start = if (today.monthValue >= 9) today.year else today.year - 1
        return "$start-${start + 1}"
    }
}
