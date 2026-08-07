package uz.scorm.lms.app.v1.practice.repository

import org.springframework.data.jpa.repository.JpaRepository
import uz.scorm.lms.app.v1.practice.model.StudentPracticePlacement
import uz.scorm.lms.app.v1.practice.model.StudentPracticeStatus

interface StudentPracticeRepository : JpaRepository<StudentPracticePlacement, Long> {
    fun findByIdAndDeletedFalse(id: Long): StudentPracticePlacement?
    fun findAllByDeletedFalseOrderByStartsOnDesc(): List<StudentPracticePlacement>
    fun findAllByStudentIdAndDeletedFalseOrderByStartsOnDesc(studentId: Long): List<StudentPracticePlacement>
    fun existsByStudentIdAndAcademicYearAndPlanReferenceAndDeletedFalseAndStatusNot(
        studentId: Long,
        academicYear: String,
        planReference: String,
        status: StudentPracticeStatus,
    ): Boolean
    fun countByStatusAndDeletedFalse(status: StudentPracticeStatus): Long
}

