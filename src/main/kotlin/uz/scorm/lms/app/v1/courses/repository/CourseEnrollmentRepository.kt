package uz.scorm.lms.app.v1.courses.repository

import jakarta.persistence.LockModeType
import org.springframework.data.jpa.repository.EntityGraph
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Lock
import org.springframework.data.jpa.repository.Query
import uz.scorm.lms.app.v1.courses.model.CourseEnrollment
import uz.scorm.lms.app.v1.courses.model.CourseEnrollmentStatus

interface CourseEnrollmentRepository : JpaRepository<CourseEnrollment, Long> {
    @Query("select avg(e.progress) from CourseEnrollment e where e.course.id = :courseId and e.deleted = false and e.status in :statuses")
    fun averageProgress(courseId: Long, statuses: Collection<CourseEnrollmentStatus>): Double?

    @EntityGraph(attributePaths = ["student", "student.user", "course", "course.subject", "course.subject.program"])
    fun findAllByDeletedFalseOrderByAcademicYearDescSemesterDescEnrolledAtDesc(): List<CourseEnrollment>

    @EntityGraph(attributePaths = ["student", "student.user", "course"])
    fun findAllByCourseIdInAndAcademicYearAndStatusInAndDeletedFalse(
        courseIds: Collection<Long>,
        academicYear: String,
        statuses: Collection<CourseEnrollmentStatus>,
    ): List<CourseEnrollment>

    @EntityGraph(attributePaths = ["student", "student.user", "course"])
    fun findAllByCourseIdAndDeletedFalseOrderByEnrolledAtDesc(courseId: Long): List<CourseEnrollment>

    @EntityGraph(attributePaths = ["student", "student.user", "course"])
    fun findAllByStudentIdAndStatusInAndDeletedFalseOrderByEnrolledAtDesc(
        studentId: Long,
        statuses: Collection<CourseEnrollmentStatus>,
    ): List<CourseEnrollment>

    @EntityGraph(attributePaths = ["student", "course", "course.subject"])
    fun findAllByStudentIdInAndDeletedFalseOrderByStudentIdAscAcademicYearAscSemesterAscEnrolledAtAsc(
        studentIds: Collection<Long>,
    ): List<CourseEnrollment>

    fun findByCourseIdAndStudentId(courseId: Long, studentId: Long): CourseEnrollment?

    @EntityGraph(attributePaths = ["student", "student.user", "course"])
    fun findByCourseIdAndStudentUserIdAndStatusInAndDeletedFalse(
        courseId: Long,
        userId: Long,
        statuses: Collection<CourseEnrollmentStatus>,
    ): CourseEnrollment?

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @EntityGraph(attributePaths = ["student", "student.user", "course"])
    fun findFirstByCourseIdAndStudentUserIdAndStatusInAndDeletedFalse(
        courseId: Long,
        userId: Long,
        statuses: Collection<CourseEnrollmentStatus>,
    ): CourseEnrollment?

    fun existsByCourseIdAndStudentUserIdAndStatusInAndDeletedFalse(
        courseId: Long,
        userId: Long,
        statuses: Collection<CourseEnrollmentStatus>,
    ): Boolean

    fun countByCourseIdAndStatusAndDeletedFalse(courseId: Long, status: CourseEnrollmentStatus): Long

    fun findAllByCourseLazyDelete(courseId: Long?): List<CourseEnrollment> =
        findAllByCourseIdAndDeletedFalseOrderByEnrolledAtDesc(
            requireNotNull(courseId) { "Kurs IDsi mavjud emas" },
        )
}
