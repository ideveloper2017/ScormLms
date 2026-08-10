package uz.scorm.lms.app.v1.academicperiod.repository

import jakarta.persistence.LockModeType
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Lock
import org.springframework.data.jpa.repository.Query
import uz.scorm.lms.app.v1.academicperiod.model.AcademicSemesterDefinition
import uz.scorm.lms.app.v1.academicperiod.model.AcademicYearPeriod

interface AcademicYearPeriodRepository : JpaRepository<AcademicYearPeriod, Long> {
    fun findAllByDeletedFalseOrderByCodeDesc(): List<AcademicYearPeriod>
    fun findByCodeAndDeletedFalse(code: String): AcademicYearPeriod?
    fun findByIdAndDeletedFalse(id: Long): AcademicYearPeriod?

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select year from AcademicYearPeriod year where year.deleted = false order by year.id")
    fun findAllForCurrentUpdate(): List<AcademicYearPeriod>
}

interface AcademicSemesterDefinitionRepository : JpaRepository<AcademicSemesterDefinition, Long> {
    fun findAllByDeletedFalseOrderBySemesterNumberAsc(): List<AcademicSemesterDefinition>
    fun findBySemesterNumberAndDeletedFalse(semesterNumber: Int): AcademicSemesterDefinition?
    fun findByIdAndDeletedFalse(id: Long): AcademicSemesterDefinition?
}
