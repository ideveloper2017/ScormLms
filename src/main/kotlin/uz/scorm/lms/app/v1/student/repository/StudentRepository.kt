package uz.scorm.lms.app.v1.student.repository

import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import uz.scorm.lms.app.v1.student.model.StudentProfile
import uz.scorm.lms.app.v1.student.model.StudentStatus

interface StudentRepository : JpaRepository<StudentProfile, Long> {
    fun findByUserUsername(username: String): StudentProfile?
    fun findByUserId(userId: Long): StudentProfile?
    fun findByPinfl(pinfl: String): StudentProfile?
    fun findByStudentNumber(studentNumber: String): StudentProfile?
    fun existsByPinfl(pinfl: String): Boolean
    fun existsByStudentNumber(studentNumber: String): Boolean

    fun findAllByStudentStatus(status: StudentStatus, pageable: Pageable): Page<StudentProfile>

    @Query("SELECT s FROM StudentProfile s WHERE s.facultyId = :facultyId")
    fun findByFacultyId(facultyId: Long, pageable: Pageable): Page<StudentProfile>

    @Query("SELECT s FROM StudentProfile s WHERE s.groupId = :groupId")
    fun findByGroupId(groupId: Long): List<StudentProfile>
}