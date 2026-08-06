package uz.scorm.lms.app.v1.courses.service

import org.springframework.stereotype.Service
import uz.scorm.lms.app.v1.courses.model.Course
import uz.scorm.lms.app.v1.courses.model.CourseEnrollmentStatus
import uz.scorm.lms.app.v1.courses.model.CourseStatus
import uz.scorm.lms.app.v1.courses.repository.CourseEnrollmentRepository
import uz.scorm.lms.app.v1.courses.repository.CourseRepository

@Service
class CourseAccessService(
    private val courseRepository: CourseRepository,
    private val enrollmentRepository: CourseEnrollmentRepository,
) {
    fun course(courseId: Long): Course = courseRepository.findById(courseId)
        .filter { !it.deleted }
        .orElseThrow { NoSuchElementException("Kurs topilmadi: $courseId") }

    fun requireManage(courseId: Long?, userId: Long, mayManageAll: Boolean): Course {
        val course = course(requireNotNull(courseId) { "Kurs IDsi mavjud emas" })
        require(mayManageAll || course.userId == userId) { "Kursni boshqarish ruxsati yo'q" }
        return course
    }

    fun requireRead(courseId: Long?, userId: Long, mayManageAll: Boolean): Course {
        val resolvedCourseId = requireNotNull(courseId) { "Kurs IDsi mavjud emas" }
        val course = course(resolvedCourseId)
        if (mayManageAll || course.userId == userId) return course
        require(course.status == CourseStatus.PUBLISHED.name && enrollmentRepository
            .existsByCourseIdAndStudentUserIdAndStatusInAndDeletedFalse(
                resolvedCourseId,
                userId,
                setOf(CourseEnrollmentStatus.ACTIVE, CourseEnrollmentStatus.COMPLETED),
            )) { "Kursga kirish uchun faol biriktirish talab qilinadi" }
        return course
    }

    fun requireView(courseId: Long?, userId: Long, mayManageAll: Boolean): Course =
        requireRead(courseId, userId, mayManageAll)
}
