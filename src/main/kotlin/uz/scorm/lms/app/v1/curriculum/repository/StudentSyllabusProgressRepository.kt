package uz.scorm.lms.app.v1.curriculum.repository

import org.springframework.data.jpa.repository.JpaRepository
import uz.scorm.lms.app.v1.curriculum.model.StudentSyllabusProgress

interface StudentSyllabusProgressRepository : JpaRepository<StudentSyllabusProgress, Long> {
    fun findAllByStudentIdAndMaterialIdIn(studentId: Long, materialIds: Collection<Long>): List<StudentSyllabusProgress>
    fun existsByStudentIdAndMaterialId(studentId: Long, materialId: Long): Boolean
}
