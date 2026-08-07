package uz.scorm.lms.app.v1.program.repository

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Lock
import org.springframework.data.jpa.repository.Query
import jakarta.persistence.LockModeType
import uz.scorm.lms.app.v1.program.model.Program

interface ProgramRepository : JpaRepository<Program, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Program p where p.id = :id")
    fun findByIdForUpdate(id: Long): Program?

    fun countByDeletedFalse(): Long
    fun existsByCode(code: String): Boolean
    fun findAllByDepartmentId(departmentId: Long): List<Program>
    fun findAllByDistanceEnabledTrue(): List<Program>
}
